import { useEffect, useRef, useState } from 'react'
import { Datum } from '@nivo/bullet'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  SdParameterType,
  StatisticsOperation,
  SdTypeParametersWithSnapshotsQuery,
  useSdTypeParametersWithSnapshotsQuery,
  useStatisticsQuerySensorsWithFieldsLazyQuery,
  SdInstancesWithParamsQuery
} from '@/generated/graphql'
import { z } from 'zod'
import { BulletCardConfig, bulletChartBuilderSchema } from '@/schemas/dashboard/BulletChartBuilderSchema'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useFieldArray } from 'react-hook-form'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectValue, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select'
import { TbTrash } from 'react-icons/tb'
import { IoAdd } from 'react-icons/io5'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { BuilderResult } from '@/types/dashboard/GridItem'
import { SingleInstanceCombobox } from './components/single-instance-combobox'
import { SingleParameterCombobox } from './components/single-parameter-combobox'
import { TimeFrameSelector } from './components/time-frame-selector'
import { useInstances } from '@/context/InstancesContext'
import { useParameterSnapshotContext } from '@/context/ParameterUpdatesContext'
import { AggregateFunctionCombobox } from './components/aggregate-function-combobox'
import { ResponsiveBulletChart } from '../visualizations/ResponsiveBulletChart'
import { Label } from '@/components/ui/label'
import { ResponsiveTooltip } from '@/components/responsive-tooltip'
import { InfoIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

type BulletChartBuilderResult = BuilderResult<BulletCardConfig>

export interface BulletChartBuilderProps {
  onDataSubmit: (data: BulletChartBuilderResult) => void
  config?: BulletCardConfig
}

export function BulletChartBuilder({ onDataSubmit, config }: BulletChartBuilderProps) {
  const parameterNameMock = useRef<HTMLSpanElement | null>(null)
  const { getInstanceByUid } = useInstances()
  const { getParameterSnapshot } = useParameterSnapshotContext()
  const [selectedInstance, setSelectedInstance] = useState<SdInstancesWithParamsQuery['sdInstances'][number] | null>(
    null
  )
  const [availableParameters, setAvailableParameters] = useState<{
    [key: string]: SdTypeParametersWithSnapshotsQuery['sdType']['parameters']
  }>({})
  const [getChartData] = useStatisticsQuerySensorsWithFieldsLazyQuery()
  const [data, setData] = useState<Datum[]>([])
  const [rangeInput, setRangeInput] = useState<string>('')
  const [markerInput, setMarkerInput] = useState<string>('')
  const [smartRangeDialog, setSmartRangeDialog] = useState<{ open: boolean; rowIndex: number | null }>({
    open: false,
    rowIndex: null
  })

  const form = useForm<z.infer<typeof bulletChartBuilderSchema>>({
    resolver: zodResolver(bulletChartBuilderSchema),
    defaultValues: config || {
      cardTitle: 'Bullet Charts',
      rows: [
        {
          instance: { uid: '' },
          parameter: { denotation: '', id: null },
          config: {
            name: '',
            function: '',
            timeFrame: '24',
            decimalPlaces: 2,
            minValue: 'auto',
            maxValue: 'auto',
            reverse: false,
            measureSize: 0.2,
            markers: [],
            margin: { top: 10, right: 10, bottom: 20, left: 30 },
            titleOffsetX: -5,
            colorScheme: 'nivo'
          }
        }
      ]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'rows'
  })

  useEffect(() => {
    if (config) {
      config.rows.forEach((_, index) => {
        checkRowAndFetch(index)
      })
    }
  }, [config])

  const generateRangesAndTarget = async (rowIndex: number) => {
    const row = form.getValues(`rows.${rowIndex}`)

    if (!row?.instance?.uid || !row?.parameter?.denotation) {
      // should not happen, but we cannot fetch without this,
      // the checkRowAndFetch function should prevent this
      toast.error('Please select an instance and parameter first')
      return
    }

    toast.loading('Analyzing parameter data...', { id: 'range-generator' })

    try {
      // Fetch min, max, and avg values for the parameter
      const results = await Promise.allSettled([
        // Min
        getChartData({
          variables: {
            sensors: {
              sensors: [{ key: row.instance.uid, values: [row.parameter.denotation] }]
            },
            request: {
              from: new Date(Date.now() - Number(row.config.timeFrame!) * 2 * 60 * 60 * 1000).toISOString(), // Use 24h for stats
              aggregateMinutes: Number(row.config.timeFrame!) * 2 * 60 * 1000,
              operation: StatisticsOperation.Min
            }
          }
        }),
        // Max
        getChartData({
          variables: {
            sensors: {
              sensors: [{ key: row.instance.uid, values: [row.parameter.denotation] }]
            },
            request: {
              from: new Date(Date.now() - Number(row.config.timeFrame!) * 2 * 60 * 60 * 1000).toISOString(), // Use 24h for stats
              aggregateMinutes: Number(row.config.timeFrame!) * 2 * 60 * 1000,
              operation: StatisticsOperation.Max
            }
          }
        }),
        // Mean
        getChartData({
          variables: {
            sensors: {
              sensors: [{ key: row.instance.uid, values: [row.parameter.denotation] }]
            },
            request: {
              from: new Date(Date.now() - Number(row.config.timeFrame!) * 2 * 60 * 60 * 1000).toISOString(), // Use 24h for stats
              aggregateMinutes: Number(row.config.timeFrame!) * 2 * 60 * 1000,
              operation: StatisticsOperation.Mean
            }
          }
        })
      ])

      const minResult =
        results[0].status === 'fulfilled' ? results[0].value.data?.statisticsQuerySensorsWithFields[0]?.data : null
      const maxResult =
        results[1].status === 'fulfilled' ? results[1].value.data?.statisticsQuerySensorsWithFields[0]?.data : null
      const meanResult =
        results[2].status === 'fulfilled' ? results[2].value.data?.statisticsQuerySensorsWithFields[0]?.data : null

      if (!minResult || !maxResult || !meanResult) {
        toast.error('Not enough data to suggest ranges', { id: 'range-generator' })
        return
      }

      const minValue = JSON.parse(minResult)[row.parameter.denotation]
      const maxValue = JSON.parse(maxResult)[row.parameter.denotation]
      const meanValue = JSON.parse(meanResult)[row.parameter.denotation]

      if (minValue === undefined || maxValue === undefined || meanValue === undefined) {
        toast.error('Could not extract parameter values', { id: 'range-generator' })
        return
      }

      const totalRange = maxValue - minValue
      const buffer = totalRange * 0.1

      const round = (value: number) => {
        const precision = totalRange > 100 ? 0 : totalRange > 10 ? 1 : 2
        return Number(value.toFixed(precision))
      }

      const roundedMin = round(Math.max(0, minValue - buffer))

      // get the size of a single range, we want 3 ranges
      const rangeSize = round((maxValue + buffer - roundedMin) / 3)

      const ranges = [
        { min: roundedMin, max: round(roundedMin + rangeSize) },
        { min: round(roundedMin + rangeSize), max: round(roundedMin + 2 * rangeSize) },
        { min: round(roundedMin + 2 * rangeSize), max: round(maxValue + buffer) }
      ]

      // Target somewhere between the max and the mean
      const target = round(meanValue + (maxValue - meanValue) * 0.7)
      const markers = [target]

      form.setValue(`rows.${rowIndex}.config.ranges`, ranges)
      form.setValue(`rows.${rowIndex}.config.markers`, markers)
      form.setValue(`rows.${rowIndex}.config.minValue`, roundedMin)
      form.setValue(`rows.${rowIndex}.config.maxValue`, Number(parseFloat(maxValue + buffer).toFixed(2)))

      // Set the inputs, so that the user can change them easily
      setRangeInput(ranges.map((r) => `${r.min}:${r.max}`).join(','))
      setMarkerInput(markers.join(','))

      handleDataChange(
        rowIndex,
        ranges.flatMap((range) => [range.min, range.max]),
        markers
      )

      toast.success('Ranges generated! Feel free to adjust them to your liking.', { id: 'range-generator' })
    } catch (error) {
      console.error('Error generating ranges:', error)
      toast.error('Failed to generate ranges', { id: 'range-generator' })
    }
  }

  const fetchRowData = async (rowIndex: number) => {
    const row = form.getValues(`rows.${rowIndex}`)

    try {
      // 'last' function uses snapshot data
      if (row.config.function === 'last') {
        const instance = getInstanceByUid(row.instance.uid)
        if (!instance) return

        const snapshot = getParameterSnapshot(instance.id!, row.parameter.id!)

        if (snapshot?.number !== undefined) {
          setData((prev) => {
            const newData = [...prev]
            newData[rowIndex] = {
              id: row.config.name || row.parameter.denotation,
              ranges: [
                ...(row.config.ranges || []).flatMap((range: { min: number; max: number }) => [range.min, range.max]),
                0,
                0
              ],
              measures: [snapshot.number!],
              markers: row.config.markers || []
            }
            return newData
          })
        } else {
          toast.error(`No snapshot data available for ${instance.userIdentifier} - ${row.parameter.denotation}`)
        }
        return
      }

      // other functions using statistics API
      const result = await getChartData({
        variables: {
          sensors: {
            sensors: [{ key: row.instance.uid, values: [row.parameter.denotation] }]
          },
          request: {
            from: new Date(Date.now() - Number(row.config.timeFrame) * 60 * 60 * 1000).toISOString(),
            aggregateMinutes: Number(row.config.timeFrame) * 60 * 1000,
            operation: row.config.function as StatisticsOperation
          }
        }
      })

      if (result.data?.statisticsQuerySensorsWithFields.length! > 0) {
        const parsedValue = result.data?.statisticsQuerySensorsWithFields[0]?.data
          ? JSON.parse(result.data?.statisticsQuerySensorsWithFields[0].data)
          : null

        const value = parsedValue ? parsedValue[row.parameter.denotation] : undefined

        if (value !== undefined) {
          setData((prev) => {
            const newData = [...prev]
            newData[rowIndex] = {
              id: row.config.name || row.parameter.denotation,
              ranges: [
                ...(row.config.ranges || []).flatMap((range: { min: number; max: number }) => [range.min, range.max]),
                0,
                0
              ],
              measures: [value],
              markers: row.config.markers || []
            }
            return newData
          })
        }
      }
    } catch (error) {
      const instance = getInstanceByUid(row.instance.uid)
      toast.error(
        `Failed to fetch data for '${instance?.userIdentifier || row.instance.uid} - ${row.parameter.denotation}'`
      )
      console.error('Fetch error:', error)
    }
  }

  const checkRowAndFetch = (rowIndex: any) => {
    // Check if row at index is valid and fetch data
    const row = form.getValues(`rows.${rowIndex}`)
    const valid =
      row?.instance?.uid &&
      row?.parameter?.denotation &&
      row?.config?.function &&
      (row.config.function !== 'last' ? row.config.timeFrame : true)

    if (valid && !config?.rows[rowIndex].instance.id) {
      setSmartRangeDialog({
        open: true,
        rowIndex
      })
    }

    if (valid) {
      fetchRowData(rowIndex)
    }
  }

  const { data: parametersData, refetch: refetchParameters } = useSdTypeParametersWithSnapshotsQuery({
    variables: { sdTypeId: selectedInstance?.type.id! },
    skip: !selectedInstance
  })

  useEffect(() => {
    if (parametersData && selectedInstance) {
      setAvailableParameters((prev) => ({
        ...prev,
        [selectedInstance.type.id]: parametersData.sdType.parameters
      }))
    }
  }, [parametersData, selectedInstance])

  useEffect(() => {
    if (config) {
      config.rows.forEach((row) => {
        const instance = getInstanceByUid(row.instance.uid)
        if (instance) {
          refetchParameters({ sdTypeId: instance.type.id }).then((result) => {
            setAvailableParameters((prev) => ({
              ...prev,
              [instance.type.id]: result.data.sdType.parameters
            }))
          })
        }
      })

      setMarkerInput(
        config.rows
          .map((row) => row.config.markers)
          .flat()
          .join(', ')
      )

      setRangeInput(
        config.rows
          .map((row) => row.config.ranges)
          .flat()
          .map((range) => (range ? `${range.min}:${range.max}` : ''))
          .filter(Boolean)
          .join(', ')
      )

      config.rows.forEach((_, index) => {
        fetchRowData(index)
      })
    }
  }, [config, refetchParameters])

  const getParameterOptions = (instanceUID: string) => {
    const instance = getInstanceByUid(instanceUID)
    if (!instance) return []
    const parameters = availableParameters[instance.type?.id!]
    if (!parameters) return []
    return parameters.filter((param) => param.type === SdParameterType.Number)
  }

  const handleDataChange = (
    index: number,
    ranges?: number[],
    markers?: number[],
    measures?: number[],
    id?: string
  ): void => {
    const newData = [...data]
    if (!newData[index]) return
    if (ranges) newData[index].ranges = ranges
    if (markers) newData[index].markers = markers
    if (measures) newData[index].measures = measures
    if (id) newData[index].id = id.trim()
    setData(newData)
  }

  const automaticOffset = (index: number, name: string) => {
    if (!parameterNameMock.current) return
    parameterNameMock.current.innerText = name
    const width = parameterNameMock.current.offsetWidth + 5
    form.setValue(`rows.${index}.config.margin.left`, width + 5)
  }

  const handleSubmit = (values: z.infer<typeof bulletChartBuilderSchema>) => {
    const result: BulletChartBuilderResult = {
      config: values,
      sizing: {
        h: values.rows.length,
        w: 2
      }
    }

    onDataSubmit(result)
  }

  return (
    <div className="w-full">
      <span
        className="invisible absolute left-1/2 top-0 -translate-x-1/2 transform text-[11px] font-semibold"
        ref={parameterNameMock}
      >
        {parameterNameMock.current?.innerText}
      </span>
      <Card className="h-fit w-full">
        {form.watch('cardTitle') ? <h3 className="ml-2 text-lg font-semibold">{form.watch('cardTitle')}</h3> : null}
        {fields.map((_, index) => {
          const row = form.getValues(`rows.${index}`)
          if (!data[index]) return null

          // key, the chart does not re-render when the config changes
          const renderKey = JSON.stringify({
            margin: row.config.margin,
            measureSize: row.config.measureSize,
            titleOffsetX: row.config.titleOffsetX,
            reverse: row.config.reverse,
            colorScheme: row.config.colorScheme
          })

          return (
            <div className="relative h-[70px] w-full" key={index}>
              <div className="absolute inset-0">
                <ResponsiveBulletChart key={`${index}-${renderKey}`} data={data[index]} rowConfig={row} />
              </div>
            </div>
          )
        })}
      </Card>
      <Card className="mt-4 h-fit w-full overflow-hidden p-2 pt-0 shadow-lg">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
              }
            }}
          >
            <div className="grid grid-cols-1 pt-2 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="cardTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="Enter title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Accordion type="single" collapsible className="mt-4 w-full">
              <AccordionItem value="instances">
                <AccordionTrigger>Instances</AccordionTrigger>
                <AccordionContent className="w-full">
                  {fields.map((item, index) => (
                    <div key={item.id} className="relative mb-4 rounded-lg border p-4">
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => {
                          setData((prev) => prev.filter((_, i) => i !== index))
                          remove(index)
                        }}
                        className="absolute right-0 top-0"
                      >
                        <TbTrash />
                      </Button>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name={`rows.${index}.instance`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Instance</FormLabel>
                              <FormControl>
                                <SingleInstanceCombobox
                                  onValueChange={(instance) => {
                                    setSelectedInstance(instance)
                                    field.onChange(instance)
                                    form.setValue(`rows.${index}.parameter`, { denotation: '', id: null })
                                    checkRowAndFetch(index)
                                  }}
                                  value={field.value.id}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`rows.${index}.parameter`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Parameter</FormLabel>
                              <FormControl>
                                <SingleParameterCombobox
                                  value={field.value}
                                  onValueChange={(value) => {
                                    form.setValue(`rows.${index}.config.name`, value?.denotation!)
                                    automaticOffset(index, value?.denotation!)
                                    handleDataChange(index, undefined, undefined, undefined, value?.denotation)
                                    field.onChange(value)
                                    checkRowAndFetch(index)
                                  }}
                                  options={
                                    form.watch(`rows.${index}.instance.uid`)
                                      ? getParameterOptions(form.watch(`rows.${index}.instance.uid`))
                                      : []
                                  }
                                  disabled={!form.getValues(`rows.${index}.instance.uid`)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`rows.${index}.config.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Display name"
                                  {...field}
                                  className="h-9"
                                  onChange={(e) => {
                                    field.onChange(e.target.value)
                                    automaticOffset(index, e.target.value)
                                    handleDataChange(index, undefined, undefined, undefined, e.target.value)
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`rows.${index}.config.function`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Function</FormLabel>
                              <FormControl>
                                <AggregateFunctionCombobox
                                  value={field.value}
                                  onValueChange={(value) => {
                                    field.onChange(value)
                                    if (value === 'last') {
                                      form.setValue(`rows.${index}.config.timeFrame`, '24')
                                    }
                                    checkRowAndFetch(index)
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {form.watch(`rows.${index}.config.function`) !== 'last' &&
                          form.watch(`rows.${index}.config.function`) !== '' && (
                            <FormField
                              control={form.control}
                              name={`rows.${index}.config.timeFrame`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Time Frame</FormLabel>
                                  <FormControl>
                                    <TimeFrameSelector
                                      value={field.value}
                                      onValueChange={(value) => {
                                        field.onChange(value)
                                        checkRowAndFetch(index)
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        <FormField
                          control={form.control}
                          name={`rows.${index}.config.decimalPlaces`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Decimal Places</FormLabel>
                              <FormControl>
                                <Input
                                  value={field.value}
                                  type="number"
                                  min={0}
                                  onChange={(e) => {
                                    field.onChange(e.target.value)
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <Accordion type="single" collapsible className="mt-4 w-full">
                        <AccordionItem value="ranges">
                          <AccordionTrigger>Ranges</AccordionTrigger>
                          <AccordionContent className="w-full">
                            <FormField
                              control={form.control}
                              name={`rows.${index}.config.ranges`}
                              render={({ field }) => (
                                <FormItem>
                                  {field.value?.map((range, rangeIndex) => (
                                    <Badge key={rangeIndex} className="mr-2 border-[1px]">
                                      {range.min} : {range.max}
                                      <TbTrash
                                        className="ml-2 cursor-pointer text-destructive"
                                        onClick={() => {
                                          if (!field.value) return
                                          const newRanges = field.value?.filter((_, i) => i !== rangeIndex)
                                          field.onChange(newRanges)
                                          setRangeInput(
                                            newRanges
                                              .map((r: { min: number; max: number }) => `${r.min}:${r.max}`)
                                              .join(', ')
                                          )
                                          handleDataChange(
                                            index,
                                            newRanges.flatMap((range) => [range.min, range.max]),
                                            undefined
                                          )
                                        }}
                                      />
                                    </Badge>
                                  ))}
                                  <FormControl>
                                    <Input
                                      type="text"
                                      placeholder="Format: '10:20,20:30,...'"
                                      onChange={(e) => {
                                        setRangeInput(e.target.value)
                                        const newRanges = e.target.value
                                          .split(',')
                                          .map((range) => {
                                            const [min, max] = range.split(':').map((value) => Number(value.trim()))
                                            if (!isNaN(min) && !isNaN(max)) {
                                              return { min, max }
                                            }
                                            return null
                                          })
                                          .filter(Boolean)
                                        field.onChange(newRanges)
                                        handleDataChange(
                                          index,
                                          newRanges.flatMap((range) => [range!.min, range!.max]),
                                          undefined
                                        )
                                      }}
                                      value={rangeInput}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </AccordionContent>
                        </AccordionItem>
                        {form.formState.errors?.rows?.[index]?.config?.ranges && (
                          <FormMessage>{form.formState.errors.rows[index].config.ranges.message}</FormMessage>
                        )}
                        <AccordionItem value="markers">
                          <AccordionTrigger>Targets</AccordionTrigger>
                          <AccordionContent className="w-full">
                            <FormField
                              control={form.control}
                              name={`rows.${index}.config.markers`}
                              render={({ field }) => (
                                <FormItem>
                                  {field.value?.map((marker, markerIndex) => (
                                    <Badge key={markerIndex} className="mr-2 border-[1px]">
                                      {marker}
                                      <TbTrash
                                        className="ml-2 cursor-pointer text-destructive"
                                        onClick={() => {
                                          const newMarkers = field.value?.filter((_, i) => i !== markerIndex)
                                          field.onChange(newMarkers)
                                          setMarkerInput(newMarkers.join(', '))
                                          handleDataChange(index, undefined, newMarkers, undefined)
                                        }}
                                      />
                                    </Badge>
                                  ))}
                                  <FormControl>
                                    <Input
                                      type="text"
                                      placeholder="Format : '100,20,30,...'"
                                      onChange={(e) => {
                                        setMarkerInput(e.target.value)
                                        const newMarkers = e.target.value
                                          .split(',')
                                          .map((marker) => {
                                            const value = Number(marker.trim())
                                            if (!isNaN(value)) {
                                              return value
                                            }
                                            return null
                                          })
                                          .filter((marker): marker is number => marker !== null)
                                        field.onChange(newMarkers)
                                        handleDataChange(index, undefined, newMarkers, undefined)
                                      }}
                                      value={markerInput}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </AccordionContent>
                        </AccordionItem>
                        {form.formState.errors?.rows?.[index]?.config?.markers && (
                          <FormMessage>{form.formState.errors.rows[index].config.markers.message}</FormMessage>
                        )}
                        <AccordionItem value="advanced">
                          <AccordionTrigger>Advanced Options</AccordionTrigger>
                          <AccordionContent className="grid w-full grid-cols-1 gap-4 p-1 sm:grid-cols-2">
                            <FormField
                              control={form.control}
                              name={`rows.${index}.config.colorScheme`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Color Scheme</FormLabel>
                                  <FormControl>
                                    <Select onValueChange={(value) => field.onChange(value)} value={field.value || ''}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Choose a color scheme" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="greys">Black & White</SelectItem>
                                        <SelectItem value="nivo">Colorful</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`rows.${index}.config.reverse`}
                              render={({ field }) => (
                                <FormItem className="flex h-full flex-col">
                                  <FormLabel className="flex items-center gap-2">
                                    <p>Reverse Chart</p>
                                    <ResponsiveTooltip
                                      content={
                                        <div>
                                          <p>Reverses the chart direction.</p>
                                          <p>
                                            Useful when dealing with <b>negative</b> values.
                                          </p>
                                        </div>
                                      }
                                    >
                                      <InfoIcon size={16} />
                                    </ResponsiveTooltip>
                                  </FormLabel>
                                  <FormControl>
                                    <Label className="my-auto flex h-full items-center">
                                      <Checkbox
                                        onCheckedChange={(checked) => field.onChange(checked)}
                                        checked={field.value}
                                      />
                                      <Label className="ml-2">Reverse chart direction</Label>
                                    </Label>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`rows.${index}.config.measureSize`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Measure Size</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min={0}
                                      step={0.05}
                                      max={1}
                                      placeholder="Enter measure size"
                                      onChange={(e) => {
                                        field.onChange(Number(e.target.value))
                                      }}
                                      value={field.value}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`rows.${index}.config.titleOffsetX`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Title Offset X</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      placeholder="Enter title offset X"
                                      value={field.value}
                                      onChange={(e) => {
                                        console.log(form.getValues(`rows.${index}`))
                                        field.onChange(Number(e.target.value))
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`rows.${index}.config.minValue`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center justify-between gap-2">
                                    Min Value
                                    <div className="flex items-center gap-2">
                                      Auto
                                      <Checkbox
                                        onCheckedChange={(checked) => {
                                          field.onChange(checked ? 'auto' : undefined)
                                        }}
                                        checked={field.value === 'auto'}
                                      />
                                    </div>
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      placeholder="Enter min value"
                                      onChange={(e) => field.onChange(Number(e.target.value))}
                                      disabled={field.value === 'auto'}
                                      value={field.value === 'auto' ? undefined : field.value}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`rows.${index}.config.maxValue`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center justify-between gap-2">
                                    Max Value
                                    <div className="flex items-center gap-2">
                                      Auto
                                      <Checkbox
                                        onCheckedChange={(checked) => {
                                          field.onChange(checked ? 'auto' : undefined)
                                        }}
                                        checked={field.value === 'auto'}
                                      />
                                    </div>
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      placeholder="Enter max value"
                                      onChange={(e) => field.onChange(Number(e.target.value))}
                                      disabled={field.value === 'auto'}
                                      value={field.value === 'auto' ? undefined : field.value}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`rows.${index}.config.margin.top`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Margin Top</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      placeholder="Enter margin top"
                                      onChange={(e) => field.onChange(Number(e.target.value))}
                                      value={field.value}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`rows.${index}.config.margin.right`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Margin Right</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      placeholder="Enter margin right"
                                      onChange={(e) => field.onChange(Number(e.target.value))}
                                      value={field.value}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`rows.${index}.config.margin.bottom`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Margin Bottom</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      placeholder="Enter margin bottom"
                                      onChange={(e) => field.onChange(Number(e.target.value))}
                                      value={field.value}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`rows.${index}.config.margin.left`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Margin Left</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      placeholder="Enter margin left"
                                      onChange={(e) => field.onChange(Number(e.target.value))}
                                      value={field.value}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="green"
                    className="m-auto mt-4 flex w-1/2 items-center justify-center"
                    onClick={() => {
                      append({
                        instance: { uid: '', id: null },
                        parameter: { denotation: '', id: null },
                        config: {
                          name: '',
                          margin: { top: 10, right: 10, bottom: 30, left: 10 },
                          reverse: false,
                          decimalPlaces: 2,
                          function: '',
                          minValue: 'auto',
                          maxValue: 'auto',
                          timeFrame: '24',
                          measureSize: 0.2,
                          markers: []
                        }
                      })
                    }}
                  >
                    <IoAdd />
                    Add Instance
                  </Button>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            <Button type="submit" className="mx-auto mt-4 flex w-3/4 justify-center">
              Submit
            </Button>
          </form>
        </Form>
      </Card>
      <Dialog open={smartRangeDialog.open} onOpenChange={(open) => setSmartRangeDialog((prev) => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Ranges and Target</DialogTitle>
            <DialogDescription>
              Would you like to automatically generate ranges and targets based on historical data?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSmartRangeDialog({ open: false, rowIndex: null })}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (smartRangeDialog.rowIndex !== null) {
                  generateRangesAndTarget(smartRangeDialog.rowIndex)
                }
                setSmartRangeDialog({ open: false, rowIndex: null })
              }}
            >
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

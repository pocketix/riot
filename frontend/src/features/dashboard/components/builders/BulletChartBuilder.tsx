import { useEffect, useRef, useState } from 'react'
import { ResponsiveBullet } from '@nivo/bullet'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useDarkMode } from '@/context/DarkModeContext'
import { darkTheme, lightTheme } from '../cards/components/ChartThemes'
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

type BulletChartBuilderResult = BuilderResult<BulletCardConfig>

export interface BulletChartBuilderProps {
  onDataSubmit: (data: any) => void
  instances: SdInstancesWithParamsQuery['sdInstances']
  config?: BulletCardConfig
}

export function BulletChartBuilder({ onDataSubmit, instances, config }: BulletChartBuilderProps) {
  const parameterNameMock = useRef<HTMLSpanElement | null>(null)
  const { isDarkMode } = useDarkMode()

  const [selectedInstance, setSelectedInstance] = useState<SdInstancesWithParamsQuery['sdInstances'][number] | null>(
    null
  )
  const [availableParameters, setAvailableParameters] = useState<{
    [key: string]: SdTypeParametersWithSnapshotsQuery['sdType']['parameters']
  }>({})
  const [getChartData] = useStatisticsQuerySensorsWithFieldsLazyQuery()
  const [data, setData] = useState<any[]>([])
  const [rangeInput, setRangeInput] = useState<string>('')
  const [markerInput, setMarkerInput] = useState<string>('')

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
            timeFrame: '1440',
            measureSize: 0.2,
            markers: [],
            margin: { top: 10, right: 10, bottom: 30, left: 30 },
            titleOffsetX: 0,
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

  const fetchRowData = async (rowIndex: number) => {
    const row = form.getValues(`rows.${rowIndex}`)

    try {
      // 'last' function uses snapshot data
      if (row.config.function === 'last') {
        const instance = instances.find((inst) => inst.uid === row.instance.uid)
        if (!instance) return

        const parameters = availableParameters[instance.type.id]
        if (!parameters) return

        const parameter = parameters.find((p) => p.denotation === row.parameter.denotation)
        if (!parameter) return

        const snapshot = parameter.parameterSnapshots?.find(
          (snap) => snap.instanceId === instance.id && snap.parameterId === parameter.id
        )

        if (snapshot?.number !== undefined) {
          setData((prev) => {
            const newData = [...prev]
            newData[rowIndex] = {
              id: row.config.name || row.parameter.denotation,
              ranges: [...(row.config.ranges || []), 0, 0],
              measures: [snapshot.number],
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
            from: new Date(Date.now() - Number(row.config.timeFrame) * 60 * 1000).toISOString(),
            aggregateMinutes: Number(row.config.timeFrame),
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
              ranges: [...(row.config.ranges || []), 0, 0],
              measures: [value],
              markers: row.config.markers || []
            }
            return newData
          })
        }
      }
    } catch (error) {
      const instance = instances.find((inst) => inst.uid === row.instance.uid)
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
        const instance = instances.find((inst) => inst.uid === row.instance.uid)
        if (instance) {
          refetchParameters({ sdTypeId: instance.type.id }).then((result) => {
            setAvailableParameters((prev) => ({
              ...prev,
              [instance.type.id]: result.data.sdType.parameters
            }))
          })
        }
      })
    }
  }, [config, instances, refetchParameters])

  const getParameterOptions = (instanceUID: string) => {
    const instance = instances.find((inst) => inst.uid === instanceUID)
    if (!instance) return []
    const parameters = availableParameters[instance.type?.id!]
    if (!parameters) return []
    return parameters.filter((param) => param.type === SdParameterType.Number)
  }

  const handleDataChange = (index: number, ranges?: number[], markers?: number[], id?: string): void => {
    const newData = [...data]
    if (!newData[index]) return
    if (ranges) newData[index].ranges = ranges
    if (markers) newData[index].markers = markers
    if (id) newData[index].id = id.trim()
    else newData[index].id = ''
    setData(newData)
  }

  const automaticOffset = (index: number, name: string) => {
    if (!parameterNameMock.current) return
    parameterNameMock.current.innerText = name
    const width = parameterNameMock.current.offsetWidth + 5
    form.setValue(`rows.${index}.config.titleOffsetX`, -width / 2)
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
          const row = form.watch(`rows.${index}`)
          if (!data[index]) return null
          return (
            <div className="h-[75px] w-full scale-[0.9] sm:scale-100" key={index}>
              <ResponsiveBullet
                data={[data[index]]}
                margin={row.config.margin}
                titleOffsetX={row.config.titleOffsetX}
                measureSize={row.config.measureSize}
                minValue={row.config.minValue || 'auto'}
                maxValue={row.config.maxValue || 'auto'}
                rangeColors={
                  row.config.colorScheme === 'greys'
                    ? ['#1a1a1a', '#333333', '#4d4d4d', '#666666', '#808080', '#999999', '#b3b3b3']
                    : 'seq:cool'
                }
                measureColors={row.config.colorScheme === 'greys' ? ['pink'] : 'seq:red_purple'}
                theme={isDarkMode ? darkTheme : lightTheme}
                // tooltip={() => {
                //   const instanceName = instances.find((inst) => inst.uid === row.instance.uid)?.userIdentifier
                //   // return (
                //   //   <BulletChartToolTip
                //   //     instanceName={instanceName}
                //   //     parameterName={row.parameter.denotation}
                //   //     currentValue={data[index].measures[0]}
                //   //     targetValues={data[index].markers}
                //   //   />
                //   )
                // }}
              />
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
                                  instances={instances}
                                  onValueChange={(instance) => {
                                    setSelectedInstance(instance)
                                    field.onChange(instance)
                                    form.setValue(`rows.${index}.parameter`, { denotation: '', id: null })
                                    checkRowAndFetch(index)
                                  }}
                                  value={field.value.uid}
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
                                  value={
                                    field.value ? { id: field.value.id!, denotation: field.value.denotation } : null
                                  }
                                  onValueChange={(value) => {
                                    form.setValue(`rows.${index}.config.name`, value?.denotation!)
                                    automaticOffset(index, value?.denotation!)
                                    handleDataChange(index, undefined, undefined, value?.denotation)
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
                                  onChange={(e) => {
                                    field.onChange(e.target.value)
                                    automaticOffset(index, e.target.value)
                                    handleDataChange(index, undefined, undefined, e.target.value)
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
                                <Select
                                  onValueChange={(value) => {
                                    field.onChange(value)
                                    if (value === 'last') {
                                      form.setValue(`rows.${index}.config.timeFrame`, '24')
                                    }
                                    checkRowAndFetch(index)
                                  }}
                                  value={field.value}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a function" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.values(StatisticsOperation).map((operation) => (
                                      <SelectItem key={operation} value={operation}>
                                        {operation}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
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
                                    <Input type="number" placeholder="Enter title offset X" {...field} />
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
                                          field.onChange(checked ? 'auto' : '')
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
                                      value={field.value === 'auto' ? '' : field.value}
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
                                          field.onChange(checked ? 'auto' : '')
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
                                      value={field.value === 'auto' ? '' : field.value}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
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
                            {/* Margin adjusters */}
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
    </div>
  )
}

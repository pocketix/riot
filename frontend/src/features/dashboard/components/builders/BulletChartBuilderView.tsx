import { useEffect, useRef, useState } from 'react'
import { Datum } from '@nivo/bullet'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { z } from 'zod'
import { BulletCardConfig, bulletChartBuilderSchema } from '@/schemas/dashboard/visualizations/BulletChartBuilderSchema'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useFieldArray } from 'react-hook-form'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectValue, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select'
import { TbTrash } from 'react-icons/tb'
import { IoAdd } from 'react-icons/io5'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { SingleInstanceCombobox } from './components/single-instance-combobox'
import { SingleParameterCombobox } from './components/single-parameter-combobox'
import { TimeFrameSelector } from './components/time-frame-selector'
import { AggregateFunctionCombobox } from './components/aggregate-function-combobox'
import { Label } from '@/components/ui/label'
import { ResponsiveTooltip } from '@/components/responsive-tooltip'
import { ArrowDown, ArrowUp, InfoIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Parameter } from '@/context/InstancesContext'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { BulletRow } from '../cards/components/BulletRow'
import { SdParameterType } from '@/generated/graphql'
import { getCustomizableIcon } from '@/utils/getCustomizableIcon'
import IconPicker from '@/ui/IconPicker'

export interface BulletChartBuilderViewProps {
  chartData: Datum[]
  config?: BulletCardConfig
  onSubmit: (values: BulletCardConfig) => void
  onCheckRowAndFetch: (rowIndex: number, rowData: any) => Promise<boolean>
  onGenerateRangesAndTarget: (rowData: BulletCardConfig['rows'][number]) => Promise<{
    ranges: { min: number; max: number }[]
    markers: number[]
    minValue: number
    maxValue: number
  } | null>
  onBulletDataChange: (
    index: number,
    data: {
      ranges?: number[]
      markers?: number[]
      measures?: number[]
      id?: string
    }
  ) => void
  getInstanceName: (instanceID: number | null) => string | null
  onRemoveRow: (index: number) => void
  onRowMove: (from: number, to: number) => void
  getParameterOptions: (instanceID: number | null) => Parameter[]

  // The dialog is also controlled by the controller
  smartRangeDialog: { open: boolean; rowIndex: number | null }
  onSmartRangeDialogChange: (state: { open: boolean; rowIndex: number | null }) => void
}

export function BulletChartBuilderView(props: BulletChartBuilderViewProps) {
  const parameterNameMock = useRef<HTMLSpanElement | null>(null)
  const [rangeInputs, setRangeInputs] = useState<Record<number, string>>({})
  const [markerInputs, setMarkerInputs] = useState<Record<number, string>>({})

  const form = useForm<z.infer<typeof bulletChartBuilderSchema>>({
    resolver: zodResolver(bulletChartBuilderSchema),
    defaultValues: props.config || {
      cardTitle: 'Bullet Charts',
      icon: '',
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
            margin: { top: 0, right: 10, bottom: 20, left: 30 },
            titleOffsetX: -5,
            colorScheme: 'nivo'
          }
        }
      ]
    }
  })

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'rows'
  })

  const handleRangeInputChange = (rowIndex: number, input: string) => {
    setRangeInputs((prev) => ({
      ...prev,
      [rowIndex]: input
    }))

    const newRanges = input
      .split(',')
      .map((range) => {
        const [min, max] = range.split(':').map((value) => Number(value.trim()))
        if (!isNaN(min) && !isNaN(max)) {
          return { min, max }
        }
        return null
      })
      .filter(Boolean) as { min: number; max: number }[]

    form.setValue(`rows.${rowIndex}.config.ranges`, newRanges)
    props.onBulletDataChange(rowIndex, {
      ranges: newRanges.flatMap((range) => [range.min, range.max])
    })
  }

  const handleMarkerInputChange = (rowIndex: number, input: string) => {
    setMarkerInputs((prev) => ({
      ...prev,
      [rowIndex]: input
    }))

    const newMarkers = input
      .split(',')
      .map((marker) => {
        const value = Number(marker.trim())
        if (!isNaN(value)) {
          return value
        }
        return null
      })
      .filter((marker): marker is number => marker !== null)

    form.setValue(`rows.${rowIndex}.config.markers`, newMarkers)
    props.onBulletDataChange(rowIndex, { markers: newMarkers })
  }

  const handleRangeDelete = (rowIndex: number, rangeIndex: number) => {
    const ranges = form.getValues(`rows.${rowIndex}.config.ranges`)
    if (!ranges) return

    const newRanges = ranges.filter((_, i) => i !== rangeIndex)
    form.setValue(`rows.${rowIndex}.config.ranges`, newRanges)

    setRangeInputs((prev) => ({
      ...prev,
      [rowIndex]: newRanges.map((r: { min: number; max: number }) => `${r.min}:${r.max}`).join(', ')
    }))

    props.onBulletDataChange(rowIndex, {
      ranges: newRanges.flatMap((range) => [range.min, range.max])
    })
  }

  const handleMarkerDelete = (rowIndex: number, markerIndex: number) => {
    const markers = form.getValues(`rows.${rowIndex}.config.markers`)
    if (!markers) return

    const newMarkers = markers.filter((_, i) => i !== markerIndex)
    form.setValue(`rows.${rowIndex}.config.markers`, newMarkers)

    setMarkerInputs((prev) => ({
      ...prev,
      [rowIndex]: newMarkers.join(', ')
    }))

    props.onBulletDataChange(rowIndex, { markers: newMarkers })
  }

  useEffect(() => {
    if (props.config) {
      const newRangeInputs: Record<number, string> = {}
      const newMarkerInputs: Record<number, string> = {}

      props.config.rows.forEach((row, rowIndex) => {
        newMarkerInputs[rowIndex] = (row.config.markers || []).join(', ')

        newRangeInputs[rowIndex] = (row.config.ranges || [])
          .map((range) => (range ? `${range.min}:${range.max}` : ''))
          .filter(Boolean)
          .join(', ')
      })

      setRangeInputs(newRangeInputs)
      setMarkerInputs(newMarkerInputs)
    }
  }, [props.config])

  const automaticOffset = (index: number, name: string) => {
    if (!parameterNameMock.current) return
    parameterNameMock.current.innerText = name
    const width = parameterNameMock.current.offsetWidth + 5
    form.setValue(`rows.${index}.config.margin.left`, width + 5)
  }

  const handleGenerateRangesAndTarget = async (rowIndex: number) => {
    const row = form.getValues(`rows.${rowIndex}`)
    const result = await props.onGenerateRangesAndTarget(row)

    if (result) {
      const { ranges, markers, minValue, maxValue } = result

      form.setValue(`rows.${rowIndex}.config.ranges`, ranges)
      form.setValue(`rows.${rowIndex}.config.markers`, markers)
      form.setValue(`rows.${rowIndex}.config.minValue`, minValue)
      form.setValue(`rows.${rowIndex}.config.maxValue`, maxValue)

      // Update inputs for only this specific row
      setRangeInputs((prev) => ({
        ...prev,
        [rowIndex]: ranges.map((r) => `${r.min}:${r.max}`).join(', ')
      }))

      setMarkerInputs((prev) => ({
        ...prev,
        [rowIndex]: markers.join(',')
      }))

      // Update chart 'data', not the measure though
      props.onBulletDataChange(rowIndex, {
        ranges: ranges.flatMap((range) => [range.min, range.max]),
        markers: markers
      })

      toast.success('Ranges generated! Feel free to adjust them to your liking.')
    }
  }

  const swapRangesAndTargets = (fromIndex: number, toIndex: number) => {
    const tempMarkers = markerInputs[toIndex] || ''
    const tempRanges = rangeInputs[toIndex] || ''

    setMarkerInputs((prev) => ({
      ...prev,
      [toIndex]: prev[fromIndex],
      [fromIndex]: tempMarkers
    }))

    setRangeInputs((prev) => ({
      ...prev,
      [toIndex]: prev[fromIndex],
      [fromIndex]: tempRanges
    }))
  }

  const iconValue = form.watch('icon') ?? ''
  const IconComponent = iconValue ? getCustomizableIcon(iconValue) : null

  return (
    <div className="w-full">
      <span
        className="invisible absolute left-1/2 top-0 -translate-x-1/2 transform text-[11px] font-semibold"
        ref={parameterNameMock}
      >
        {parameterNameMock.current?.innerText}
      </span>
      <Card className="h-fit w-full">
        <div className="flex items-center gap-1 px-2">
          {IconComponent && <IconComponent className="h-5 w-5 text-muted-foreground" />}
          {form.watch('cardTitle') ? <h3 className="text-lg font-semibold">{form.watch('cardTitle')}</h3> : null}
        </div>
        {fields.map((_, index) => {
          const row = form.watch(`rows.${index}`)
          const key = JSON.stringify(row)
          if (!props.chartData[index]) return null
          return (
            <div className="relative mb-2 box-border h-[65px] w-full" key={index}>
              <div className="absolute inset-0">
                <BulletRow key={key} row={row} editModeEnabled={false} aggregatedData={props.chartData[index]} />
              </div>
            </div>
          )
        })}
      </Card>
      <Card className="mt-4 h-fit w-full overflow-hidden p-2 pt-0 shadow-lg">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(props.onSubmit)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
              }
            }}
          >
            <div className="flex w-full items-center gap-1">
              <FormField
                control={form.control}
                name="cardTitle"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="Enter title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon</FormLabel>
                    <FormControl>
                      <IconPicker icon={field.value ?? ''} setIcon={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Accordion type="multiple" className="w-full" defaultValue={props.config ? [''] : ['instance-0']}>
              {fields.map((item, index) => (
                <AccordionItem key={item.id} value={`instance-${index}`}>
                  <AccordionTrigger className="flex w-full items-center justify-between">
                    <div className="flex flex-1 flex-wrap items-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={index === 0}
                        onClick={(e) => {
                          e.stopPropagation()

                          props.onRowMove(index, index - 1)
                          move(index, index - 1)
                          swapRangesAndTargets(index, index - 1)
                        }}
                      >
                        <ArrowUp size={14} />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={index === fields.length - 1}
                        onClick={(e) => {
                          e.stopPropagation()
                          props.onRowMove(index, index + 1)
                          move(index, index + 1)
                          swapRangesAndTargets(index, index + 1)
                        }}
                      >
                        <ArrowDown size={14} />
                      </Button>
                      <span>
                        {props.getInstanceName(form.watch(`rows.${index}.instance.id`)) || `Instance ${index + 1}`}
                      </span>
                      {form.watch(`rows.${index}.parameter.denotation`) && (
                        <Badge variant="outline" className="ml-2">
                          {form.watch(`rows.${index}.parameter.denotation`)}
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation() // prevents other open accordions from closing
                        props.onRemoveRow(index)
                        remove(index)
                      }}
                      className="mr-2 h-6 w-6"
                    >
                      <TbTrash size={14} />
                    </Button>
                  </AccordionTrigger>
                  <AccordionContent className="w-full">
                    <div key={item.id} className="relative mb-4 rounded-lg border p-4">
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
                                    field.onChange(instance)
                                    form.setValue(`rows.${index}.parameter`, { denotation: '', id: null })
                                    props.onCheckRowAndFetch(index, form.getValues(`rows.${index}`))
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
                                  filter={SdParameterType.Number}
                                  onValueChange={(value) => {
                                    form.setValue(`rows.${index}.config.name`, value?.denotation!)
                                    automaticOffset(index, value?.denotation!)

                                    props.onBulletDataChange(index, { id: value?.denotation })

                                    form.setValue(`rows.${index}.config.ranges`, [])
                                    setRangeInputs((prev) => ({
                                      ...prev,
                                      [index]: ''
                                    }))

                                    form.setValue(`rows.${index}.config.markers`, [])
                                    setMarkerInputs((prev) => ({
                                      ...prev,
                                      [index]: ''
                                    }))

                                    field.onChange(value)
                                    props.onCheckRowAndFetch(index, form.getValues(`rows.${index}`))
                                  }}
                                  options={props.getParameterOptions(form.watch(`rows.${index}.instance.id`))}
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
                                    props.onBulletDataChange(index, { id: e.target.value })
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
                                    props.onCheckRowAndFetch(index, form.getValues(`rows.${index}`))
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
                                        props.onCheckRowAndFetch(index, form.getValues(`rows.${index}`))
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
                                        onClick={() => handleRangeDelete(index, rangeIndex)}
                                      />
                                    </Badge>
                                  ))}
                                  <FormControl>
                                    <Input
                                      type="text"
                                      placeholder="Format: '10:20,20:30,...'"
                                      onChange={(e) => handleRangeInputChange(index, e.target.value)}
                                      value={rangeInputs[index] || ''}
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
                                        onClick={() => handleMarkerDelete(index, markerIndex)}
                                      />
                                    </Badge>
                                  ))}
                                  <FormControl>
                                    <Input
                                      type="text"
                                      placeholder="Format : '100,20,30,...'"
                                      onChange={(e) => handleMarkerInputChange(index, e.target.value)}
                                      value={markerInputs[index] || ''}
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
                  </AccordionContent>
                </AccordionItem>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  append({
                    instance: { uid: '', id: null },
                    parameter: { denotation: '', id: null },
                    config: {
                      name: '',
                      margin: { top: 0, right: 10, bottom: 20, left: 10 },
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
                className="mx-auto flex items-center gap-1 shadow-sm"
              >
                <IoAdd />
                Add Instance
              </Button>
            </Accordion>
            <Button type="submit" className="ml-auto mt-2 flex">
              Submit
            </Button>
          </form>
        </Form>
      </Card>

      <Dialog
        open={props.smartRangeDialog.open}
        onOpenChange={(open) =>
          props.onSmartRangeDialogChange({
            ...props.smartRangeDialog,
            open
          })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Ranges and Target</DialogTitle>
            <DialogDescription>
              Would you like to automatically generate ranges and targets based on historical data?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => props.onSmartRangeDialogChange({ open: false, rowIndex: null })}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (props.smartRangeDialog.rowIndex !== null) {
                  handleGenerateRangesAndTarget(props.smartRangeDialog.rowIndex)
                }
                props.onSmartRangeDialogChange({ open: false, rowIndex: null })
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

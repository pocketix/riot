import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { FieldErrors, useFieldArray, useForm } from 'react-hook-form'
import { format, scaleLinear } from 'd3'
import { z } from 'zod'
import { AxisLegendPosition } from '@nivo/axes'
import { Serie } from '@nivo/line'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { TbTrash } from 'react-icons/tb'
import { IoAdd } from 'react-icons/io5'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { InfoIcon } from 'lucide-react'
import { ResponsiveLineChart } from '../visualizations/ResponsiveLineChart'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TimeFrameSelector } from './components/time-frame-selector'
import { SingleInstanceCombobox } from './components/single-instance-combobox'
import { ParameterMultiSelect, SelectedParameters } from './components/multi-select-parameter'
import { ResponsiveTooltip } from '@/components/responsive-tooltip'
import { ChartCardConfig, lineChartBuilderSchema } from '@/schemas/dashboard/visualizations/LineChartBuilderSchema'
import { zodResolver } from '@hookform/resolvers/zod'
import { useDebounce } from 'use-debounce'
import { Parameter } from '@/context/InstancesContext'
import { LineChartLegend } from '../visualizations/LineChartLegend'
import { getCustomizableIcon } from '@/utils/getCustomizableIcon'
import IconPicker from '@/ui/IconPicker'

export interface LineChartBuilderViewProps {
  chartData: Serie[]
  config?: ChartCardConfig
  onParameterChange: (
    value: SelectedParameters[],
    index: number,
    instance: ChartCardConfig['instances'][number],
    formValues: ChartCardConfig
  ) => SelectedParameters[]
  onInstanceSelectionChange: (index: number, prevInstance: ChartCardConfig['instances'][number]) => void
  onRemoveInstance: (index: number, instance: ChartCardConfig['instances'][number]) => void
  getParameterOptions: (instanceID: number | null) => Parameter[]
  handleSubmit: (values: ChartCardConfig) => void
  onTimeFrameChange: (values: ChartCardConfig) => void
}

export function LineChartBuilderView(props: LineChartBuilderViewProps) {
  const containerRef = useRef(null)
  const leftAxisMarginMockRef = useRef<HTMLHeadingElement | null>(null)
  const [dataMaxValue, setDataMaxValue] = useState<number | null>(null)
  const [_dataMinValue, setDataMinValue] = useState<number | null>(null)
  const isFirstRender = useRef(true)
  const [openAccordions, setOpenAccordions] = useState<string[]>(['row-0'])

  const form = useForm<z.infer<typeof lineChartBuilderSchema>>({
    resolver: zodResolver(lineChartBuilderSchema),
    defaultValues: props.config || {
      title: 'Line Chart',
      icon: '',
      yAxisMarkers: [],
      chartArea: true,
      legend: {
        enabled: false,
        position: 'bottom'
      },
      toolTip: {
        x: 'Time',
        y: 'Value',
        yFormat: ' >-.1~f'
      },
      pointSize: 3,
      instances: [{ uid: '', id: null, parameters: [] }],
      timeFrame: '24',
      aggregateMinutes: 45,
      decimalPlaces: 1,
      axisLeft: {
        legend: 'Value',
        legendOffset: -40,
        legendPosition: 'middle' as AxisLegendPosition
      },
      axisBottom: {
        format: '%H:%M',
        legend: 'Date',
        legendOffset: 25,
        legendPosition: 'middle' as AxisLegendPosition
      },
      margin: { top: 10, right: 20, bottom: 40, left: 50 },
      yScale: {
        format: ' >-.1~f',
        type: 'linear',
        min: 'auto',
        max: 'auto',
        stacked: false
      },
      enableGridX: true,
      enableGridY: true
    }
  })

  const { fields, append, remove } = useFieldArray({
    // by default, useFieldArray uses `IDs` as keys for the fields,
    // however, instances objects include IDs too and this breaks the field array
    // https://github.com/orgs/react-hook-form/discussions/8935
    keyName: 'rhfKey',
    control: form.control,
    name: 'instances'
  })

  const {
    fields: markerFields,
    append: appendMarker,
    remove: removeMarker
  } = useFieldArray({
    control: form.control,
    name: 'yAxisMarkers'
  })

  const [debouncedDecimalPlaces] = useDebounce(form.watch('decimalPlaces'), 1000)

  useLayoutEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      console.log('Set first render to false')
      return
    }
  }, [])

  const calculateLeftAxisMargin = () => {
    if (leftAxisMarginMockRef.current) {
      const yAxisTextWidth = leftAxisMarginMockRef.current.offsetWidth + 5
      const isLegendPresent = form.getValues('axisLeft.legend') === '' ? false : true
      let yAxisWidth = yAxisTextWidth + 10 * 2 + 5

      if (!isLegendPresent) yAxisWidth -= 15

      form.setValue('margin.left', Math.ceil(yAxisWidth))
      form.setValue('axisLeft.legendOffset', -yAxisTextWidth - 15)
    }
  }

  const calculateBottomAxisMargin = (): number => {
    const isLegendPresent = form.getValues('axisBottom.legend') === '' ? false : true
    const margin = isLegendPresent ? 30 : 20
    form.setValue('margin.bottom', margin)
    return margin
  }

  const recalculateMaxValue = (currentData: any[]) => {
    if (currentData.length === 0) {
      setDataMaxValue(null)
      setDataMinValue(null)
      if (leftAxisMarginMockRef.current) {
        leftAxisMarginMockRef.current.innerText = ''
      }
      return
    }

    let maxValue = Number.NEGATIVE_INFINITY
    let minValue = Number.POSITIVE_INFINITY

    currentData.forEach((series) => {
      series.data.forEach((point: { y: number }) => {
        if (point && typeof point.y === 'number') {
          // The type should be number, but just in case it is null
          if (point.y > maxValue) maxValue = point.y
          if (point.y < minValue) minValue = point.y
        }
      })
    })

    minValue = minValue * 1.01
    maxValue = maxValue * 1.01

    // override the min and max values if they are not set to auto
    if (form.watch('yScale.min') !== 'auto') {
      minValue = form.watch('yScale.min') as number
    }
    if (form.watch('yScale.max') !== 'auto') {
      maxValue = form.watch('yScale.max') as number
    }

    // Building the whole scale to get the precise values that will also be displayed
    const yScaleMock = scaleLinear().domain([minValue, maxValue]).nice()

    // Get the actual domain after applying the nice function
    const [domainMin, domainMax] = yScaleMock.domain()

    setDataMinValue(domainMin)
    setDataMaxValue(domainMax)

    const tickValues = yScaleMock.ticks(5)

    // Using the same formatting as in the actual chart
    const formattedTicks = tickValues.map((v) => format('~s')(v))

    // Find the widest formatted tick value for margin calculations
    let widestValue = ''
    let maxLength = -1

    formattedTicks.forEach((tick) => {
      if (tick.length > maxLength || tick.length === maxLength) {
        maxLength = tick.length
        widestValue = tick
      }
    })

    if (leftAxisMarginMockRef.current) {
      leftAxisMarginMockRef.current.innerText = widestValue
    }
  }

  useEffect(() => {
    if (leftAxisMarginMockRef.current) {
      calculateLeftAxisMargin()
    }
  }, [leftAxisMarginMockRef.current?.innerText, dataMaxValue])

  useEffect(() => {
    calculateBottomAxisMargin()
  }, [form.watch('axisBottom.legend')])

  useEffect(() => {
    if (props.chartData.length > 0) {
      recalculateMaxValue(props.chartData)
    }
  }, [props.chartData])

  useEffect(() => {
    // The format follows the pattern >-.x~f,
    // where x is the number of decimal places
    if (form.watch('yScale')) {
      const newYScale = {
        ...form.watch('yScale'),
        format: `>-.${debouncedDecimalPlaces}~f`
      }
      form.setValue('yScale', newYScale)

      const newToolTipFormat = {
        ...form.watch('toolTip'),
        yFormat: `>-.${debouncedDecimalPlaces}~f`
      }
      form.setValue('toolTip', newToolTipFormat)
    }
  }, [debouncedDecimalPlaces])

  const handleError = (errors: FieldErrors<z.infer<typeof lineChartBuilderSchema>>) => {
    const accordionsToOpen: string[] = []

    if (errors.yAxisMarkers) accordionsToOpen.push('markers-options')
    if (errors.toolTip) accordionsToOpen.push('tooltip-options')
    if (errors.legend) accordionsToOpen.push('legend')
    if (
      errors.margin ||
      errors.axisLeft ||
      errors.yScale ||
      errors.enableGridX ||
      errors.enableGridY ||
      errors.chartArea
    ) {
      accordionsToOpen.push('advanced-options')
    }

    setOpenAccordions(accordionsToOpen)
  }

  const iconValue = form.watch('icon') ?? ''
  const IconComponent = iconValue ? getCustomizableIcon(iconValue) : null

  return (
    <div className="relative w-full">
      <h3 className="absolute left-1/2 top-0 -z-10 text-[11px]" ref={leftAxisMarginMockRef}>
        {leftAxisMarginMockRef.current?.innerText}
      </h3>
      <LineChartLegend data={props.chartData} className="invisible absolute" />
      <Card className="flex h-[230px] w-full flex-col">
        <div className="flex items-center gap-2 px-2">
          {IconComponent && <IconComponent className="h-5 w-5 text-muted-foreground" />}
          {form.watch('title') && <h3 className="text-md font-semibold">{form.watch('title')}</h3>}
        </div>
        <div className="relative h-full w-full">
          {props.chartData.length === 0 && (
            <div className="absolute z-10 flex h-full w-full items-center justify-center bg-transparent">
              <p className="text-center font-semibold text-destructive">
                No data available, please select an instance and parameter to display data.
              </p>
            </div>
          )}
          <div
            className={`relative w-full ${form.watch('title') ? 'h-[200px]' : 'h-[220px]'} ${props.chartData.length === 0 ? 'opacity-25' : 'opacity-100'}`}
            ref={containerRef}
          >
            <div className="absolute inset-0">
              <ResponsiveLineChart
                data={props.chartData}
                config={{
                  margin: form.watch('margin'),
                  yScale: form.watch('yScale') as any,
                  pointSize: form.watch('pointSize'),
                  enableGridX: form.watch('enableGridX'),
                  enableGridY: form.watch('enableGridY'),
                  chartArea: form.watch('chartArea'),
                  yAxisMarkers: form.watch('yAxisMarkers') || [],
                  axisBottom: {
                    ...form.watch('axisBottom'),
                    tickValues: 0
                  },
                  axisLeft: {
                    ...form.watch('axisLeft'),
                    format: '~s',
                    tickValues: 5
                  },
                  toolTip: {
                    x: form.watch('toolTip.x'),
                    y: form.watch('toolTip.y'),
                    yFormat: form.watch('toolTip.yFormat')
                  },
                  legend: {
                    enabled: form.watch('legend.enabled'),
                    position: form.watch('legend.position')
                  }
                }}
                detailsOnClick={false}
              />
            </div>
          </div>
        </div>
      </Card>

      <Card className="mt-4 h-fit w-full overflow-hidden p-2 pt-0 shadow-lg">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(props.handleSubmit, handleError)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
              }
            }}
          >
            <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2 md:grid-cols-3">
              <div className="flex items-center gap-1">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Card Title</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          onChange={(e) => {
                            field.onChange(e)
                          }}
                          value={field.value}
                          className="w-full"
                        />
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
              <FormField
                control={form.control}
                name="pointSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Point Size</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min={1}
                        onChange={(e) => {
                          field.onChange(parseInt(e.target.value))
                        }}
                        value={field.value}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="axisLeft.legend"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="inline-flex gap-1">
                      Left Axis Legend
                      <Checkbox
                        checked={!!field.value}
                        onCheckedChange={(e) => {
                          field.onChange(e ? 'value' : '')
                          calculateLeftAxisMargin()
                        }}
                      />
                    </FormLabel>
                    <FormControl>
                      <Input type="text" {...field} className="w-full" disabled={!field.value} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="axisBottom.legend"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="inline-flex gap-1">
                      Bottom Axis Legend
                      <Checkbox
                        checked={!!field.value}
                        onCheckedChange={(e) => {
                          field.onChange(e ? 'date' : '')
                          calculateBottomAxisMargin()
                        }}
                      />
                    </FormLabel>
                    <FormControl>
                      <Input type="text" {...field} className="w-full" disabled={!field.value} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="timeFrame"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time Frame</FormLabel>
                    <FormControl>
                      <TimeFrameSelector
                        onValueChange={(value) => {
                          field.onChange(value)
                          form.setValue('aggregateMinutes', Math.ceil((Number(value) * 60) / 32))
                          props.onTimeFrameChange(form.getValues())
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
                name="aggregateMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="inline-flex gap-1">
                      Aggregated Minutes
                      <ResponsiveTooltip
                        content={
                          <div className="text-center">
                            <p className="text-center font-semibold">What is this?</p>
                            <p className="font-thin">
                              This value is <b>automatically</b> calculated based on the selected time frame.
                            </p>
                            <p className="font-semibold">
                              It corresponds to the number of minutes that will be aggregated into a single data point.
                            </p>
                          </div>
                        }
                      >
                        <InfoIcon size={16} />
                      </ResponsiveTooltip>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        onChange={(e) => {
                          field.onChange(parseInt(e.target.value))
                          props.onTimeFrameChange(form.getValues())
                        }}
                        value={field.value}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator className="my-2" />

            {fields.map((field, index) => (
              <Card key={`${field['rhfKey']}-${index}`} className="relative mb-4 rounded-lg p-4 pt-2">
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => {
                    const instance = form.getValues(`instances.${index}`)
                    props.onRemoveInstance(index, instance)
                    remove(index)
                  }}
                  className="absolute right-2 top-2 h-6 w-6"
                  disabled={fields.length === 1}
                >
                  <TbTrash size={14} />
                </Button>
                <FormField
                  control={form.control}
                  name={`instances.${index}.id`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instance</FormLabel>
                      <FormControl>
                        <SingleInstanceCombobox
                          value={field.value}
                          onValueChange={(selectedInstance) => {
                            props.onInstanceSelectionChange(index, form.getValues(`instances.${index}`))
                            form.setValue(`instances.${index}`, {
                              id: selectedInstance?.id!,
                              uid: selectedInstance?.uid!,
                              parameters: []
                            })
                            field.onChange(selectedInstance?.id)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`instances.${index}.parameters`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parameters</FormLabel>
                      <FormControl>
                        <ParameterMultiSelect
                          value={field.value}
                          options={props.getParameterOptions(form.getValues(`instances.${index}.id`))}
                          reset={!!form.watch(`instances.${index}.uid`) && field.value.length === 0}
                          modalPopover={true}
                          onValueChange={(value) => {
                            const instance = form.getValues(`instances.${index}`)
                            const parameters = props.onParameterChange(value, index, instance, form.getValues())
                            field.onChange(parameters)
                          }}
                          defaultValue={field.value.map((param: { id: number }) => param.id)}
                          maxCount={4}
                          disabled={!form.watch(`instances.${index}.uid`)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Card>
            ))}

            {form.formState.errors.instances && (
              <p className="text-sm font-semibold text-red-500">{form.formState.errors.instances.message}</p>
            )}
            {form.formState.errors.instances?.root! && (
              <p className="text-sm font-semibold text-red-500">{form.formState.errors.instances?.root.message}</p>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ uid: '', id: null, parameters: [] })}
              className="mx-auto flex items-center gap-1 shadow-sm"
            >
              <IoAdd size={16} />
              Add Instance
            </Button>

            <Accordion type="multiple" className="mt-4 w-full" value={openAccordions} onValueChange={setOpenAccordions}>
              <AccordionItem value="markers-options">
                <AccordionTrigger>Y-Axis Markers</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    {markerFields.map((_, index) => (
                      <div key={index} className="rounded-lg border p-3 shadow-sm">
                        <div className="flex justify-between">
                          <h4 className="mb-2 text-sm font-medium">Marker {index + 1}</h4>
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeMarker(index)}>
                            <TbTrash size={16} />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                          <FormField
                            control={form.control}
                            name={`yAxisMarkers.${index}.value`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Value</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="Enter value"
                                    value={field.value ?? ''}
                                    onChange={(e) =>
                                      field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`yAxisMarkers.${index}.color`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Color</FormLabel>
                                <Select value={field.value} onValueChange={field.onChange}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select color" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="#ef4444">
                                      <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full bg-red-500"></div>
                                        <span>Destructive</span>
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="#eab308">
                                      <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                                        <span>Warning</span>
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="#22c55e">
                                      <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full bg-green-500"></div>
                                        <span>Success</span>
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="#6b7280">
                                      <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full bg-gray-500"></div>
                                        <span>Gray</span>
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="#3b82f6">
                                      <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                                        <span>Blue</span>
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`yAxisMarkers.${index}.style`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Style</FormLabel>
                                <Select value={field.value} onValueChange={field.onChange}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select style" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="solid">───</SelectItem>
                                    <SelectItem value="dashed">- - - -</SelectItem>
                                    <SelectItem value="dotted">. . . . .</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <FormField
                            control={form.control}
                            name={`yAxisMarkers.${index}.legend`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Legend Text</FormLabel>
                                <FormControl>
                                  <Input
                                    type="text"
                                    placeholder="Enter legend text"
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.value)}
                                    value={field.value || ''}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`yAxisMarkers.${index}.legendPosition`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Position</FormLabel>
                                <Select value={field.value} onValueChange={field.onChange}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select position" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="top-left">Top Left</SelectItem>
                                    <SelectItem value="top">Top</SelectItem>
                                    <SelectItem value="top-right">Top Right</SelectItem>
                                    <SelectItem value="right">Right</SelectItem>
                                    <SelectItem value="bottom-right">Bottom Right</SelectItem>
                                    <SelectItem value="bottom">Bottom</SelectItem>
                                    <SelectItem value="bottom-left">Bottom Left</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        appendMarker({
                          value: null,
                          color: '#ef4444',
                          style: 'solid',
                          legend: '',
                          legendPosition: 'top-left'
                        })
                      }
                      className="mx-auto flex items-center gap-1 shadow-sm"
                    >
                      <IoAdd size={16} />
                      Add Marker
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="tooltip-options">
                <AccordionTrigger>Tooltip options</AccordionTrigger>
                <AccordionContent className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="toolTip.x"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>X-Axis Tooltip Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            onChange={(e) => {
                              field.onChange(e)
                            }}
                            value={field.value}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="toolTip.y"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Y-Axis Tooltip Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            onChange={(e) => {
                              field.onChange(e)
                            }}
                            value={field.value}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="legend">
                <AccordionTrigger>Legend options</AccordionTrigger>
                <AccordionContent className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="legend.enabled"
                    render={({ field }) => (
                      <FormItem className="self-center">
                        <FormLabel className="flex items-center gap-2">
                          Enable Legend
                          <Checkbox
                            checked={!!field.value}
                            onCheckedChange={(e) => {
                              field.onChange(e)
                            }}
                          />
                        </FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`legend.position`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Position</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select position" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="top">Top</SelectItem>
                            <SelectItem value="bottom">Bottom</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="advanced-options">
                <AccordionTrigger>Advanced options</AccordionTrigger>
                <AccordionContent className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="margin.bottom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bottom Margin</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            {...field}
                            onChange={(e) => {
                              field.onChange(parseInt(e.target.value))
                            }}
                            value={field.value}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="margin.left"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Left Margin</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            {...field}
                            onChange={(e) => {
                              field.onChange(parseInt(e.target.value))
                            }}
                            value={field.value}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="axisLeft.legendOffset"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Left Axis Legend Offset</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => {
                              field.onChange(parseInt(e.target.value))
                            }}
                            value={field.value}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="yScale.min"
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
                            onChange={(e) => {
                              field.onChange(Number(e.target.value))
                            }}
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
                    name="yScale.max"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center justify-between gap-2">
                          Max Value
                          <div className="flex items-center gap-2">
                            Auto
                            <Checkbox
                              onCheckedChange={(checked) => {
                                // If value is set to auto, use the max value from the data
                                if (checked && leftAxisMarginMockRef.current) {
                                  leftAxisMarginMockRef.current.innerText = format('~s')(dataMaxValue || 0)
                                }
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
                            onChange={(e) => {
                              if (Number(e.target.value) > dataMaxValue! && leftAxisMarginMockRef.current) {
                                leftAxisMarginMockRef.current.innerText = format('~s')(Number(e.target.value))
                              }
                              field.onChange(Number(e.target.value))
                            }}
                            disabled={field.value === 'auto'}
                            value={field.value === 'auto' ? '' : field.value}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex flex-wrap justify-evenly gap-2 sm:col-span-2">
                    <FormField
                      control={form.control}
                      name="enableGridX"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            Enable X Grid
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(e) => {
                                field.onChange(e)
                              }}
                            />
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="enableGridY"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            Enable Y Grid
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(e) => {
                                field.onChange(e)
                              }}
                            />
                          </FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="chartArea"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            Chart Area
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(e) => {
                                field.onChange(e)
                              }}
                            />
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            <Button type="submit" className="ml-auto mt-2 flex">
              Submit
            </Button>
          </form>
        </Form>
      </Card>
    </div>
  )
}

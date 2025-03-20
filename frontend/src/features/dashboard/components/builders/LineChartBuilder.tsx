import { useEffect, useRef, useState } from 'react'
import { ResponsiveLine, PointTooltipProps } from '@nivo/line'
import { Card } from '@/components/ui/card'
import { AxisLegendPosition } from '@nivo/axes'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ChartToolTip } from '../cards/tooltips/LineChartToolTip'
import { useDarkMode } from '@/context/DarkModeContext'
import { darkTheme, lightTheme } from '../cards/ChartThemes'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { z } from 'zod'
import { ChartCardConfig, lineChartBuilderSchema } from '@/schemas/dashboard/LineChartBuilderSchema'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useFieldArray } from 'react-hook-form'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectValue, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select'
import { SdInstance, SdParameter } from '@/generated/graphql'
import { useLazyQuery, useQuery } from '@apollo/client'
import { GET_PARAMETERS, GET_TIME_SERIES_DATA } from '@/graphql/Queries'
import { ParameterMultiSelect } from '@/components/ui/multi-select-parameter'
import { TbTrash } from 'react-icons/tb'
import { IoAdd } from 'react-icons/io5'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { HiOutlineQuestionMarkCircle } from 'react-icons/hi2'
import { toast } from 'sonner'
import { useDebounce } from 'use-debounce'
import { Checkbox } from '@/components/ui/checkbox'
import { BuilderResult } from '../VisualizationBuilder'

type LineBuilderResult = BuilderResult<ChartCardConfig>

export interface LineChartBuilderProps {
  onDataSubmit: (data: LineBuilderResult) => void
  instances: SdInstance[]
  config?: ChartCardConfig
}

export function LineChartBuilder({ onDataSubmit, instances, config }: LineChartBuilderProps) {
  const containerRef = useRef(null)
  const { isDarkMode } = useDarkMode()

  const form = useForm<z.infer<typeof lineChartBuilderSchema>>({
    resolver: zodResolver(lineChartBuilderSchema),
    defaultValues: config || {
      cardTitle: 'Line Chart',
      toolTip: {
        x: 'Time',
        y: 'Value',
        yFormat: ' >-.1~f'
      },
      pointSize: 3,
      instances: [{ uid: '', parameters: [] }],
      timeFrame: '60',
      aggregateMinutes: 2,
      decimalPlaces: 1,
      axisLeft: {
        legend: 'Value',
        legendOffset: -40,
        legendPosition: 'middle' as AxisLegendPosition
        // tickSize: 5,
        // tickPadding: 5,
        // tickRotation: 0,
        // truncateTickAt: 0
      },
      axisBottom: {
        format: '%H:%M',
        tickValues: 6,
        legend: 'Date',
        legendOffset: 36,
        legendPosition: 'middle' as AxisLegendPosition
      },
      margin: { top: 10, right: 20, bottom: 50, left: 50 },
      yScale: {
        format: ' >-.1~f',
        type: 'linear',
        min: 'auto',
        max: 'auto',
        stacked: false
      },
      // xScale: { type: 'time', format: '%Y-%m-%dT%H:%M:%SZ' },
      // xFormat: 'time:%Y-%m-%dT%H:%M:%SZ',
      // animate: true,
      // yFormat: ' >-.3~f',
      enableGridX: true,
      enableGridY: true
      // pointBorderColor: { from: 'serieColor' }
    }
  })

  const [selectedInstance, setSelectedInstance] = useState<SdInstance | null>(null)
  const [availableParameters, setAvailableParameters] = useState<{ [key: string]: SdParameter[] }>({})
  const [getChartData, { data: chartData }] = useLazyQuery(GET_TIME_SERIES_DATA)
  const [data, setData] = useState<any[]>([])
  const [dataMaxValue, setDataMaxValue] = useState<number | null>(null)
  const leftAxisMarginMockRef = useRef<HTMLHeadingElement | null>(null)

  const [debouncedAggregateMinutes] = useDebounce(form.watch('aggregateMinutes'), 1000)

  const fetchData = () => {
    const instances = form.getValues('instances')
    if (instances.length === 0) return
    const sensors = instances.map((instance: { uid: string; parameters: { denotation: string }[] }) => ({
      key: instance.uid,
      values: instance.parameters ? instance.parameters.map((param) => param.denotation) : []
    }))
    const request = {
      from: new Date(Date.now() - Number(form.getValues('timeFrame')) * 60 * 1000).toISOString(),
      aggregateMinutes: form.getValues('aggregateMinutes'),
      operation: 'last'
    }

    getChartData({
      variables: {
        sensors: { sensors },
        request
      }
    })
  }

  const [debouncedDecimalPlaces] = useDebounce(form.watch('decimalPlaces'), 1000)

  useEffect(() => {
    // The format follows the pattern >-.x~f, where x is the number of decimal places
    // This is checked in the zod schema too
    if (form.watch('yScale')) {
      const newYScale = {
        ...form.watch('yScale'),
        format: `>-.${debouncedDecimalPlaces}~f`
      }
      form.setValue('yScale', newYScale)

      // The tooltip value formatting has to be updated as well
      const newToolTipFormat = {
        ...form.watch('toolTip'),
        yFormat: `>-.${debouncedDecimalPlaces}~f`
      }
      form.setValue('toolTip', newToolTipFormat)
    }
  }, [debouncedDecimalPlaces])

  useEffect(() => {
    if (!chartData) return
    const instances = form.getValues('instances')

    let maxValue: number = 0
    let result: any[] = []

    instances.forEach((instance: { uid: string; parameters: { denotation: string }[] }) => {
      const sensorDataArray = chartData.statisticsQuerySensorsWithFields.filter((item: any) => item.deviceId === instance.uid)
      console.log('Sensor data array', sensorDataArray)
      instance.parameters.forEach((param) => {
        const paramData = {
          id: param.denotation + '-' + instance.uid,
          data:
            sensorDataArray.length > 0
              ? sensorDataArray.map((sensorData: any) => {
                  const parsedData = sensorData.data ? JSON.parse(sensorData.data) : null
                  if (!parsedData) return
                  if (parsedData[param.denotation] > maxValue) maxValue = parsedData[param.denotation]
                  return {
                    x: sensorData.time,
                    y: parsedData[param.denotation]
                  }
                })
              : []
        }
        if (paramData.data.length === 0) {
          toast.error('One or more of the selected parameters have no data available for the selected time frame.')
          return
        }
        result.push(paramData)
      })
    })

    maxValue += 0.1
    if (maxValue > Number(leftAxisMarginMockRef.current?.innerText) && leftAxisMarginMockRef.current) {
      const decimalPlaces = form.watch('decimalPlaces')
      const mockValue = parseFloat(maxValue.toFixed(decimalPlaces))
      setDataMaxValue(mockValue)
      leftAxisMarginMockRef.current.innerText = mockValue.toString()
    }
    setData(result)
  }, [chartData])

  useEffect(() => {
    fetchData()
  }, [form.watch('timeFrame'), debouncedAggregateMinutes])

  const calculateLeftAxisMargin = () => {
    if (leftAxisMarginMockRef.current) {
      const yAxisTextWidth = leftAxisMarginMockRef.current.offsetWidth + 5
      console.log('Mock Width', yAxisTextWidth)
      const isLegendPresent = form.getValues('axisLeft.legend') === '' ? false : true
      let yAxisWidth = yAxisTextWidth + 10 * 2 + 20

      if (!isLegendPresent) yAxisWidth -= 20

      form.setValue('margin.left', Math.ceil(yAxisWidth))
      form.setValue('axisLeft.legendOffset', -yAxisTextWidth - 20)
    }
  }

  const calculateBottomAxisMargin = () => {
    const isLegendPresent = form.getValues('axisBottom.legend') === '' ? false : true
    form.setValue('margin.bottom', isLegendPresent ? 50 : 30)
  }

  useEffect(() => {
    if (leftAxisMarginMockRef.current) {
      console.log('Left axis margin mock', leftAxisMarginMockRef.current.innerText)
      calculateLeftAxisMargin()
    }
  }, [leftAxisMarginMockRef.current?.innerText, dataMaxValue])

  const { data: parametersData, refetch: refetchParameters } = useQuery<{ sdType: { parameters: SdParameter[] } }>(GET_PARAMETERS, {
    variables: { sdTypeId: selectedInstance?.type.id },
    skip: !selectedInstance
  })

  useEffect(() => {
    if (config) {
      config.instances.forEach((instance: { uid: string; parameters: { id: number; denotation: string }[] }) => {
        const selectedInstance = instances.find((inst) => inst.uid === instance.uid)
        if (selectedInstance) {
          refetchParameters({ sdTypeId: selectedInstance.type.id }).then((result) => {
            setAvailableParameters((prev) => ({
              ...prev,
              [selectedInstance.uid]: result.data.sdType.parameters
            }))
          })
        }
      })
    }
  }, [config, instances, refetchParameters])

  useEffect(() => {
    if (parametersData && selectedInstance) {
      setAvailableParameters((prev) => ({
        ...prev,
        [selectedInstance.uid]: parametersData.sdType.parameters
      }))
    }
  }, [parametersData, selectedInstance])

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'instances'
  })

  const handleSubmit = (values: z.infer<typeof lineChartBuilderSchema>) => {
    const result: LineBuilderResult = {
      config: values,
      sizing: {
        minH: 2,
        w: 2,
        h: 2
      }
    }
    onDataSubmit(result)
  }

  return (
    <div className="relative w-full">
      <h3 className="absolute top-0 left-1/2 text-[11px] -z-10" ref={leftAxisMarginMockRef}>
        {leftAxisMarginMockRef.current?.innerText}
      </h3>
      <Card className="h-[220px] w-full">
        {form.watch('cardTitle') && <h3 className="text-md font-semibold ml-2">{form.watch('cardTitle')}</h3>}
        <div className="relative w-full h-full">
          {data.length === 0 && (
            <div className="absolute z-10 w-full h-full flex items-center justify-center bg-transparent">
              <p className="text-center text-destructive font-semibold">No data available, please select an instance and parameter to display data.</p>
            </div>
          )}
          <div className={`relative w-full ${form.watch('cardTitle') ? 'h-[200px]' : 'h-[220px]'} ${data.length === 0 ? 'opacity-25' : 'opacity-100'}`} ref={containerRef}>
            <ResponsiveLine
              data={data}
              margin={form.watch('margin')}
              xFormat="time:%Y-%m-%dT%H:%M:%SZ"
              xScale={{ type: 'time', format: '%Y-%m-%dT%H:%M:%SZ' }}
              yScale={form.watch('yScale') as any}
              animate={true}
              yFormat={form.watch('toolTip.yFormat')}
              axisBottom={form.watch('axisBottom')}
              axisLeft={{ ...form.watch('axisLeft'), format: '~s' }}
              pointSize={form.watch('pointSize')}
              pointColor={isDarkMode ? '#ffffff' : '#000000'}
              pointBorderWidth={0}
              colors={isDarkMode ? { scheme: 'category10' } : { scheme: 'pastel1' }}
              pointBorderColor={{ from: 'serieColor' }}
              pointLabelYOffset={-12}
              enableTouchCrosshair={true}
              useMesh={true}
              enableGridX={form.watch('enableGridX')}
              enableGridY={form.watch('enableGridY')}
              tooltip={(pos: PointTooltipProps) => <ChartToolTip position={pos} containerRef={containerRef} xName={form.watch('toolTip.x')} yName={form.watch('toolTip.y')} />}
              theme={isDarkMode ? darkTheme : lightTheme}
            />
          </div>
        </div>
      </Card>
      <Card className="h-fit w-full overflow-hidden p-2 pt-0 mt-4 shadow-lg">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
              }
            }}
          >
            <div className="grid sm:grid-cols-2 grid-cols-1 gap-4 pt-2">
              <FormField
                control={form.control}
                name="axisLeft.legend"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
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
                    <FormLabel className="flex items-center gap-2">
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
                name="cardTitle"
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
                name="timeFrame"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time Frame</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value)
                          form.setValue('aggregateMinutes', Math.ceil(Number(value) / 32))
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a time frame" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="60">Last hour</SelectItem>
                          <SelectItem value="360">Last 6 hours</SelectItem>
                          <SelectItem value="480">Last 12 hours</SelectItem>
                          <SelectItem value="1440">Last day</SelectItem>
                          <SelectItem value="4320">Last 3 days</SelectItem>
                          <SelectItem value="10080">Last week</SelectItem>
                          <SelectItem value="43200">Last month</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="aggregateMinutes"
                render={({ field }) => (
                  <FormItem className="self-end">
                    <FormLabel className="flex items-center gap-2">
                      Aggregated Minutes
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <HiOutlineQuestionMarkCircle className="text-primary w-5 h-5" />
                          </TooltipTrigger>
                          <TooltipContent className="w-48">
                            <p className="font-semibold">What is this?</p>
                            <p className="font-thin">
                              This value is <b>automatically</b> calculated based on the selected time frame.
                            </p>
                            <p>It corresponds to the number of minutes that will be aggregated into a single data point.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min={0}
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
            </div>
            <Separator className="my-2" />
            {fields.map((item, index) => (
              <div key={item.id} className="relative border p-4 mb-4 rounded-lg">
                <Button variant="destructive" size="icon" onClick={() => remove(index)} className="absolute top-2 right-2">
                  <TbTrash />
                </Button>
                <FormField
                  control={form.control}
                  name={`instances.${index}.uid`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instance</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={(value) => {
                            const instance = instances.find((instance) => instance.uid === value)
                            if (!instance) return
                            setSelectedInstance(instance)
                            field.onChange(value)
                            form.setValue(`instances.${index}.parameters`, [])
                          }}
                          value={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select an instance" />
                          </SelectTrigger>
                          <SelectContent>
                            {instances.map((instance) => (
                              <SelectItem key={instance.uid} value={instance.uid}>
                                {instance.userIdentifier}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                          onClose={() => {
                            fetchData()
                          }}
                          options={
                            form.getValues(`instances.${index}.uid`) && availableParameters[form.getValues(`instances.${index}.uid`)]
                              ? availableParameters[form.getValues(`instances.${index}.uid`)].map((parameter) => ({
                                  label: parameter.denotation,
                                  value: parameter.id
                                }))
                              : []
                          }
                          reset={form.watch(`instances.${index}.uid`) !== config?.instances[index]?.uid}
                          modalPopover={true}
                          onValueChange={(value) => {
                            const selectedParameters = value.map((param) => ({
                              id: param,
                              denotation: availableParameters[form.getValues(`instances.${index}.uid`)].find((paramWhole) => paramWhole.id === Number(param))?.denotation
                            }))
                            field.onChange(selectedParameters)
                          }}
                          defaultValue={field.value.map((param: { id: number }) => param.id)}
                          placeholder="Select parameters"
                          maxCount={2}
                          disabled={!form.getValues(`instances.${index}.uid`)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ))}
            {form.formState.errors.instances && <p className="text-red-500 text-sm font-semibold">{form.formState.errors.instances.message}</p>}
            {form.formState.errors.instances?.root! && <p className="text-red-500 text-sm font-semibold">{form.formState.errors.instances?.root.message}</p>}
            <Button
              type="button"
              variant="green"
              className="mt-4 flex items-center justify-center w-1/2 m-auto"
              onClick={() => {
                append({ uid: '', parameters: [] })
              }}
            >
              <IoAdd />
              Add Instance
            </Button>
            <Accordion type="single" collapsible className="w-full mt-4">
              <AccordionItem value="tooltip-options">
                <AccordionTrigger>Tooltip options</AccordionTrigger>
                <AccordionContent className="w-full flex gap-4">
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
            </Accordion>
            <Accordion type="single" collapsible className="w-full mt-4">
              <AccordionItem value="advanced-options">
                <AccordionTrigger>Advanced options</AccordionTrigger>
                <AccordionContent className="w-full sm:grid-cols-2 grid-cols-1 grid gap-4">
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
                    name="axisBottom.tickValues"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Ticks</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
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
                  {/* Field for min and max values */}
                  <FormField
                    control={form.control}
                    name="yScale.min"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex gap-2 items-center justify-between">
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
                    name="yScale.max"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex gap-2 items-center justify-between">
                          Max Value
                          <div className="flex items-center gap-2">
                            Auto
                            <Checkbox
                              onCheckedChange={(checked) => {
                                // If value is set to auto, use the max value from the data
                                if (checked && leftAxisMarginMockRef.current) {
                                  leftAxisMarginMockRef.current.innerText = dataMaxValue?.toString() || ''
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
                                leftAxisMarginMockRef.current.innerText = e.target.value
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
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            <Button type="submit" className="w-fit mt-4" onClick={() => console.log('Form errors', form.formState.errors)}>
              Submit
            </Button>
          </form>
        </Form>
      </Card>
    </div>
  )
}

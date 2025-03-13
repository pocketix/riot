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
import { ChartCardInfo } from '@/types/ChartCardInfo'
import { z } from 'zod'
import { lineChartBuilderSchema } from '@/schemas/dashboard/LineChartBuilderSchema'
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

export interface LineChartBuilderProps {
  onDataSubmit: (data: any) => void
  instances: SdInstance[]
}

export function LineChartBuilder({ onDataSubmit, instances }: LineChartBuilderProps) {
  const containerRef = useRef(null)
  const { isDarkMode } = useDarkMode()

  const initialChartConfig: ChartCardInfo = {
    cardTitle: 'Line Chart',
    sizing: {
      minH: 2
    },
    toolTip: {
      x: 'Time',
      y: 'Value'
    },
    margin: { top: 10, right: 20, bottom: 50, left: 50 },
    xScale: { type: 'time', format: '%Y-%m-%dT%H:%M:%SZ' },
    xFormat: 'time:%Y-%m-%dT%H:%M:%SZ',
    yScale: {
      type: 'linear',
      min: 'auto',
      max: 'auto',
      stacked: false,
      reverse: false
    },
    animate: true,
    yFormat: ' >-.3~f',
    axisBottom: {
      format: '%H:%M',
      tickValues: 6,
      legend: 'Date',
      legendOffset: 36,
      legendPosition: 'middle' as AxisLegendPosition
    },
    axisLeft: {
      tickSize: 5,
      tickPadding: 5,
      tickRotation: 0,
      legend: 'Value',
      legendOffset: -40,
      truncateTickAt: 0,
      legendPosition: 'middle' as AxisLegendPosition
    },
    pointSize: 3,
    pointColor: { theme: 'background' },
    pointBorderWidth: 0,
    pointBorderColor: { from: 'serieColor' },
    enableGridX: true,
    enableGridY: true
  }

  const [chartConfig, setChartConfig] = useState(initialChartConfig)
  const [selectedInstance, setSelectedInstance] = useState<SdInstance | null>(null)
  const [availableParameters, setAvailableParameters] = useState<{ [key: string]: SdParameter[] }>({})
  const [getChartData, { data: chartData }] = useLazyQuery(GET_TIME_SERIES_DATA)
  const [data, setData] = useState<any[]>([])
  const [leftAxisMockValue, setLeftAxisMockValue] = useState<number | null>(null)
  const leftAxisMarginMockRef = useRef<HTMLHeadingElement | null>(null)

  const form = useForm<z.infer<typeof lineChartBuilderSchema>>({
    resolver: zodResolver(lineChartBuilderSchema),
    defaultValues: {
      cardTitle: 'Line Chart',
      toolTip: {
        x: 'Time',
        y: 'Value'
      },
      pointSize: 3,
      instances: [{ uid: '', parameters: [] }],
      timeFrame: '60',
      aggregateMinutes: 2,
      decimalPlaces: 1
    }
  })

  const [debouncedAggregateMinutes] = useDebounce(form.watch('aggregateMinutes'), 1000)

  const fetchData = () => {
    // Prepare all the instances and parameters from the form
    const instances = form.getValues('instances')
    if (instances.length === 0) return
    const sensors = instances.map((instance: { uid: string; parameters: { denotation: string }[] }) => ({
      key: instance.uid,
      values: instance.parameters ? instance.parameters.map((param) => param.denotation) : []
    }))
    // Prepare the request object
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
    if (chartConfig.yScale) {
      const newYScale = {
        ...chartConfig.yScale,
        format: ` >-.${debouncedDecimalPlaces}~f`
      }
      console.log('New y-scale', newYScale)
      setChartConfig((prevConfig) => ({ ...prevConfig, yScale: newYScale }))
    }
  }, [debouncedDecimalPlaces])

  useEffect(() => {
    if (!chartData) return
    const instances = form.getValues('instances')

    console.log('Chart data', chartData)
    let maxValue: number = 0
    let result: any[] = []

    instances.forEach((instance: { uid: string; parameters: { denotation: string }[] }) => {
      const sensorDataArray = chartData.statisticsQuerySensorsWithFields.filter((item: any) => item.deviceId === instance.uid)
      instance.parameters.forEach((param) => {
        const paramData = {
          id: param.denotation + '-' + instance.uid,
          data: sensorDataArray.map((sensorData: any) => {
            const parsedData = JSON.parse(sensorData.data)
            if (parsedData[param.denotation] > maxValue) maxValue = parsedData[param.denotation]
            return {
              x: sensorData.time,
              y: parsedData[param.denotation]
            }
          })
        }
        if (paramData.data.length === 0) {
          toast.error('One or more of the selected parameters have no data available for the selected time frame.')
          return
        }
        result.push(paramData)
      })
    })

    // Based on the decimal places, add the corresponding amount of decimal places
    // maxValue += 10 ** -debouncedDecimalPlaces
    maxValue += 0.1
    setLeftAxisMockValue(maxValue)
    console.log('Result', result)
    setData(result)
  }, [chartData])

  useEffect(() => {
    fetchData()
  }, [form.watch('timeFrame'), debouncedAggregateMinutes])

  const calculateLeftAxisMargin = () => {
    if (leftAxisMockValue && leftAxisMarginMockRef.current) {
      console.log('Left axis mock value', leftAxisMockValue)
      const yAxisTextWidth = leftAxisMarginMockRef.current.offsetWidth

      const isLegendPresent = chartConfig.axisLeft.legend === '' ? true : false
      console.log('Is legend present', isLegendPresent)
      // get the width of the left axis by getting the width of the mock element
      // + 10 stands for the gap between the axis and the chart
      // * 2 stands for the padding of the axis
      // + 20 stands for padding to the edge of the chart
      let yAxisWidth = yAxisTextWidth + 10 * 2 + 20

      if (!isLegendPresent) yAxisWidth -= 30
      console.log('Y-axis width', yAxisWidth)

      // set the margin
      setChartConfig((prevConfig) => {
        const newMargin = { ...prevConfig.margin, left: Math.ceil(yAxisWidth) }
        console.log('New margin', newMargin)
        return { ...prevConfig, margin: newMargin }
      })

      // set the legend offset
      setChartConfig((prevConfig) => {
        const newAxisLeft = { ...prevConfig.axisLeft, legendOffset: -yAxisTextWidth - 20 }
        return { ...prevConfig, axisLeft: newAxisLeft }
      })
    }
  }

  const calculateBottomAxisMargin = () => {
    const isLegendPresent = chartConfig.axisBottom.legend === '' ? true : false
    console.log('Is legend present', isLegendPresent)

    // If the legend is NOT present, decrease bottom margin by 30
    setChartConfig((prevConfig) => {
      const newMargin = { ...prevConfig.margin, bottom: isLegendPresent ? 50 : 30 }
      return { ...prevConfig, margin: newMargin }
    })
  }

  // Based on the maximum value of the y-axis, we will try to calculate the margin of the left axis
  useEffect(() => {
    if (leftAxisMockValue && leftAxisMarginMockRef.current) {
      calculateLeftAxisMargin()
    }
  }, [leftAxisMockValue])

  const { data: parametersData } = useQuery<{ sdType: { parameters: SdParameter[] } }>(GET_PARAMETERS, {
    variables: { sdTypeId: selectedInstance?.type.id },
    skip: !selectedInstance
  })

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

  const handleConfigChange = (property: string, value: any) => {
    const newConfig = {
      ...chartConfig,
      [property]: value
    }
    setChartConfig(newConfig)
    form.setValue(property as any, value)
  }

  const handleSubmit = (values: z.infer<typeof lineChartBuilderSchema>) => {
    const result = {
      values,
      chartConfig
    }
    onDataSubmit(result)
  }

  return (
    <div className="relative w-full">
      {leftAxisMockValue ? (
        <h3 className="absolute top-0 left-1/2 -z-10 text-[11px]" ref={leftAxisMarginMockRef}>
          {leftAxisMockValue}
        </h3>
      ) : null}
      <Card className="h-[220px] w-full overflow-hidden">
        {chartConfig.cardTitle && <h3 className="text-md font-semibold ml-2">{chartConfig.cardTitle}</h3>}
        <div className="relative w-full h-full">
          {data.length === 0 && (
            <div className="absolute z-10 w-full h-full flex items-center justify-center bg-transparent">
              <p className="text-center text-destructive font-semibold">No data available, please select an instance and parameter to display data.</p>
            </div>
          )}
          <div className={`relative w-full ${chartConfig.cardTitle ? 'h-[200px]' : 'h-[220px]'} ${data.length === 0 ? 'opacity-25' : 'opacity-100'}`} ref={containerRef}>
            <ResponsiveLine
              data={data}
              margin={chartConfig.margin}
              xScale={chartConfig.xScale as any}
              yScale={chartConfig.yScale as any}
              animate={chartConfig.animate}
              yFormat={chartConfig.yFormat}
              axisBottom={chartConfig.axisBottom}
              axisLeft={chartConfig.axisLeft}
              pointSize={chartConfig.pointSize}
              pointColor={isDarkMode ? '#ffffff' : '#000000'}
              pointBorderWidth={0}
              colors={isDarkMode ? { scheme: 'category10' } : { scheme: 'pastel1' }}
              pointBorderColor={chartConfig.pointBorderColor}
              pointLabelYOffset={-12}
              enableTouchCrosshair={true}
              useMesh={true}
              enableGridX={chartConfig.enableGridX}
              enableGridY={chartConfig.enableGridY}
              tooltip={(pos: PointTooltipProps) => <ChartToolTip position={pos} containerRef={containerRef} xName={chartConfig.toolTip.x} yName={chartConfig.toolTip.y} />}
              theme={isDarkMode ? darkTheme : lightTheme}
            />
          </div>
        </div>
      </Card>
      <Card className="h-fit w-full overflow-hidden p-2 pt-0 mt-4 shadow-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="grid sm:grid-cols-2 grid-cols-1 gap-4 pt-2">
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  Left Axis Legend
                  <Checkbox
                    checked={!!chartConfig.axisLeft.legend}
                    onCheckedChange={(e) => {
                      const newAxisLeft = { ...chartConfig.axisLeft, legend: e ? 'Example' : '' }
                      setChartConfig({ ...chartConfig, axisLeft: newAxisLeft })
                      calculateLeftAxisMargin()
                    }}
                  />
                </FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    value={(chartConfig.axisLeft.legend as string) || ''}
                    onChange={(e) => {
                      const newAxisLeft = { ...chartConfig.axisLeft, legend: e.target.value }
                      setChartConfig({ ...chartConfig, axisLeft: newAxisLeft })
                    }}
                    className="w-full"
                    disabled={!chartConfig.axisLeft.legend}
                  />
                </FormControl>
              </FormItem>
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  Bottom Axis Legend
                  <Checkbox
                    checked={!!chartConfig.axisBottom.legend}
                    onCheckedChange={(e) => {
                      const newAxisBottom = { ...chartConfig.axisBottom, legend: e ? 'Example' : '' }
                      setChartConfig({ ...chartConfig, axisBottom: newAxisBottom })
                      calculateBottomAxisMargin()
                    }}
                  />
                </FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    value={(chartConfig.axisBottom.legend as string) || ''}
                    onChange={(e) => {
                      const newAxisBottom = { ...chartConfig.axisBottom, legend: e.target.value }
                      setChartConfig({ ...chartConfig, axisBottom: newAxisBottom })
                    }}
                    className="w-full"
                    disabled={!chartConfig.axisBottom.legend}
                  />
                </FormControl>
              </FormItem>
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
                          handleConfigChange('cardTitle', e.target.value)
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
                          handleConfigChange('pointSize', parseInt(e.target.value))
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
                          console.log('form values', form.getValues())
                          // fetchData() // TODO: fetch after changing
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
                          {...field}
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
                                {instance.type.denotation}
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
                            form.trigger()
                            fetchData()
                          }}
                          options={
                            form.getValues(`instances.${index}.uid`) && availableParameters[form.getValues(`instances.${index}.uid`)]
                              ? availableParameters[form.getValues(`instances.${index}.uid`)].map((parameter) => ({
                                  label: parameter.denotation,
                                  value: Number(parameter.id)
                                }))
                              : []
                          }
                          reset={form.watch(`instances.${index}.uid`)}
                          modalPopover={true}
                          onValueChange={(value) => {
                            console.log('Available parameters', availableParameters[form.getValues(`instances.${index}.uid`)])
                            const selectedParameters = value.map((param) => ({
                              id: param,
                              denotation: availableParameters[form.getValues(`instances.${index}.uid`)].find((paramWhole) => paramWhole.id === Number(param))?.denotation
                            }))
                            console.log('Selected parameters', selectedParameters)
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
                form.trigger()
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
                              handleConfigChange('toolTip', { ...chartConfig.toolTip, x: e.target.value })
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
                              handleConfigChange('toolTip', { ...chartConfig.toolTip, y: e.target.value })
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
                  <div className="w-full">
                    <FormLabel>Bottom Margin</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        value={chartConfig.margin.bottom}
                        onChange={(e) => {
                          const newMargin = { ...chartConfig.margin, bottom: parseInt(e.target.value) }
                          setChartConfig({ ...chartConfig, margin: newMargin })
                        }}
                        className="w-full"
                      />
                    </FormControl>
                  </div>
                  <div className="w-full">
                    <FormLabel>Left Margin</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        value={chartConfig.margin.left}
                        onChange={(e) => {
                          const newMargin = { ...chartConfig.margin, left: parseInt(e.target.value) }
                          setChartConfig({ ...chartConfig, margin: newMargin })
                        }}
                        className="w-full"
                      />
                    </FormControl>
                  </div>
                  <div className="w-full">
                    <FormLabel>Number of Ticks</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        value={chartConfig.axisBottom.tickValues}
                        onChange={(e) => {
                          const newAxisBottom = { ...chartConfig.axisBottom, tickValues: parseInt(e.target.value) }
                          setChartConfig({ ...chartConfig, axisBottom: newAxisBottom })
                        }}
                        className="w-full"
                      />
                    </FormControl>
                  </div>
                  <div className="w-full">
                    <FormLabel>Left Axis Legend Offset</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        value={chartConfig.axisLeft.legendOffset}
                        onChange={(e) => {
                          const newAxisLeft = { ...chartConfig.axisLeft, legendOffset: parseInt(e.target.value) }
                          setChartConfig({ ...chartConfig, axisLeft: newAxisLeft })
                        }}
                        className="w-full"
                      />
                    </FormControl>
                  </div>
                  {/* <FormField
                    control={form.control}
                    name="decimalPlaces"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Y-Scale Decimal Places</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min={0}
                            onChange={(e) => {
                              console.log('Decimal places', e.target.value)
                              field.onChange(parseInt(e.target.value))
                            }}
                            value={field.value}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  /> */}
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

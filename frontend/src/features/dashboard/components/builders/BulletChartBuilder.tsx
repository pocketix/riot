import { useEffect, useRef, useState } from 'react'
import { ResponsiveBullet } from '@nivo/bullet'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useDarkMode } from '@/context/DarkModeContext'
import { darkTheme, lightTheme } from '../cards/ChartThemes'
import { SdInstance, SdParameter, StatisticsOperation } from '@/generated/graphql'
import { z } from 'zod'
import { bulletChartBuilderSchema } from '@/schemas/dashboard/BulletChartBuilderSchema'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useFieldArray } from 'react-hook-form'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectValue, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select'
import { TbTrash } from 'react-icons/tb'
import { IoAdd } from 'react-icons/io5'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { useLazyQuery, useQuery } from '@apollo/client'
import { GET_PARAMETERS, GET_TIME_SERIES_DATA } from '@/graphql/Queries'
import { Badge } from '@/components/ui/badge'
import type { BulletCardConfig } from '@/types/BulletChartConfig'
import { Checkbox } from '@/components/ui/checkbox'
import { Sizing } from '@/types/CardGeneral'

export type BuilderResult = {
  config: any
  sizing?: Sizing
}

export interface BulletChartBuilderProps {
  onDataSubmit: (data: any) => void
  instances: SdInstance[]
}

export function BulletChartBuilder({ onDataSubmit, instances }: BulletChartBuilderProps) {
  const parameterNameMock = useRef<HTMLSpanElement | null>(null)
  const { isDarkMode } = useDarkMode()

  const initialChartConfig: BulletCardConfig = {
    cardTitle: 'Bullet Charts',
    chartConfigs: [
      {
        name: '',
        titleOffsetX: 0,
        margin: { top: 10, right: 10, bottom: 30, left: 50 },
        minValue: 'auto',
        maxValue: 'auto',
        ranges: [],
        markers: [],
        measureSize: 0.2,
        measure: 0,
        function: '',
        colorScheme: 'nivo',
        instance: {
          uid: '',
          parameter: {
            denotation: '',
            id: -1
          }
        }
      }
    ]
  }

  const [chartConfig, setChartConfig] = useState(initialChartConfig)
  const [selectedInstance, setSelectedInstance] = useState<SdInstance | null>(null)
  const [availableParameters, setAvailableParameters] = useState<{ [key: string]: SdParameter[] }>({})
  const [getChartData] = useLazyQuery(GET_TIME_SERIES_DATA)
  const [data, setData] = useState<any[]>([])
  const [rangeInput, setRangeInput] = useState<string>('')
  const [markerInput, setMarkerInput] = useState<string>('')

  const form = useForm<z.infer<typeof bulletChartBuilderSchema>>({
    resolver: zodResolver(bulletChartBuilderSchema),
    defaultValues: {
      cardTitle: 'Bullet Charts',
      instances: [{ uid: '', parameter: { denotation: '', id: -1, function: '', timeFrame: '1440', measureSize: 0.2, markers: [] } }]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'instances'
  })

  const fetchData = async () => {
    if (form.getValues('instances')?.length === 0) return

    const rows = form.getValues('instances').map((instance) => ({
      key: instance.uid,
      value: instance.parameter.denotation,
      timeFrame: instance.parameter.timeFrame,
      function: instance.parameter.function,
      name: instance.parameter.name
    }))

    const results = await Promise.all(
      rows.map((row) => {
        return getChartData({
          variables: {
            sensors: {
              sensors: [
                {
                  key: row.key,
                  values: row.value
                }
              ]
            },
            request: {
              from: new Date(Date.now() - Number(row.timeFrame) * 60 * 1000).toISOString(),
              aggregateMinutes: Number(row.timeFrame) * 1000,
              operation: row.function
            }
          }
        })
      })
    )

    const parsedData = results.map((result) => result.data.statisticsQuerySensorsWithFields)

    let index = 0
    const newData = parsedData.map((parsed) => {
      const row = form.getValues(`instances.${index}`)
      const value = JSON.parse(parsed[0].data)[row.parameter.denotation]

      // Save the value to the config, so that we do not have to fetch again upon chaning the chart configuration
      setChartConfig((prevConfig) => {
        const newChartConfigs = [...(prevConfig.chartConfigs || [])]
        newChartConfigs[index] = {
          ...newChartConfigs[index],
          measure: value
        }
        return {
          ...prevConfig,
          chartConfigs: newChartConfigs
        }
      })

      const newDataItem = {
        id: row.parameter.name,
        ranges: [...(chartConfig?.chartConfigs?.[index]?.ranges || []), 0, 0],
        measures: [value],
        markers: chartConfig?.chartConfigs?.[index]?.markers || []
      }
      index++
      return newDataItem
    })

    setData(newData)
  }

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

  useEffect(() => {
    if (chartConfig) {
      console.log('Chart config changed', chartConfig)
    }
  }, [chartConfig])

  const handleDataChange = (index: number, ranges?: number[], markers?: number[], id?: string): void => {
    if (!chartConfig.chartConfigs) return
    // Based on the index, change the data[index] ranges, using the measure value in the config
    const newData = [...data]
    if (!newData[index]) return
    if (ranges) newData[index].ranges = ranges
    if (markers) newData[index].markers = markers
    if (id) newData[index].id = id
    setData(newData)
  }

  const automaticOffset = (index: number, name: string) => {
    if (!parameterNameMock.current) return
    parameterNameMock.current.innerText = name
    const width = parameterNameMock.current.offsetWidth + 5
    console.log('Width', width)
    setChartConfig((prevConfig) => {
      const newChartConfigs = [...(prevConfig.chartConfigs || [])]
      newChartConfigs[index] = {
        ...newChartConfigs[index],
        titleOffsetX: -width / 2
      }
      return {
        ...prevConfig,
        chartConfigs: newChartConfigs
      }
    })

    // Set the margin left to the width of the parameter name + 10px
    setChartConfig((prevConfig) => {
      const newChartConfigs = [...(prevConfig.chartConfigs || [])]
      newChartConfigs[index] = {
        ...newChartConfigs[index],
        margin: { ...newChartConfigs[index].margin, left: width + 5 }
      }
      return {
        ...prevConfig,
        chartConfigs: newChartConfigs
      }
    })
  }

  const handleSubmit = (_: z.infer<typeof bulletChartBuilderSchema>) => {
    const result: BuilderResult = {
      config: chartConfig,
      sizing: {
        h: chartConfig.chartConfigs?.length,
        w: 2
      }
    }

    onDataSubmit(result)
  }

  return (
    <div className="w-full">
      <span className="absolute top-0 left-1/2 transform -translate-x-1/2 text-[11px] font-semibold invisible" ref={parameterNameMock}>
        {parameterNameMock.current?.innerText}
      </span>
      <Card className="h-fit w-full">
        {chartConfig.cardTitle ? <h3 className="ml-2 text-lg font-semibold">{chartConfig.cardTitle}</h3> : null}
        {chartConfig.chartConfigs &&
          chartConfig.chartConfigs.map((config, index) => {
            if (!data[index]) return null
            console.log('Config colorscheme', config.colorScheme)
            return (
              <div className="h-[75px] w-full scale-[0.9] sm:scale-100">
                <ResponsiveBullet
                  data={[data[index]]}
                  margin={config.margin}
                  titleOffsetX={config.titleOffsetX}
                  measureSize={config.measureSize}
                  minValue={config.minValue || 'auto'}
                  maxValue={config.maxValue || 'auto'}
                  key={index}
                  rangeColors={config.colorScheme === 'greys' ? ['#1a1a1a', '#333333', '#4d4d4d', '#666666', '#808080', '#999999', '#b3b3b3'] : 'seq:cool'}
                  measureColors={config.colorScheme === 'greys' ? ['pink'] : 'seq:red_purple'}
                  theme={isDarkMode ? darkTheme : lightTheme}
                />
              </div>
            )
          })}
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
            <div className="grid sm:grid-cols-2 grid-cols-1 pt-2">
              <FormField
                control={form.control}
                name="cardTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Enter title"
                        onChange={(e) => {
                          field.onChange(e)
                          setChartConfig((prevConfig) => ({
                            ...prevConfig,
                            cardTitle: e.target.value
                          }))
                        }}
                        value={field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Accordion type="single" collapsible className="w-full mt-4">
              <AccordionItem value="instances">
                <AccordionTrigger>Instances</AccordionTrigger>
                <AccordionContent className="w-full">
                  {fields.map((item, index) => (
                    <div key={item.id} className="relative border p-4 mb-4 rounded-lg">
                      <Button variant="destructive" size="icon" onClick={() => remove(index)} className="absolute top-0 right-0">
                        <TbTrash />
                      </Button>
                      <div className="grid sm:grid-cols-2 grid-cols-1 gap-4">
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
                                    setChartConfig((prevConfig) => {
                                      const newChartConfigs = [...(prevConfig.chartConfigs || [])]
                                      newChartConfigs[index] = {
                                        ...newChartConfigs[index],
                                        instance: { uid: instance.uid, parameter: { denotation: '', id: -1 } }
                                      }
                                      return {
                                        ...prevConfig,
                                        chartConfigs: newChartConfigs
                                      }
                                    })
                                    form.setValue(`instances.${index}.parameter.id`, -1)
                                    form.setValue(`instances.${index}.parameter.denotation`, '')
                                    field.onChange(value)
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
                          name={`instances.${index}.parameter.id`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Parameter</FormLabel>
                              <FormControl>
                                <Select
                                  onValueChange={(value) => {
                                    const selectedParameter = availableParameters[form.getValues(`instances.${index}.uid`)!].find((parameter) => parameter.id === Number(value))
                                    if (!selectedParameter) return
                                    field.onChange(selectedParameter.id)
                                    form.setValue(`instances.${index}.parameter.denotation`, selectedParameter.denotation)
                                    form.setValue(`instances.${index}.parameter.name`, selectedParameter.denotation)
                                    setChartConfig((prevConfig) => {
                                      const newChartConfigs = [...(prevConfig.chartConfigs || [])]
                                      newChartConfigs[index] = {
                                        ...newChartConfigs[index],
                                        name: selectedParameter.denotation
                                      }
                                      return {
                                        ...prevConfig,
                                        chartConfigs: newChartConfigs
                                      }
                                    })
                                    automaticOffset(index, selectedParameter.denotation)
                                    handleDataChange(index, undefined, undefined, selectedParameter.denotation)
                                    setChartConfig((prevConfig) => {
                                      const newChartConfigs = [...(prevConfig.chartConfigs || [])]
                                      newChartConfigs[index] = {
                                        ...newChartConfigs[index],
                                        instance: {
                                          ...newChartConfigs[index].instance,
                                          parameter: { id: selectedParameter.id, denotation: selectedParameter.denotation }
                                        }
                                      }
                                      return {
                                        ...prevConfig,
                                        chartConfigs: newChartConfigs
                                      }
                                    })
                                  }}
                                  value={field.value || ''}
                                  disabled={!form.getValues(`instances.${index}.uid`)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a parameter" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {form.getValues(`instances.${index}.uid`) &&
                                      availableParameters[form.getValues(`instances.${index}.uid`)] &&
                                      availableParameters[form.getValues(`instances.${index}.uid`)].map((parameter) => (
                                        <SelectItem key={parameter.id} value={parameter.id}>
                                          {parameter.denotation}
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
                          name={`instances.${index}.parameter.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Display name"
                                  onChange={(e) => {
                                    field.onChange(e.target.value)
                                    automaticOffset(index, e.target.value)
                                    handleDataChange(index, undefined, undefined, e.target.value)
                                    setChartConfig((prevConfig) => {
                                      const newChartConfigs = [...(prevConfig.chartConfigs || [])]
                                      newChartConfigs[index] = {
                                        ...newChartConfigs[index],
                                        name: e.target.value
                                      }
                                      return {
                                        ...prevConfig,
                                        chartConfigs: newChartConfigs
                                      }
                                    })
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
                          name={`instances.${index}.parameter.function`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Function</FormLabel>
                              <FormControl>
                                <Select
                                  onValueChange={(value) => {
                                    field.onChange(value)
                                    if (value === 'last') {
                                      form.setValue(`instances.${index}.parameter.timeFrame`, '1440')
                                      setChartConfig((prevConfig) => {
                                        const newChartConfigs = [...(prevConfig.chartConfigs || [])]
                                        newChartConfigs[index] = {
                                          ...newChartConfigs[index],
                                          timeFrame: 1440
                                        }
                                        return {
                                          ...prevConfig,
                                          chartConfigs: newChartConfigs
                                        }
                                      })
                                      fetchData()
                                    }
                                    setChartConfig((prevConfig) => {
                                      const newChartConfigs = [...(prevConfig.chartConfigs || [])]
                                      newChartConfigs[index] = {
                                        ...newChartConfigs[index],
                                        function: value
                                      }
                                      return {
                                        ...prevConfig,
                                        chartConfigs: newChartConfigs
                                      }
                                    })
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
                        {form.watch(`instances.${index}.parameter.function`) !== 'last' && form.watch(`instances.${index}.parameter.function`) !== '' && (
                          <FormField
                            control={form.control}
                            name={`instances.${index}.parameter.timeFrame`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Time Frame</FormLabel>
                                <FormControl>
                                  <Select
                                    value={field.value}
                                    onValueChange={(value) => {
                                      fetchData()
                                      field.onChange(value)
                                      setChartConfig((prevConfig) => {
                                        const newChartConfigs = [...(prevConfig.chartConfigs || [])]
                                        newChartConfigs[index] = {
                                          ...newChartConfigs[index],
                                          timeFrame: Number(value)
                                        }
                                        return {
                                          ...prevConfig,
                                          chartConfigs: newChartConfigs
                                        }
                                      })
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
                        )}
                      </div>
                      <Accordion type="single" collapsible className="w-full mt-4">
                        <AccordionItem value="ranges">
                          <AccordionTrigger>Ranges</AccordionTrigger>
                          <AccordionContent className="w-full">
                            <FormField
                              control={form.control}
                              name={`instances.${index}.parameter.ranges`}
                              render={({ field }) => (
                                <FormItem>
                                  {field.value?.map((range, rangeIndex) => (
                                    <Badge key={rangeIndex} className="mr-2 border-[1px]">
                                      {range.min} : {range.max}
                                      <TbTrash
                                        className="ml-2 cursor-pointer text-destructive"
                                        onClick={() => {
                                          if (!field.value) return
                                          // Filter out the range
                                          const newRanges = field.value?.filter((_, i) => i !== rangeIndex)

                                          // Update the form field
                                          field.onChange(newRanges)
                                          setRangeInput(newRanges.map((r: { min: number; max: number }) => `${r.min}:${r.max}`).join(', '))

                                          // Update the chart config
                                          const flatRanges = newRanges.flatMap((range) => [range.min, range.max])
                                          setChartConfig((prevConfig) => {
                                            const newChartConfigs = [...(prevConfig.chartConfigs || [])]
                                            newChartConfigs[index] = {
                                              ...newChartConfigs[index],
                                              ranges: flatRanges
                                            }
                                            return {
                                              ...prevConfig,
                                              chartConfigs: newChartConfigs
                                            }
                                          })
                                          // Reflect changes in chart
                                          handleDataChange(index, flatRanges, undefined)
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

                                        // Parse the input
                                        const newRanges = e.target.value
                                          .split(',')
                                          .map((range) => {
                                            const [min, max] = range.split(':').map((value) => Number(value.trim()))

                                            // Validate the range
                                            if (!isNaN(min) && !isNaN(max)) {
                                              return { min, max }
                                            }
                                            return null
                                          })
                                          .filter(Boolean) // Remove invalids
                                        console.log('New ranges', newRanges)
                                        const flatRanges = newRanges.flatMap((range) => [range!.min, range!.max])
                                        setChartConfig((prevConfig) => {
                                          const newChartConfigs = [...(prevConfig.chartConfigs || [])]
                                          newChartConfigs[index] = {
                                            ...newChartConfigs[index],
                                            ranges: flatRanges
                                          }
                                          return {
                                            ...prevConfig,
                                            chartConfigs: newChartConfigs
                                          }
                                        })
                                        field.onChange(newRanges)
                                        handleDataChange(index, flatRanges, undefined)
                                      }}
                                      value={rangeInput}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="markers">
                          <AccordionTrigger>Targets</AccordionTrigger>
                          <AccordionContent className="w-full">
                            <FormField
                              control={form.control}
                              name={`instances.${index}.parameter.markers`}
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
                                          setChartConfig((prevConfig) => {
                                            const newChartConfigs = [...(prevConfig.chartConfigs || [])]
                                            newChartConfigs[index] = {
                                              ...newChartConfigs[index],
                                              markers: newMarkers
                                            }
                                            return {
                                              ...prevConfig,
                                              chartConfigs: newChartConfigs
                                            }
                                          })
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
                                        // Parse the input
                                        const newMarkers = e.target.value
                                          .split(',')
                                          .map((marker) => {
                                            const value = Number(marker.trim())
                                            // Validate the marker
                                            if (!isNaN(value)) {
                                              return value
                                            }
                                            return null
                                          })
                                          .filter((marker): marker is number => marker !== null)
                                        setChartConfig((prevConfig) => {
                                          const newChartConfigs = [...(prevConfig.chartConfigs || [])]
                                          newChartConfigs[index] = {
                                            ...newChartConfigs[index],
                                            markers: newMarkers
                                          }
                                          return {
                                            ...prevConfig,
                                            chartConfigs: newChartConfigs
                                          }
                                        })
                                        handleDataChange(index, undefined, newMarkers, undefined)
                                        field.onChange(newMarkers)
                                      }}
                                      value={markerInput}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="advanced">
                          <AccordionTrigger>Advanced Options</AccordionTrigger>
                          <AccordionContent className="w-full grid sm:grid-cols-2 grid-cols-1 gap-4 p-1">
                            <FormField
                              control={form.control}
                              name={`instances.${index}.parameter.measureSize`}
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
                                        setChartConfig((prevConfig) => {
                                          const newChartConfigs = [...(prevConfig.chartConfigs || [])]
                                          newChartConfigs[index] = {
                                            ...newChartConfigs[index],
                                            measureSize: Number(e.target.value)
                                          }
                                          return {
                                            ...prevConfig,
                                            chartConfigs: newChartConfigs
                                          }
                                        })
                                      }}
                                      value={field.value}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormItem>
                              <FormLabel>Title Offset X</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="Enter title offset X"
                                  onChange={(e) => {
                                    setChartConfig((prevConfig) => {
                                      const newChartConfigs = [...(prevConfig.chartConfigs || [])]
                                      newChartConfigs[index] = {
                                        ...newChartConfigs[index],
                                        titleOffsetX: Number(e.target.value)
                                      }
                                      return {
                                        ...prevConfig,
                                        chartConfigs: newChartConfigs
                                      }
                                    })
                                  }}
                                  value={chartConfig.chartConfigs?.[index].titleOffsetX}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                            <FormItem>
                              <FormLabel className="flex gap-2 items-center justify-between">
                                Min Value
                                {/* Checkbox for 'auto' value */}
                                <div className="flex items-center gap-2">
                                  Auto
                                  <Checkbox
                                    onCheckedChange={(checked) => {
                                      setChartConfig((prevConfig) => {
                                        const newChartConfigs = [...(prevConfig.chartConfigs || [])]
                                        newChartConfigs[index] = {
                                          ...newChartConfigs[index],
                                          minValue: checked ? 'auto' : 0
                                        }
                                        return {
                                          ...prevConfig,
                                          chartConfigs: newChartConfigs
                                        }
                                      })
                                    }}
                                    checked={chartConfig.chartConfigs?.[index].minValue === 'auto'}
                                  />
                                </div>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="Enter min value"
                                  onChange={(e) => {
                                    setChartConfig((prevConfig) => {
                                      const newChartConfigs = [...(prevConfig.chartConfigs || [])]
                                      newChartConfigs[index] = {
                                        ...newChartConfigs[index],
                                        minValue: Number(e.target.value)
                                      }
                                      return {
                                        ...prevConfig,
                                        chartConfigs: newChartConfigs
                                      }
                                    })
                                  }}
                                  disabled={chartConfig.chartConfigs?.[index].minValue === 'auto'}
                                  value={chartConfig.chartConfigs?.[index].minValue}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                            <FormItem className="self-start">
                              <FormLabel className="flex gap-2 items-center justify-between">
                                Max Value
                                {/* Checkbox for 'auto' value */}
                                <div className="flex items-center gap-2">
                                  Auto
                                  <Checkbox
                                    onCheckedChange={(checked) => {
                                      setChartConfig((prevConfig) => {
                                        const newChartConfigs = [...(prevConfig.chartConfigs || [])]
                                        newChartConfigs[index] = {
                                          ...newChartConfigs[index],
                                          maxValue: checked ? 'auto' : 0
                                        }
                                        return {
                                          ...prevConfig,
                                          chartConfigs: newChartConfigs
                                        }
                                      })
                                    }}
                                    checked={chartConfig.chartConfigs?.[index].maxValue === 'auto'}
                                  />
                                </div>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="Enter max value"
                                  onChange={(e) => {
                                    setChartConfig((prevConfig) => {
                                      const newChartConfigs = [...(prevConfig.chartConfigs || [])]
                                      newChartConfigs[index] = {
                                        ...newChartConfigs[index],
                                        maxValue: Number(e.target.value)
                                      }
                                      return {
                                        ...prevConfig,
                                        chartConfigs: newChartConfigs
                                      }
                                    })
                                  }}
                                  disabled={chartConfig.chartConfigs?.[index].maxValue === 'auto'}
                                  value={chartConfig.chartConfigs?.[index].maxValue}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                            <FormItem className="self-start">
                              <FormLabel>Color Scheme</FormLabel>
                              <FormControl>
                                <Select
                                  onValueChange={(value) => {
                                    setChartConfig((prevConfig) => {
                                      const newChartConfigs = [...(prevConfig.chartConfigs || [])]
                                      newChartConfigs[index] = {
                                        ...newChartConfigs[index],
                                        colorScheme: value as 'greys' | 'nivo'
                                      }
                                      return {
                                        ...prevConfig,
                                        chartConfigs: newChartConfigs
                                      }
                                    })
                                  }}
                                  value={chartConfig.chartConfigs?.[index].colorScheme || ''}
                                >
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
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="green"
                    className="mt-4 flex items-center justify-center w-1/2 m-auto"
                    onClick={() => {
                      append({ uid: '', parameter: { function: '', timeFrame: '1440', id: 0, denotation: '', measureSize: 0.2, markers: [] } })
                      // set the chartConfig defaults
                      setChartConfig((prevConfig) => {
                        return {
                          ...prevConfig,
                          chartConfigs: [
                            ...(prevConfig.chartConfigs || []),
                            {
                              name: '',
                              titleOffsetX: 0,
                              margin: { top: 10, right: 10, bottom: 30, left: 50 },
                              minValue: 'auto',
                              maxValue: 'auto',
                              ranges: [],
                              markers: [],
                              measureSize: 0.2,
                              function: '',
                              colorScheme: 'nivo',
                              timeFrame: 1440,
                              measure: 0,
                              instance: {
                                uid: '',
                                parameter: {
                                  denotation: '',
                                  id: -1
                                }
                              }
                            }
                          ]
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
            <Button type="submit" className="flex justify-center mt-4 w-3/4 mx-auto">
              Submit
            </Button>
            <Button type="button" onClick={() => console.log('Form state', form.getValues())}>
              Log Form State
            </Button>
            <Button type="button" onClick={() => console.log('Form errors', form.formState.errors)}>
              Log Form Errors
            </Button>
            <Button type="button" onClick={() => console.log('Chart config', chartConfig)}>
              Log Chart Config
            </Button>
          </form>
        </Form>
      </Card>
    </div>
  )
}

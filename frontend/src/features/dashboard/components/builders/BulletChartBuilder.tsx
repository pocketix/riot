import { useEffect, useRef, useState } from 'react'
import { ResponsiveBullet } from '@nivo/bullet'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useDarkMode } from '@/context/DarkModeContext'
import { darkTheme, lightTheme } from '../cards/ChartThemes'
import { SdInstance, SdParameter, StatisticsOperation } from '@/generated/graphql'
import { z } from 'zod'
import { BulletCardConfig, bulletChartBuilderSchema } from '@/schemas/dashboard/BulletChartBuilderSchema'
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
// import type { BulletCardConfig } from '@/types/BulletChartConfig'
import { Checkbox } from '@/components/ui/checkbox'
import { Sizing } from '@/types/CardGeneral'

export type BuilderResult = {
  config: BulletCardConfig
  sizing?: Sizing
}

export interface BulletChartBuilderProps {
  onDataSubmit: (data: any) => void
  instances: SdInstance[]
}

export function BulletChartBuilder({ onDataSubmit, instances }: BulletChartBuilderProps) {
  const parameterNameMock = useRef<HTMLSpanElement | null>(null)
  const { isDarkMode } = useDarkMode()

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
      rows: [{ instance: { uid: '' }, parameter: { denotation: '', id: null }, config: { name: '', function: '', timeFrame: '1440', measureSize: 0.2, markers: [] } }]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'rows'
  })

  const fetchData = async () => {
    if (form.getValues('rows')?.length === 0) return

    const rows = form.getValues('rows').map((row) => ({
      key: row.instance.uid,
      value: row.parameter.denotation,
      timeFrame: row.config.timeFrame,
      function: row.config.function,
      name: row.config.name
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
      const row = form.getValues(`rows.${index}`)
      const value = JSON.parse(parsed[0].data)[row.parameter.denotation]

      // Save the value to the form state, so that we do not have to fetch again upon changing the chart configuration
      // form.setValue(`rows.${index}.config.measure`, value)

      const newDataItem = {
        id: row.config.name,
        ranges: [...(row.config.ranges || []), 0, 0],
        measures: [value],
        markers: row.config.markers || []
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

  const handleDataChange = (index: number, ranges?: number[], markers?: number[], id?: string): void => {
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
    form.setValue(`rows.${index}.config.titleOffsetX`, -width / 2)
    form.setValue(`rows.${index}.config.margin.left`, width + 5)
  }

  const handleSubmit = (values: z.infer<typeof bulletChartBuilderSchema>) => {
    const result: BuilderResult = {
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
      <span className="absolute top-0 left-1/2 transform -translate-x-1/2 text-[11px] font-semibold invisible" ref={parameterNameMock}>
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
                rangeColors={row.config.colorScheme === 'greys' ? ['#1a1a1a', '#333333', '#4d4d4d', '#666666', '#808080', '#999999', '#b3b3b3'] : 'seq:cool'}
                measureColors={row.config.colorScheme === 'greys' ? ['pink'] : 'seq:red_purple'}
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
                      <Input type="text" placeholder="Enter title" {...field} />
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
                          name={`rows.${index}.instance.uid`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Instance</FormLabel>
                              <FormControl>
                                <Select
                                  onValueChange={(value) => {
                                    const instance = instances.find((instance) => instance.uid === value)
                                    if (!instance) return
                                    setSelectedInstance(instance)
                                    form.setValue(`rows.${index}.parameter.id`, -1)
                                    form.setValue(`rows.${index}.parameter.denotation`, '')
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
                          name={`rows.${index}.parameter.id`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Parameter</FormLabel>
                              <FormControl>
                                <Select
                                  onValueChange={(value) => {
                                    const selectedParameter = availableParameters[form.getValues(`rows.${index}.instance.uid`)!].find((parameter) => parameter.id === Number(value))
                                    if (!selectedParameter) return
                                    field.onChange(selectedParameter.id)
                                    form.setValue(`rows.${index}.parameter.denotation`, selectedParameter.denotation)
                                    form.setValue(`rows.${index}.config.name`, selectedParameter.denotation)
                                    automaticOffset(index, selectedParameter.denotation)
                                    handleDataChange(index, undefined, undefined, selectedParameter.denotation)
                                  }}
                                  value={field.value || ''}
                                  disabled={!form.getValues(`rows.${index}.instance.uid`)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a parameter" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {form.getValues(`rows.${index}.instance.uid`) &&
                                      availableParameters[form.getValues(`rows.${index}.instance.uid`)] &&
                                      availableParameters[form.getValues(`rows.${index}.instance.uid`)].map((parameter) => (
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
                                      form.setValue(`rows.${index}.config.timeFrame`, '1440')
                                      fetchData()
                                    }
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
                        {form.watch(`rows.${index}.config.function`) !== 'last' && form.watch(`rows.${index}.config.function`) !== '' && (
                          <FormField
                            control={form.control}
                            name={`rows.${index}.config.timeFrame`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Time Frame</FormLabel>
                                <FormControl>
                                  <Select
                                    value={field.value}
                                    onValueChange={(value) => {
                                      fetchData()
                                      field.onChange(value)
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
                                          setRangeInput(newRanges.map((r: { min: number; max: number }) => `${r.min}:${r.max}`).join(', '))
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
                        {form.formState.errors?.rows?.[index]?.config?.ranges && <FormMessage>{form.formState.errors.rows[index].config.ranges.message}</FormMessage>}
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
                        {form.formState.errors?.rows?.[index]?.config?.markers && <FormMessage>{form.formState.errors.rows[index].config.markers.message}</FormMessage>}
                        <AccordionItem value="advanced">
                          <AccordionTrigger>Advanced Options</AccordionTrigger>
                          <AccordionContent className="w-full grid sm:grid-cols-2 grid-cols-1 gap-4 p-1">
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
                              name={`rows.${index}.config.maxValue`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex gap-2 items-center justify-between">
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
                                    <Input type="number" placeholder="Enter margin top" onChange={(e) => field.onChange(Number(e.target.value))} value={field.value} />
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
                                    <Input type="number" placeholder="Enter margin right" onChange={(e) => field.onChange(Number(e.target.value))} value={field.value} />
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
                                    <Input type="number" placeholder="Enter margin bottom" onChange={(e) => field.onChange(Number(e.target.value))} value={field.value} />
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
                                    <Input type="number" placeholder="Enter margin left" onChange={(e) => field.onChange(Number(e.target.value))} value={field.value} />
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
                    className="mt-4 flex items-center justify-center w-1/2 m-auto"
                    onClick={() => {
                      append({
                        instance: { uid: '' },
                        parameter: { denotation: '', id: null },
                        config: {
                          name: '',
                          margin: { top: 10, right: 10, bottom: 30, left: 10 },
                          function: '',
                          minValue: 'auto',
                          maxValue: 'auto',
                          timeFrame: '1440',
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
            <Button type="submit" className="flex justify-center mt-4 w-3/4 mx-auto">
              Submit
            </Button>
            <Button type="button" onClick={() => console.log('Form state', form.getValues())}>
              Log Form State
            </Button>
            <Button type="button" onClick={() => console.log('Form errors', form.formState.errors)}>
              Log Form Errors
            </Button>
          </form>
        </Form>
      </Card>
    </div>
  )
}

import { z } from 'zod'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { IoAdd } from 'react-icons/io5'
import { Select, SelectValue, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select'
import { SdInstance, SdParameter } from '@/generated/graphql'
import { useQuery } from '@apollo/client'
import { GET_PARAMETERS } from '@/graphql/Queries'
import { useDarkMode } from '@/context/DarkModeContext'
import { darkTheme, lightTheme } from '../cards/components/ChartThemes'
import { EntityCardConfig, entityCardSchema } from '@/schemas/dashboard/EntityCardBuilderSchema'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useFieldArray } from 'react-hook-form'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { ResponsiveLine } from '@nivo/line'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { TbTrash } from 'react-icons/tb'
import { BuilderResult } from '@/types/GridItem'

type EntityCardBuilderResult = BuilderResult<EntityCardConfig>

export interface EntityCardBuilderProps {
  onDataSubmit: (data: any) => void
  instances: SdInstance[]
  config?: EntityCardConfig
}

export function EntityCardBuilder({ onDataSubmit, instances, config }: EntityCardBuilderProps) {
  const { isDarkMode } = useDarkMode()
  const [selectedInstance, setSelectedInstance] = useState<SdInstance | null>(null)
  const [availableParameters, setAvailableParameters] = useState<{ [key: string]: SdParameter[] }>({})

  const { data: parametersData, refetch: refetchParameters } = useQuery<{ sdType: { parameters: SdParameter[] } }>(GET_PARAMETERS, {
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
    if (config) {
      config.rows.forEach((row) => {
        const instance = instances.find((instance) => instance.uid === row.instance.uid)
        if (instance) {
          refetchParameters({ sdTypeId: instance.type.id }).then((result) => {
            setAvailableParameters((prev) => ({
              ...prev,
              [instance.uid]: result.data.sdType.parameters
            }))
          })
        }
      })
    }
  }, [config, instances, refetchParameters])

  const form = useForm<z.infer<typeof entityCardSchema>>({
    mode: 'onChange',
    resolver: zodResolver(entityCardSchema),
    defaultValues: config || {
      title: 'Entity Card',
      rows: []
    }
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'rows'
  })

  const staticImmediateValue = Math.floor(Math.random() * 100).toString()

  const staticSparkLineData = [
    {
      x: '2025-01-01T00:00:00.000Z',
      y: 15.1
    },
    {
      x: '2025-01-02T00:00:00.000Z',
      y: 23.1
    },
    {
      x: '2025-01-03T02:00:00.000Z',
      y: 20.8
    },
    {
      x: '2025-01-04T00:00:00.000Z',
      y: 26.5
    },
    {
      x: '2025-01-05T00:00:00.000Z',
      y: 30.3
    }
  ]

  const handleSubmit = (values: z.infer<typeof entityCardSchema>) => {
    const result: EntityCardBuilderResult = {
      config: values,
      sizing: {
        w: 1,
        h: Math.max(values.rows.length / 2, 1)
      }
    }
    onDataSubmit(result)
  }

  return (
    <div className="w-full">
      <Card className="h-fit w-full overflow-hidden p-2 pt-0">
        {form.watch('title') && <h3 className="text-lg font-semibold">{form.watch('title')}</h3>}
        <table className="w-full h-fit">
          <thead className="border-b-[2px]">
            <tr>
              <th className="text-left text-md">Name</th>
            </tr>
          </thead>
          <tbody>
            {fields.map((row, rowIndex) => (
              <tr key={row.id}>
                <td className={`${rowIndex !== 0 ? 'pt-2' : ''}`}>{form.watch(`rows.${rowIndex}.name`)}</td>
                {form.watch(`rows.${rowIndex}.visualization`) === 'sparkline' && (
                  <td className="text-sm text-center w-[75px] h-[24px]">
                    <ResponsiveLine
                      data={[
                        {
                          id: 'temperature',
                          data: staticSparkLineData
                        }
                      ]}
                      margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                      xScale={{ type: 'time', format: '%Y-%m-%dT%H:%M:%S.%LZ' }}
                      yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: true, reverse: false }}
                      animate={false}
                      pointSize={0}
                      axisBottom={null}
                      axisLeft={null}
                      curve="cardinal"
                      lineWidth={4}
                      enableGridX={false}
                      enableGridY={false}
                      useMesh={false}
                      theme={isDarkMode ? darkTheme : lightTheme}
                    />
                  </td>
                )}
                {form.watch(`rows.${rowIndex}.visualization`) === 'immediate' && <td className="text-sm text-center w-[75px] h-[24px]">{staticImmediateValue}</td>}
                {form.watch(`rows.${rowIndex}.visualization`) === 'switch' && (
                  <td className="text-sm text-center w-[75px] h-[24px]">
                    <Switch checked={true} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card className="h-fit w-full overflow-hidden p-2 pt-0 mt-4 shadow-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Card Title</FormLabel>
                  <FormControl>
                    <Input type="text" {...field} className="w-full" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {fields.map((row, rowIndex) => (
              <>
                <Separator className="my-4" />
                <div key={row.id} className="flex flex-col items-start border-2 p-2 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between w-full">
                    <h4 className="font-semibold">Row {rowIndex + 1}</h4>
                    <Button onClick={() => remove(rowIndex)} variant={'destructive'} size={'icon'} className="flex items-center justify-center">
                      <TbTrash />
                    </Button>
                  </div>
                  <Separator className="my-2" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`rows.${rowIndex}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Row Name</FormLabel>
                          <FormControl>
                            <Input onChange={field.onChange} value={field.value} placeholder="Row Name" className="w-full" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`rows.${rowIndex}.instance.uid`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Instance</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={(value) => {
                                const instance = instances.find((instance) => instance.uid === value) || null
                                if (!instance) return
                                field.onChange(instance.uid)
                                setSelectedInstance(instance)
                                form.setValue(`rows.${rowIndex}.parameter.id`, null)
                                form.setValue(`rows.${rowIndex}.parameter.denotation`, '')
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
                      name={`rows.${rowIndex}.parameter.id`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Parameter</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={(value) => {
                                const parameter = availableParameters[form.watch(`rows.${rowIndex}.instance.uid`)]?.find((param) => param.id === Number(value)) || null
                                if (!parameter) return
                                field.onChange(parameter.id)
                                console.log('Parameter denotation', parameter.denotation)
                                form.setValue(`rows.${rowIndex}.parameter.denotation`, parameter.denotation)
                                console.log('Form values', form.getValues())
                              }}
                              value={field.value || ''}
                              disabled={!availableParameters[form.watch(`rows.${rowIndex}.instance.uid`)]}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a parameter" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableParameters[form.watch(`rows.${rowIndex}.instance.uid`)]?.map((parameter) => (
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
                      name={`rows.${rowIndex}.visualization`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Visualization</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value)
                              }}
                              value={field.value || ''}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a visualization" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="sparkline">Sparkline</SelectItem>
                                <SelectItem value="immediate">Immediate Value</SelectItem>
                                <SelectItem value="switch">Switch</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {form.watch(`rows.${rowIndex}.visualization`) === 'sparkline' && (
                      <FormField
                        control={form.control}
                        name={`rows.${rowIndex}.timeFrame`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Time Frame</FormLabel>
                            <FormControl>
                              <Select
                                value={field.value}
                                onValueChange={(value) => {
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
                </div>
              </>
            ))}
            {form.formState.errors.rows && <FormMessage>{form.formState.errors.rows.message}</FormMessage>}
            <Button
              type="button"
              onClick={() => {
                append({ name: '', instance: { uid: '' }, parameter: { id: null, denotation: '' }, visualization: null, timeFrame: '' })
              }}
              variant={'green'}
              size={'icon'}
              className="flex items-center justify-center w-fit p-2 m-auto mt-2"
            >
              <IoAdd /> Add Row
            </Button>
            <Button
              type="submit"
              className="w-fit"
              onClick={() => {
                console.log('Form is valid:', form.formState.isValid)
                console.log('Form errors:', form.formState.errors)
                console.log('Form values', form.getValues())
              }}
            >
              Submit
            </Button>
          </form>
        </Form>
      </Card>
      <div className="flex justify-end mt-4"></div>
    </div>
  )
}

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
import { darkTheme, lightTheme } from '../cards/ChartThemes'
import { entityCardSchema } from '@/schemas/dashboard/EntityCardBuilderSchema'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { ResponsiveLine } from '@nivo/line'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { TbTrash } from 'react-icons/tb'
import type { EntityCardConfig } from '@/types/EntityCardConfig'

export interface EntityCardBuilderProps {
  onDataSubmit: (data: any) => void
  instances: SdInstance[]
}

export function EntityCardBuilder({ onDataSubmit, instances }: EntityCardBuilderProps) {
  const { isDarkMode } = useDarkMode()
  const initialEntityCardConfig: EntityCardConfig = {
    _cardID: '',
    title: 'Entity Card',
    rows: []
  }

  const [entityCardConfig, setEntityCardConfig] = useState<EntityCardConfig>(initialEntityCardConfig)
  const [selectedInstance, setSelectedInstance] = useState<SdInstance | null>(null)
  const [availableParameters, setAvailableParameters] = useState<{ [key: string]: SdParameter[] }>({})

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

  const form = useForm<z.infer<typeof entityCardSchema>>({
    resolver: zodResolver(entityCardSchema),
    defaultValues: {
      title: 'Entity Card',
      rows: []
    }
  })

  const handleConfigChange = (property: string, value: any) => {
    const newConfig = {
      ...entityCardConfig,
      [property]: value
    }
    setEntityCardConfig(newConfig)
  }

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

  const handleRowChange = (index: number, property: string, value: any) => {
    const newRows = [...entityCardConfig.rows]
    newRows[index] = {
      ...newRows[index],
      [property]: value
    }
    handleConfigChange('rows', newRows)
  }

  const addRow = () => {
    const newRows = [...entityCardConfig.rows, { name: '', instance: null, parameter: null, visualization: 'immediate' }]
    handleConfigChange('rows', newRows)
  }

  const removeRow = (index: number) => {
    const newRows = entityCardConfig.rows.filter((_, i) => i !== index)
    handleConfigChange('rows', newRows)
  }

  const handleParameterChange = (rowIndex: number, parameter: SdParameter) => {
    if (!parameter) return
    const newRows = [...entityCardConfig.rows]
    newRows[rowIndex].parameter = parameter
    handleConfigChange('rows', newRows)
  }

  const handleInstanceChange = (rowIndex: number, instance: SdInstance) => {
    if (!instance) return
    handleRowChange(rowIndex, 'instance', instance)
    setSelectedInstance(instance)
  }

  function onSubmit(values: z.infer<typeof entityCardSchema>) {
    console.log('Form values12213123133', values)
    onDataSubmit(values)
  }

  return (
    <div className="w-full">
      <Card className="h-fit w-full overflow-hidden p-2 pt-0">
        {entityCardConfig.title && <h3 className="text-lg font-semibold">{entityCardConfig.title}</h3>}
        <table className="w-full h-fit">
          <thead className="border-b-[2px]">
            <tr>
              <th className="text-left text-md">Name</th>
              <th className="text-center text-md">Visualization</th>
            </tr>
          </thead>
          <tbody>
            {entityCardConfig.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td className="text-sm">{row.name}</td>
                {row.visualization === 'sparkline' && (
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
                {row.visualization === 'immediate' && <td className="text-sm text-center">{staticImmediateValue}</td>}
                {row.visualization === 'switch' && (
                  <td className="text-sm text-center">
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
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Card Title</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      value={entityCardConfig.title}
                      onChange={(e) => {
                        field.onChange(e)
                        handleConfigChange('title', e.target.value)
                      }}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {entityCardConfig.rows.map((row, rowIndex) => (
              <>
                <Separator className="my-4" />
                <div key={rowIndex} className="flex flex-col items-start border-2 p-2 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between w-full">
                    <h4 className="font-semibold">Row {rowIndex + 1}</h4>
                    <Button onClick={() => removeRow(rowIndex)} variant={'destructive'} size={'icon'} className="flex items-center justify-center">
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
                          <FormControl>
                            <Input
                              {...field}
                              onChange={(e) => {
                                field.onChange(e)
                                handleRowChange(rowIndex, 'name', e.target.value)
                              }}
                              value={row.name}
                              placeholder="Row Name"
                              className="w-full"
                            />
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
                          <FormControl>
                            <Select
                              {...field}
                              onValueChange={(value) => {
                                const instance = instances.find((instance) => instance.uid === value) || null
                                if (!instance) return
                                field.onChange(instance.uid)
                                handleInstanceChange(rowIndex, instance)
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
                      name={`rows.${rowIndex}.parameter.id`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Select
                              onValueChange={(value) => {
                                const parameter = availableParameters[row.instance?.uid!]?.find((param) => param.id === Number(value)) || null
                                if (!parameter) return
                                field.onChange(parameter.id)
                                console.log('Field value', field.value)
                                handleParameterChange(rowIndex, parameter)
                              }}
                              value={field.value}
                              disabled={!availableParameters[row.instance?.uid!]}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a parameter" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableParameters[row.instance?.uid!]?.map((parameter) => (
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
                          <FormControl>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value)
                                console.log('Form values', form.getValues())
                                handleRowChange(rowIndex, 'visualization', value)
                              }}
                              value={field.value}
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
                  </div>
                </div>
              </>
            ))}
            {form.formState.errors.rows && <FormMessage>{form.formState.errors.rows.message}</FormMessage>}
            <Button
              onClick={() => {
                addRow()
                form.trigger()
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

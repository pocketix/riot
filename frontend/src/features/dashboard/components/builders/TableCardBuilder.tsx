import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { IoAdd } from 'react-icons/io5'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { TableCardInfo } from '@/types/TableCardInfo'
import { Select, SelectValue, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select'
import { SdInstance, SdParameter, StatisticsOperation } from '@/generated/graphql'
import { useQuery } from '@apollo/client'
import { GET_PARAMETERS } from '@/graphql/Queries'
import { HiOutlineQuestionMarkCircle } from 'react-icons/hi2'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { z } from 'zod'
import { tableCardSchema } from '@/schemas/dashboard/TableBuilderSchema'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { TbTrash } from 'react-icons/tb'
import { Label } from '@/components/ui/label'

export interface TableCardBuilderProps {
  onDataSubmit: (data: any) => void
  data?: TableCardInfo
  instances: SdInstance[]
}

export function TableCardBuilder({ onDataSubmit, data, instances }: TableCardBuilderProps) {
  const initialTableConfig: TableCardInfo = {
    _cardID: 'exampleCardID',
    title: 'Area',
    tableTitle: 'Sensors',
    decimalPlaces: 2,
    aggregatedTime: '1h',
    columns: [],
    rows: []
  }

  const [tableConfig, setTableConfig] = useState<TableCardInfo>(data || initialTableConfig)
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

  const form = useForm<z.infer<typeof tableCardSchema>>({
    resolver: zodResolver(tableCardSchema),
    defaultValues: {
      title: 'Area',
      tableTitle: 'Sensors',
      decimalPlaces: 2,
      columns: [],
      rows: []
    }
  })

  const handleConfigChange = (property: string, value: any) => {
    const newConfig = {
      ...tableConfig,
      [property]: value
    }
    setTableConfig(newConfig)
  }

  const handleColumnChange = (index: number, property: string, value: any) => {
    const newColumns = [...tableConfig.columns]
    newColumns[index] = {
      ...newColumns[index],
      [property]: value
    }
    handleConfigChange('columns', newColumns)
  }

  const handleRowChange = (index: number, property: string, value: any) => {
    const newRows = [...tableConfig.rows]
    newRows[index] = {
      ...newRows[index],
      [property]: value
    }
    handleConfigChange('rows', newRows)
  }

  const addColumn = () => {
    const newColumns = [...tableConfig.columns, { header: '', function: '' }]
    form.trigger('columns')
    handleConfigChange('columns', newColumns)
  }

  const removeColumn = (index: number) => {
    const newColumns = tableConfig.columns.filter((_, i) => i !== index)
    form.setValue('columns', newColumns)
    form.trigger('columns')
    handleConfigChange('columns', newColumns)
  }

  const addRow = () => {
    const newRows = [...tableConfig.rows, { name: '', instance: null, parameter: null }]
    form.trigger('rows')
    handleConfigChange('rows', newRows)
  }

  const removeRow = (index: number) => {
    const newRows = tableConfig.rows.filter((_, i) => i !== index)
    form.setValue(
      'rows',
      newRows.map((row) => ({
        ...row,
        instance: { uid: row.instance?.uid! },
        parameter: { id: row.parameter?.id! }
      }))
    )
    form.trigger('rows')
    handleConfigChange('rows', newRows)
  }

  const handleParameterChange = (rowIndex: number, parameter: SdParameter) => {
    if (!parameter) return
    const newRows = [...tableConfig.rows]
    newRows[rowIndex].parameter = parameter
    handleConfigChange('rows', newRows)
  }

  const handleInstanceChange = (rowIndex: number, instance: SdInstance) => {
    if (!instance) return
    handleRowChange(rowIndex, 'instance', instance)
    setSelectedInstance(instance)
  }

  const handleSubmit = (values: z.infer<typeof tableCardSchema>) => {
    onDataSubmit(values)
  }

  return (
    <div className="w-full">
      <Card className="h-fit w-full overflow-hidden p-2 pt-0">
        {tableConfig.title && <h3 className="text-lg font-semibold">{tableConfig.title}</h3>}
        <table className="w-full h-fit">
          <thead className="border-b-[2px]">
            <tr>
              <th className="text-left text-md">{tableConfig.tableTitle}</th>
              {tableConfig.columns.map((column, index) => (
                <th key={index} className="text-center text-xs">
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableConfig.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td className="text-sm">{row.name}</td>
                {tableConfig.columns.map((_, columnIndex) => (
                  <td key={columnIndex} className="text-sm text-center">
                    {(Math.random() * 100).toFixed(tableConfig.decimalPlaces ?? 2)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card className="h-fit w-full overflow-hidden p-2 pt-0 mt-4 shadow-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="grid sm:grid-cols-2 grid-cols-1 gap-4">
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
                          handleConfigChange('title', e.target.value)
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
                name="tableTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Table Title</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        onChange={(e) => {
                          field.onChange(e)
                          handleConfigChange('tableTitle', e.target.value)
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
                name="decimalPlaces"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <div className="flex items-center gap-2">
                        Number of decimal places
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <HiOutlineQuestionMarkCircle className="text-primary w-5 h-5" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="font-thin">The number of decimal places to display in the table.</p>
                              <p>
                                <span className="font-thin">The values inside this builder are </span>
                                <b>randomly generated.</b>
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min={0}
                        max={5}
                        onChange={(e) => {
                          field.onChange(parseInt(e.target.value))
                          handleConfigChange('decimalPlaces', e.target.value)
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
            <Accordion type="single" collapsible className="w-full mt-4">
              <AccordionItem value="columns">
                <AccordionTrigger>Columns</AccordionTrigger>
                <AccordionContent className="w-full flex flex-col mt-2 px-1 border-2 rounded-md p-2">
                  {tableConfig.columns.map((_, index) => (
                    <div key={index} className="flex flex-col">
                      <div className="flex gap-2 items-center justify-between w-full">
                        <h4 className="font-semibold">Column {index + 1}</h4>
                        <Button onClick={() => removeColumn(index)} variant={'destructive'} size={'icon'}>
                          <TbTrash />
                        </Button>
                      </div>
                      <Separator className="my-2" />
                      <div key={index} className="grid sm:grid-cols-2 grid-cols-1 gap-4">
                        <FormField
                          control={form.control}
                          name={`columns.${index}.header`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Label>
                                  Header
                                  <Input
                                    {...field}
                                    onChange={(e) => {
                                      field.onChange(e)
                                      handleColumnChange(index, 'header', e.target.value)
                                    }}
                                    value={field.value}
                                    placeholder="Header"
                                    className="w-full"
                                  />
                                </Label>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`columns.${index}.function`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Label>
                                  Function
                                  <Select
                                    {...field}
                                    onValueChange={(value) => {
                                      field.onChange(value)
                                      handleColumnChange(index, 'function', value)
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
                                </Label>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <Separator className="my-2" />
                    </div>
                  ))}
                  <Button onClick={addColumn} variant={'green'} size={'icon'} className="flex items-center justify-center w-1/2 m-auto">
                    <IoAdd />
                    Add Column
                  </Button>
                </AccordionContent>
              </AccordionItem>
              {form.formState.errors.columns && <FormMessage>{form.formState.errors.columns.message}</FormMessage>}
              {form.formState.errors.columns?.root && <FormMessage>{form.formState.errors.columns.root?.message}</FormMessage>}
              <AccordionItem value="rows">
                <AccordionTrigger>Rows</AccordionTrigger>
                <AccordionContent className="w-full flex flex-col gap-4 mt-2 border-2 rounded-md p-2">
                  {tableConfig.rows.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex flex-col">
                      <div className="flex gap-2 items-center justify-between w-full">
                        <h4 className="font-semibold">Row {rowIndex + 1}</h4>
                        <Button onClick={() => removeRow(rowIndex)} variant={'destructive'} size={'icon'}>
                          <TbTrash />
                        </Button>
                      </div>
                      <Separator className="my-2" />
                      <FormField
                        control={form.control}
                        name={`rows.${rowIndex}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Label>
                                Row Name
                                <Input
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(e)
                                    handleRowChange(rowIndex, 'name', e.target.value)
                                  }}
                                  value={field.value}
                                  placeholder="Row Name"
                                  className="w-full"
                                />
                              </Label>
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
                              <Label>
                                Instance
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
                              </Label>
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
                              <Label>
                                Parameter
                                <Select
                                  onValueChange={(value) => {
                                    const parameter = availableParameters[row.instance?.uid!]?.find((param) => param.id === Number(value)) || null
                                    if (!parameter) return
                                    field.onChange(parameter.id)
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
                              </Label>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  ))}
                  <Button onClick={addRow} variant={'green'} size={'icon'} className="flex items-center justify-center w-1/2 m-auto">
                    <IoAdd /> Add Row
                  </Button>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            {form.formState.errors.rows && <FormMessage>{form.formState.errors.rows.message}</FormMessage>}
            {form.formState.errors.rows?.root && <FormMessage>{form.formState.errors.rows.root?.message}</FormMessage>}
            <Button
              type="submit"
              className="w-fit mt-4"
              onClick={() => {
                console.log('Form errors:', form.formState.errors)
                console.log('Form state:', form.getValues())
              }}
            >
              Submit
            </Button>
          </form>
        </Form>
      </Card>
    </div>
  )
}

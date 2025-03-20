import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { IoAdd } from 'react-icons/io5'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Select, SelectValue, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select'
import { SdInstance, SdParameter, StatisticsOperation } from '@/generated/graphql'
import { useQuery } from '@apollo/client'
import { GET_PARAMETERS } from '@/graphql/Queries'
import { HiOutlineQuestionMarkCircle } from 'react-icons/hi2'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { z } from 'zod'
import { tableCardSchema, TableCardConfig } from '@/schemas/dashboard/TableBuilderSchema'
import { zodResolver } from '@hookform/resolvers/zod'
import { useFieldArray, useForm } from 'react-hook-form'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { TbTrash } from 'react-icons/tb'
import { Label } from '@/components/ui/label'
import { BuilderResult } from '../VisualizationBuilder'

type TableCardBuilderResult = BuilderResult<TableCardConfig>

export interface TableCardBuilderProps {
  onDataSubmit: (data: any) => void
  instances: SdInstance[]
  config?: TableCardConfig
}

export function TableCardBuilder({ onDataSubmit, instances, config }: TableCardBuilderProps) {
  const [selectedInstance, setSelectedInstance] = useState<SdInstance | null>(null)
  const [availableParameters, setAvailableParameters] = useState<{ [key: string]: SdParameter[] }>({})

  const { data: parametersData, refetch: refetchParameters } = useQuery<{ sdType: { parameters: SdParameter[] } }>(GET_PARAMETERS, {
    variables: { sdTypeId: selectedInstance?.type.id },
    skip: !selectedInstance
  })

  useEffect(() => {
    if (config) {
      config.rows.forEach((row) => {
        const selectedInstance = instances.find((inst) => inst.uid === row.instance.uid)
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

  const form = useForm<z.infer<typeof tableCardSchema>>({
    resolver: zodResolver(tableCardSchema),
    defaultValues: config || {
      title: 'Area',
      tableTitle: 'Sensors',
      timeFrame: '1440',
      decimalPlaces: 1,
      columns: [],
      rows: []
    }
  })

  const {
    fields: columnFields,
    append: appendColumn,
    remove: removeColumn
  } = useFieldArray({
    control: form.control,
    name: 'columns'
  })

  const {
    fields: rowFields,
    append: appendRow,
    remove: removeRow
  } = useFieldArray({
    control: form.control,
    name: 'rows'
  })

  const handleSubmit = (values: z.infer<typeof tableCardSchema>) => {
    const result: TableCardBuilderResult = {
      config: values,
      sizing: {
        w: 2,
        h: 1
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
              <th className="text-left text-md">{form.watch('tableTitle')}</th>
              {columnFields.map((_, index) => (
                <th key={index} className="text-center text-xs">
                  {form.watch(`columns.${index}.header`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowFields.map((_, rowIndex) => (
              <tr key={rowIndex}>
                <td className="text-sm">{form.watch(`rows.${rowIndex}.name`)}</td>
                {columnFields.map((_, columnIndex) => (
                  <td key={columnIndex} className="text-sm text-center">
                    {(Math.random() * 100).toFixed(form.watch('decimalPlaces') ?? 2)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
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
            <div className="grid sm:grid-cols-2 grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Card Title</FormLabel>
                    <FormControl>
                      <Input value={field.value} onChange={field.onChange} className="w-full" />
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
                      <Input value={field.value} onChange={field.onChange} className="w-full" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="decimalPlaces"
                render={({ field }) => (
                  <FormItem className="self-center">
                    <FormLabel>
                      <div className="flex items-center gap-2">
                        Number of decimal places
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger type="button">
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
                      <Input value={field.value} onChange={field.onChange} type="number" min={0} className="w-full" />
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
                      <Select value={field.value} onValueChange={field.onChange}>
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
            </div>
            <Accordion type="single" collapsible className="w-full mt-4">
              <AccordionItem value="columns">
                <AccordionTrigger>Columns</AccordionTrigger>
                <AccordionContent className="w-full flex flex-col mt-2 px-1 border-2 rounded-md p-2">
                  {columnFields.map((column, index) => (
                    <div key={column.id} className="flex flex-col">
                      <div className="flex gap-2 items-center justify-between w-full">
                        <h4 className="font-semibold">Column {index + 1}</h4>
                        <Button onClick={() => removeColumn(index)} variant={'destructive'} size={'icon'}>
                          <TbTrash />
                        </Button>
                      </div>
                      <Separator className="my-2" />
                      <div className="grid sm:grid-cols-2 grid-cols-1 gap-4">
                        <FormField
                          control={form.control}
                          name={`columns.${index}.header`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Label>
                                  Header
                                  <Input value={field.value} onChange={field.onChange} placeholder="Header" className="w-full" />
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
                                  <Select value={field.value} onValueChange={field.onChange}>
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
                  <Button onClick={() => appendColumn({ header: '', function: '' })} variant={'green'} size={'icon'} className="flex items-center justify-center w-1/2 m-auto">
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
                  {rowFields.map((row, rowIndex) => (
                    <div key={row.id} className="flex flex-col">
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
                                <Input value={field.value} onChange={field.onChange} placeholder="Row Name" className="w-full" />
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
                                  onValueChange={(value) => {
                                    const instance = instances.find((instance) => instance.uid === value) || null
                                    if (!instance) return
                                    field.onChange(instance.uid)
                                    setSelectedInstance(instance)
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
                                    const parameter = availableParameters[form.watch(`rows.${rowIndex}.instance.uid`)]?.find((param) => param.id === Number(value)) || null
                                    if (!parameter) return
                                    field.onChange(parameter.id)
                                    form.setValue(`rows.${rowIndex}.parameter.denotation`, parameter.denotation)
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
                              </Label>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  ))}
                  <Button
                    onClick={() => appendRow({ name: '', instance: { uid: '' }, parameter: { id: null, denotation: '' } })}
                    variant={'green'}
                    size={'icon'}
                    className="flex items-center justify-center w-1/2 m-auto"
                  >
                    <IoAdd /> Add Row
                  </Button>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            {form.formState.errors.rows && <FormMessage>{form.formState.errors.rows.message}</FormMessage>}
            {form.formState.errors.rows?.root && <FormMessage>{form.formState.errors.rows.root?.message}</FormMessage>}
            <Button type="submit" className="w-fit mt-4">
              Submit
            </Button>
          </form>
        </Form>
      </Card>
    </div>
  )
}

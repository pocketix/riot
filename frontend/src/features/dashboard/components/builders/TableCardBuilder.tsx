import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { IoAdd } from 'react-icons/io5'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import {
  SdInstancesWithParamsQuery,
  SdParameterType,
  SdTypeParametersWithSnapshotsQuery,
  useSdTypeParametersWithSnapshotsQuery
} from '@/generated/graphql'
import { z } from 'zod'
import { tableCardSchema, TableCardConfig } from '@/schemas/dashboard/TableBuilderSchema'
import { zodResolver } from '@hookform/resolvers/zod'
import { useFieldArray, useForm } from 'react-hook-form'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { TbTrash } from 'react-icons/tb'
import { Label } from '@/components/ui/label'
import { BuilderResult } from '@/types/dashboard/GridItem'
import { SingleInstanceCombobox } from './components/single-instance-combobox'
import { SingleParameterCombobox } from './components/single-parameter-combobox'
import { TimeFrameSelector } from './components/time-frame-selector'
import { AggregateFunctionCombobox } from './components/aggregate-function-combobox'
import { ResponsiveTooltip } from '@/components/responsive-tooltip'
import { InfoIcon } from 'lucide-react'

type TableCardBuilderResult = BuilderResult<TableCardConfig>

export interface TableCardBuilderProps {
  onDataSubmit: (data: TableCardBuilderResult) => void
  instances: SdInstancesWithParamsQuery['sdInstances']
  config?: TableCardConfig
}

export function TableCardBuilder({ onDataSubmit, instances, config }: TableCardBuilderProps) {
  const [selectedInstance, setSelectedInstance] = useState<SdInstancesWithParamsQuery['sdInstances'][number] | null>(
    null
  )
  const [availableParameters, setAvailableParameters] = useState<{
    [key: string]: SdTypeParametersWithSnapshotsQuery['sdType']['parameters']
  }>({})

  const { data: parametersData, refetch: refetchParameters } = useSdTypeParametersWithSnapshotsQuery({
    variables: { sdTypeId: selectedInstance?.type?.id! },
    skip: !selectedInstance
  })

  useEffect(() => {
    if (config) {
      config.rows.forEach((row) => {
        const wholeInstance = instances.find((inst) => inst.uid === row.instance.uid)

        if (wholeInstance) {
          refetchParameters({ sdTypeId: wholeInstance?.type?.id! }).then((result) => {
            setAvailableParameters((prev) => ({
              ...prev,
              [wholeInstance?.type.id!]: result.data.sdType.parameters
            }))
          })
        }
      })
    }
  }, [config, refetchParameters])

  useEffect(() => {
    if (parametersData && selectedInstance) {
      console.log('Got parameters data', parametersData, 'for instance', selectedInstance)
      setAvailableParameters((prev) => ({
        ...prev,
        [selectedInstance?.type.id!]: parametersData.sdType.parameters
      }))
    }
  }, [parametersData, selectedInstance])

  const form = useForm<z.infer<typeof tableCardSchema>>({
    resolver: zodResolver(tableCardSchema),
    defaultValues: config || {
      title: 'Area',
      tableTitle: 'Sensors',
      timeFrame: '24',
      decimalPlaces: 1,
      columns: [
        {
          header: '',
          function: ''
        }
      ],
      rows: [
        {
          name: '',
          instance: { uid: '', id: null },
          parameter: { id: null, denotation: '' }
        }
      ]
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

  const getParameterOptions = (instanceUID: string) => {
    const instance = instances.find((inst) => inst.uid === instanceUID)
    if (!instance) return []
    const parameters = availableParameters[instance.type?.id!]
    if (!parameters) return []

    // If any of the columns' functions are not 'last', return only number parameters
    // we cannot calculate statistics on non-number parameters
    // TODO: Make the user select columns first ?
    if (columnFields.some((column) => column.function !== 'last')) {
      return parameters.filter((param) => param.type === SdParameterType.Number)
    }
    return parameters
  }

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
        <table className="h-fit w-full">
          <thead className="border-b-[2px]">
            <tr>
              <th className="text-md text-left">{form.watch('tableTitle')}</th>
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
                  <td key={columnIndex} className="text-center text-sm">
                    {(Math.random() * 100).toFixed(form.watch('decimalPlaces') ?? 2)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card className="mt-4 h-fit w-full overflow-hidden p-2 pt-0 shadow-lg">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
              }
            }}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                        <ResponsiveTooltip
                          content={
                            <>
                              <p className="text-sm">
                                The number of decimal places to display in the table. The values inside this builder are{' '}
                                <b>randomly generated.</b>
                              </p>
                              <p className="text-sm text-muted-foreground">
                                In the final visualization, trailing zeros will be removed.
                              </p>
                            </>
                          }
                          side={'top'}
                          sideOffset={5}
                        >
                          <InfoIcon size={16} />
                        </ResponsiveTooltip>
                      </div>
                    </FormLabel>
                    <FormControl>
                      <Input
                        value={field.value}
                        onChange={(value) => {
                          console.log(value.target.value)
                          field.onChange(Number(value.target.value))
                        }}
                        type="number"
                        min={0}
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
                      <TimeFrameSelector
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value)
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Accordion type="single" collapsible className="mt-4 w-full">
              <AccordionItem value="columns">
                <AccordionTrigger>Columns</AccordionTrigger>
                <AccordionContent className="mt-2 flex w-full flex-col rounded-md border-2 p-2 px-1">
                  {columnFields.map((column, index) => (
                    <div key={column.id} className="flex flex-col">
                      <div className="flex w-full items-center justify-between gap-2">
                        <h4 className="font-semibold">Column {index + 1}</h4>
                        <Button type="button" onClick={() => removeColumn(index)} variant={'destructive'} size={'icon'}>
                          <TbTrash />
                        </Button>
                      </div>
                      <Separator className="my-2" />
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name={`columns.${index}.header`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Label>
                                  Header
                                  <Input
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder="Header"
                                    className="h-9 w-full"
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
                                  <AggregateFunctionCombobox
                                    value={field.value}
                                    onValueChange={(value) => {
                                      field.onChange(value)
                                    }}
                                  />
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
                  <Button
                    type="button"
                    onClick={() => appendColumn({ header: '', function: '' })}
                    variant={'green'}
                    size={'icon'}
                    className="m-auto flex w-1/2 items-center justify-center"
                  >
                    <IoAdd />
                    Add Column
                  </Button>
                </AccordionContent>
              </AccordionItem>
              {form.formState.errors?.columns?.length! > 0 && (
                <FormMessage>One or more columns are invalid</FormMessage>
              )}
              {form.formState.errors.columns && <FormMessage>{form.formState.errors.columns.message}</FormMessage>}
              {form.formState.errors.columns?.root && (
                <FormMessage>{form.formState.errors.columns.root?.message}</FormMessage>
              )}
              <AccordionItem value="rows">
                <AccordionTrigger>Rows</AccordionTrigger>
                <AccordionContent className="mt-2 flex w-full flex-col gap-4 rounded-md border-2 p-2">
                  {rowFields.map((row, rowIndex) => (
                    <div key={row.id} className="flex flex-col">
                      <div className="flex w-full items-center justify-between gap-2">
                        <h4 className="font-semibold">Row {rowIndex + 1}</h4>
                        <Button type="button" onClick={() => removeRow(rowIndex)} variant={'destructive'} size={'icon'}>
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
                                  value={field.value}
                                  onChange={field.onChange}
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
                        name={`rows.${rowIndex}.instance`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Label>
                                Instance
                                <SingleInstanceCombobox
                                  onValueChange={(value) => {
                                    field.onChange(value)
                                    setSelectedInstance(value)
                                    form.setValue(`rows.${rowIndex}.parameter`, { id: null, denotation: '' })
                                  }}
                                  value={field.value.id}
                                />
                              </Label>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`rows.${rowIndex}.parameter`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Label>
                                Parameter
                                <SingleParameterCombobox
                                  options={
                                    form.watch(`rows.${rowIndex}.instance.uid`)
                                      ? getParameterOptions(form.watch(`rows.${rowIndex}.instance.uid`))
                                      : []
                                  }
                                  value={
                                    field.value ? { id: field.value.id!, denotation: field.value.denotation } : null
                                  }
                                  onValueChange={(value) => field.onChange(value)}
                                  disabled={!form.watch(`rows.${rowIndex}.instance.uid`)}
                                />
                              </Label>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  ))}
                  <Button
                    type="button"
                    onClick={() =>
                      appendRow({ name: '', instance: { uid: '', id: null }, parameter: { id: null, denotation: '' } })
                    }
                    variant={'green'}
                    size={'icon'}
                    className="m-auto flex w-1/2 items-center justify-center"
                  >
                    <IoAdd /> Add Row
                  </Button>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            {form.formState.errors?.rows?.length! > 0 && <FormMessage>One or more rows are invalid</FormMessage>}
            {form.formState.errors.rows && <FormMessage>{form.formState.errors.rows.message}</FormMessage>}
            {form.formState.errors.rows?.root && <FormMessage>{form.formState.errors.rows.root?.message}</FormMessage>}
            <Button type="submit" className="mt-4 w-fit" onClick={() => console.log(form.formState)}>
              Submit
            </Button>
          </form>
        </Form>
      </Card>
    </div>
  )
}

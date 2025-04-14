import { z } from 'zod'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { IoAdd } from 'react-icons/io5'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { tableCardSchema, TableCardConfig } from '@/schemas/dashboard/TableBuilderSchema'
import { zodResolver } from '@hookform/resolvers/zod'
import { useFieldArray, useForm } from 'react-hook-form'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { TbTrash } from 'react-icons/tb'
import { Label } from '@/components/ui/label'
import { SingleInstanceCombobox } from './components/single-instance-combobox'
import { SingleParameterCombobox } from './components/single-parameter-combobox'
import { TimeFrameSelector } from './components/time-frame-selector'
import { AggregateFunctionCombobox } from './components/aggregate-function-combobox'
import { ResponsiveTooltip } from '@/components/responsive-tooltip'
import { InfoIcon } from 'lucide-react'
import { Parameter } from '@/context/InstancesContext'
import { TableRowData } from '../visualizations/ResponsiveTable'
import { ResponsiveTable } from '../visualizations/ResponsiveTable'
import { useRef } from 'react'

export interface TableCardBuilderViewProps {
  config?: TableCardConfig
  tableData: TableRowData[]
  onSubmit: (values: TableCardConfig, height: number) => void
  checkRowAndFetch: (config: TableCardConfig, rowIndex: number) => void
  fetchFullTableData: (config: TableCardConfig) => void
  getParameterOptions: (instanceID: number | null, columns: TableCardConfig['columns']) => Parameter[]
  handleRowDelete: (rowIndex: number) => void
  handleRowRename: (rowIndex: number, newName: string) => void
}

export function TableCardBuilderView(props: TableCardBuilderViewProps) {
  const tableRef = useRef<HTMLDivElement>(null)
  const form = useForm<z.infer<typeof tableCardSchema>>({
    resolver: zodResolver(tableCardSchema),
    defaultValues: props.config || {
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

  return (
    <div className="w-full">
      <Card className="h-fit w-full overflow-hidden p-2 pt-0" ref={tableRef}>
        {form.watch('title') && <h3 className="text-lg font-semibold">{form.watch('title')}</h3>}
        <ResponsiveTable
          key={JSON.stringify(props.tableData)}
          data={props.tableData}
          config={{
            ...form.watch()
          }}
        />
      </Card>
      <Card className="mt-4 h-fit w-full overflow-hidden p-2 pt-0 shadow-lg">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => {
              const height = tableRef.current?.getBoundingClientRect().height || 0
              props.onSubmit(values, height)
            })}
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
                              <p className="text-sm">The number of decimal places to display in the table.</p>
                              <p className="text-sm text-muted-foreground">
                                In the final visualization, trailing zeros will be removed.
                              </p>
                            </>
                          }
                        >
                          <InfoIcon size={16} />
                        </ResponsiveTooltip>
                      </div>
                    </FormLabel>
                    <FormControl>
                      <Input
                        value={field.value}
                        onChange={(e) => {
                          field.onChange(Number(e.target.value))
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
                          props.fetchFullTableData(form.getValues())
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
                <AccordionContent className="mt-2 flex w-full flex-col rounded-md border p-2 px-1">
                  {columnFields.map((column, index) => (
                    <div key={column.id} className="flex flex-col">
                      {index !== 0 && <Separator className="my-2" />}
                      <div className="flex w-full items-center justify-between gap-2">
                        <h4 className="font-semibold">Column {index + 1}</h4>
                        <Button
                          type="button"
                          onClick={() => {
                            removeColumn(index)
                            props.fetchFullTableData(form.getValues())
                          }}
                          variant={'destructive'}
                          size={'icon'}
                        >
                          <TbTrash />
                        </Button>
                      </div>
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
                                      props.fetchFullTableData(form.getValues())
                                    }}
                                  />
                                </Label>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    onClick={() => appendColumn({ header: '', function: '' })}
                    variant={'outline'}
                    size={'sm'}
                    className="m-auto mt-2 flex w-fit items-center justify-center gap-1"
                  >
                    <IoAdd />
                    Add Column
                  </Button>
                </AccordionContent>
              </AccordionItem>

              {form.formState.errors?.columns?.length! > 0 && (
                <FormMessage>One or more columns are invalid</FormMessage>
              )}

              <AccordionItem value="rows">
                <AccordionTrigger>Rows</AccordionTrigger>
                <AccordionContent className="flex w-full flex-col gap-2 rounded-md border p-2 px-1">
                  {rowFields.map((row, rowIndex) => (
                    <div key={row.id} className="flex flex-col">
                      {rowIndex !== 0 && <Separator className="my-2" />}
                      <div className="flex w-full items-center justify-between gap-4">
                        <h4 className="font-semibold">Row {rowIndex + 1}</h4>
                        <Button
                          type="button"
                          onClick={() => {
                            removeRow(rowIndex)
                            props.handleRowDelete(rowIndex)
                          }}
                          variant={'destructive'}
                          size={'icon'}
                        >
                          <TbTrash />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                                    onChange={(e) => {
                                      const value = e.target.value
                                      field.onChange(value)
                                      props.handleRowRename(rowIndex, value)
                                    }}
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
                                      form.watch(`rows.${rowIndex}.instance.id`)
                                        ? props.getParameterOptions(
                                            form.watch(`rows.${rowIndex}.instance.id`),
                                            form.watch('columns')
                                          )
                                        : []
                                    }
                                    value={
                                      field.value ? { id: field.value.id!, denotation: field.value.denotation } : null
                                    }
                                    onValueChange={(value) => {
                                      field.onChange(value)
                                      // Trigger data fetch when parameter changes
                                      props.checkRowAndFetch(form.getValues(), rowIndex)
                                    }}
                                    disabled={!form.watch(`rows.${rowIndex}.instance.uid`)}
                                  />
                                </Label>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    onClick={() =>
                      appendRow({ name: '', instance: { uid: '', id: null }, parameter: { id: null, denotation: '' } })
                    }
                    variant={'outline'}
                    size={'sm'}
                    className="m-auto mt-2 flex w-fit items-center justify-center gap-1"
                  >
                    <IoAdd /> Add Row
                  </Button>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {form.formState.errors?.rows?.length! > 0 && <FormMessage>One or more rows are invalid</FormMessage>}

            <Button type="submit" className="ml-auto mt-4 flex">
              Submit
            </Button>
          </form>
        </Form>
      </Card>
    </div>
  )
}

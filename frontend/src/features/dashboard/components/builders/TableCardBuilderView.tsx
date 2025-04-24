import { z } from 'zod'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { IoAdd } from 'react-icons/io5'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { tableCardSchema, TableCardConfig } from '@/schemas/dashboard/visualizations/TableBuilderSchema'
import { zodResolver } from '@hookform/resolvers/zod'
import { FieldErrors, useFieldArray, useForm } from 'react-hook-form'
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
import { ArrowDown, ArrowUp, InfoIcon } from 'lucide-react'
import { Parameter } from '@/context/InstancesContext'
import { ResponsiveTable } from '../visualizations/ResponsiveTable'
import { useRef, useState } from 'react'
import { TableColumnData } from '../cards/TableCardController'
import IconPicker from '@/ui/IconPicker'
import { getCustomizableIcon } from '@/utils/getCustomizableIcon'

export interface TableCardBuilderViewProps {
  config?: TableCardConfig
  tableData: TableColumnData[]
  onSubmit: (values: TableCardConfig, height: number) => void
  fetchFullTableData: (config: TableCardConfig) => void
  fetchSingleRowData: (config: TableCardConfig, rowIndex: number) => void
  fetchSingleColumnData: (config: TableCardConfig, columnIndex: number) => void
  getParameterOptions: (instanceID: number | null, columns: TableCardConfig['columns']) => Parameter[]
  handleRowMove: (fromIndex: number, toIndex: number) => void
  handleRowDelete: (rowIndex: number) => void
  handleColumnMove: (fromIndex: number, toIndex: number) => void
  handleColumnDelete: (columnIndex: number) => void
}

export function TableCardBuilderView(props: TableCardBuilderViewProps) {
  const [openAccordions, setOpenAccordions] = useState<string[]>([])
  const tableRef = useRef<HTMLDivElement>(null)
  const form = useForm<z.infer<typeof tableCardSchema>>({
    resolver: zodResolver(tableCardSchema),
    defaultValues: props.config || {
      title: 'Area',
      icon: '',
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
    remove: removeColumn,
    move: moveColumn
  } = useFieldArray({
    control: form.control,
    name: 'columns'
  })

  const {
    fields: rowFields,
    append: appendRow,
    remove: removeRow,
    move: moveRow
  } = useFieldArray({
    control: form.control,
    name: 'rows'
  })

  const handleError = (errors: FieldErrors<z.infer<typeof tableCardSchema>>) => {
    const accordionsToOpen: string[] = []

    if (errors.columns) accordionsToOpen.push('columns')
    if (errors.rows) accordionsToOpen.push('rows')

    setOpenAccordions(accordionsToOpen)
  }

  const iconValue = form.watch('icon') ?? ''
  const IconComponent = iconValue ? getCustomizableIcon(iconValue) : null

  return (
    <div className="w-full">
      <Card className="h-fit w-full overflow-hidden p-2 pt-0" ref={tableRef}>
        <div className="flex items-center gap-1">
          {IconComponent && <IconComponent className="h-5 w-5 text-muted-foreground" />}
          {form.watch('title') && <h3 className="text-lg font-semibold">{form.watch('title')}</h3>}
        </div>
        <ResponsiveTable
          key={JSON.stringify(props.tableData)}
          columnData={props.tableData}
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
            }, handleError)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
              }
            }}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-1">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="w-full">
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
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icon</FormLabel>
                      <FormControl>
                        <IconPicker icon={field.value ?? ''} setIcon={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
                  <FormItem>
                    <FormLabel>
                      <div className="inline-flex gap-1">
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
            <Accordion type="multiple" className="mt-4 w-full" value={openAccordions} onValueChange={setOpenAccordions}>
              <AccordionItem value="columns">
                <AccordionTrigger>Columns</AccordionTrigger>
                <AccordionContent className="mt-2 flex w-full flex-col rounded-md border p-2 px-1">
                  {columnFields.map((column, index) => (
                    <div key={column.id} className="flex flex-col">
                      {index !== 0 && <Separator className="my-2" />}
                      <div className="flex w-full items-center justify-between gap-2">
                        <h4 className="font-semibold">Column {index + 1}</h4>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            disabled={index === 0}
                            onClick={() => {
                              props.handleColumnMove(index, index - 1)
                              moveColumn(index, index - 1)
                            }}
                          >
                            <ArrowUp size={14} />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            disabled={index === columnFields.length - 1}
                            onClick={() => {
                              props.handleColumnMove(index, index + 1)
                              moveColumn(index, index + 1)
                            }}
                          >
                            <ArrowDown size={14} />
                          </Button>
                          <Button
                            type="button"
                            onClick={() => {
                              props.handleColumnDelete(index)
                              removeColumn(index)
                            }}
                            variant="destructive"
                            size="icon"
                            className="h-6 w-6"
                          >
                            <TbTrash size={14} />
                          </Button>
                        </div>
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
                                      props.fetchSingleColumnData(form.getValues(), index)
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
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            disabled={rowIndex === 0}
                            onClick={() => {
                              props.handleRowMove(rowIndex, rowIndex - 1)
                              moveRow(rowIndex, rowIndex - 1)
                            }}
                          >
                            <ArrowUp size={14} />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            disabled={rowIndex === rowFields.length - 1}
                            onClick={() => {
                              props.handleRowMove(rowIndex, rowIndex + 1)
                              moveRow(rowIndex, rowIndex + 1)
                            }}
                          >
                            <ArrowDown size={14} />
                          </Button>
                          <Button
                            type="button"
                            onClick={() => {
                              removeRow(rowIndex)
                              props.handleRowDelete(rowIndex)
                            }}
                            variant="destructive"
                            size="icon"
                            className="h-6 w-6"
                          >
                            <TbTrash size={14} />
                          </Button>
                        </div>
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
                                      // props.handleRowRename(rowIndex, value)
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
                                      props.fetchSingleRowData(form.getValues(), rowIndex)
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

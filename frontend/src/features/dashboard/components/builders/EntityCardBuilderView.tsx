import { z } from 'zod'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { IoAdd } from 'react-icons/io5'
import { Select, SelectValue, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select'
import { EntityCardConfig, entityCardSchema } from '@/schemas/dashboard/EntityCardBuilderSchema'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useFieldArray } from 'react-hook-form'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Serie } from '@nivo/line'
import { Separator } from '@/components/ui/separator'
import { TbTrash } from 'react-icons/tb'
import { SingleInstanceCombobox } from './components/single-instance-combobox'
import { SingleParameterCombobox } from './components/single-parameter-combobox'
import { TimeFrameSelector } from './components/time-frame-selector'
import { Parameter } from '@/context/InstancesContext'
import { ResponsiveEntityTable } from '../visualizations/ResponsiveEntityTable'
import { ResponsiveTooltip } from '@/components/responsive-tooltip'
import { InfoIcon } from 'lucide-react'
import { SdParameterType } from '@/generated/graphql'
import { useRef } from 'react'

export interface EntityCardBuilderViewProps {
  config?: EntityCardConfig
  onSubmit: (values: EntityCardConfig, height: number) => void
  onCheckRowAndFetch: (rowData: EntityCardConfig['rows'][number]) => void
  getParameterOptions: (instanceID: number | null, visualization: string | null) => Parameter[]
  sparklineData: Record<string, Serie[]>
}

export function EntityCardBuilderView(props: EntityCardBuilderViewProps) {
  const tableRef = useRef<HTMLDivElement>(null)
  const form = useForm<z.infer<typeof entityCardSchema>>({
    mode: 'onChange',
    resolver: zodResolver(entityCardSchema),
    defaultValues: props.config || {
      title: 'Entity Card',
      rows: [
        {
          name: '',
          instance: { uid: '', id: null },
          parameter: { id: null, denotation: '' },
          visualization: null,
          timeFrame: '24',
          decimalPlaces: 1,
          valueSymbol: ''
        }
      ]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'rows'
  })

  return (
    <div className="w-full">
      <Card className="h-fit w-full overflow-hidden p-2 pt-0" ref={tableRef}>
        {form.watch('title') && <h3 className="text-lg font-semibold">{form.watch('title')}</h3>}
        <ResponsiveEntityTable config={{ ...form.watch() }} sparklineData={props.sparklineData} />
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
            {fields.map((field, index) => (
              <div key={`${field.id}-${index}`}>
                <Separator className="my-2" />

                <div className="flex flex-col items-start rounded-lg border-2 p-2 shadow-sm">
                  <div className="flex w-full items-center justify-between">
                    <h4 className="font-semibold">Row {index + 1}</h4>
                    <Button
                      onClick={() => remove(index)}
                      variant={'destructive'}
                      size={'icon'}
                      className="flex items-center justify-center"
                    >
                      <TbTrash />
                    </Button>
                  </div>

                  <Separator className="my-2" />

                  <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name={`rows.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Row Name</FormLabel>
                          <FormControl>
                            <Input
                              onChange={field.onChange}
                              value={field.value}
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
                      name={`rows.${index}.instance`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Instance</FormLabel>
                          <FormControl>
                            <SingleInstanceCombobox
                              onValueChange={(value) => {
                                field.onChange({ id: value.id, uid: value.uid })
                                form.resetField(`rows.${index}.parameter`)
                              }}
                              value={field.value.id}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`rows.${index}.visualization`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Visualization</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value)
                                form.resetField(`rows.${index}.parameter`)
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

                    <FormField
                      control={form.control}
                      name={`rows.${index}.parameter`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Parameter</FormLabel>
                          <FormControl>
                            <SingleParameterCombobox
                              options={props.getParameterOptions(
                                form.getValues(`rows.${index}.instance.id`),
                                form.getValues(`rows.${index}.visualization`)
                              )}
                              onValueChange={(value) => {
                                field.onChange(value)
                                props.onCheckRowAndFetch(form.getValues(`rows.${index}`))
                              }}
                              value={field.value ? { id: field.value.id!, denotation: field.value.denotation } : null}
                              disabled={
                                !form.watch(`rows.${index}.instance.uid`) || !form.watch(`rows.${index}.visualization`)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {form.watch(`rows.${index}.visualization`) === 'sparkline' && (
                      <FormField
                        control={form.control}
                        name={`rows.${index}.timeFrame`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Time Frame</FormLabel>
                            <FormControl>
                              <TimeFrameSelector
                                onValueChange={(value) => {
                                  field.onChange(value)
                                  props.onCheckRowAndFetch(form.getValues(`rows.${index}`))
                                }}
                                value={field.value}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {form.watch(`rows.${index}.visualization`) === 'immediate' &&
                      props
                        .getParameterOptions(
                          form.getValues(`rows.${index}.instance.id`),
                          form.getValues(`rows.${index}.visualization`)
                        )
                        .find((p) => p.id === form.watch(`rows.${index}.parameter.id`))?.type ===
                        SdParameterType.Number && (
                        <FormField
                          control={form.control}
                          name={`rows.${index}.decimalPlaces`}
                          render={({ field }) => (
                            <FormItem className="self-end">
                              <FormLabel className="flex items-center gap-1">
                                Decimal Places
                                <ResponsiveTooltip
                                  content={
                                    <div>
                                      <p className="text-sm">Number of decimal places to display</p>
                                      <p className="text-sm text-muted-foreground">
                                        Keep in mind, that the data might not have the same/enough precision as
                                        specified here
                                      </p>
                                      <p className="text-sm text-muted-foreground">Trailing zeroes will be trimmed.</p>
                                    </div>
                                  }
                                >
                                  <InfoIcon className="h-4 w-4 text-muted-foreground" />
                                </ResponsiveTooltip>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  value={field.value}
                                  onChange={(value) => {
                                    field.onChange(value)
                                  }}
                                  placeholder="2"
                                  className="w-full"
                                  min={0}
                                  step={1}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                    {form.watch(`rows.${index}.visualization`) === 'immediate' && (
                      <FormField
                        control={form.control}
                        name={`rows.${index}.valueSymbol`}
                        render={({ field }) => (
                          <FormItem className="self-end">
                            <FormLabel className="flex items-center gap-1">
                              Value Symbol
                              <ResponsiveTooltip
                                content={
                                  <div>
                                    <p className="text-sm">Symbol to display after the value</p>
                                    <p className="text-sm text-muted-foreground">e.g. °C, %</p>
                                  </div>
                                }
                              >
                                <InfoIcon className="h-4 w-4 text-muted-foreground" />
                              </ResponsiveTooltip>
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="text"
                                value={field.value}
                                onChange={(value) => {
                                  field.onChange(value)
                                }}
                                placeholder="°C"
                                className="w-full"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
            {form.formState.errors.rows && <FormMessage>{form.formState.errors.rows.message}</FormMessage>}
            <Button
              type="button"
              onClick={() => {
                append({
                  name: '',
                  instance: { uid: '', id: null },
                  parameter: { id: null, denotation: '' },
                  visualization: null,
                  timeFrame: '24'
                })
              }}
              variant={'outline'}
              size={'sm'}
              className="m-auto mt-2 flex w-fit items-center justify-center gap-1"
            >
              <IoAdd /> Add Row
            </Button>

            <Button type="submit" className="ml-auto mt-4 flex">
              Submit
            </Button>
          </form>
        </Form>
      </Card>
    </div>
  )
}

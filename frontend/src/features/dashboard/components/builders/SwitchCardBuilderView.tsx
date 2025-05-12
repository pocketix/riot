import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SwitchCardConfig, switchCardSchema } from '@/schemas/dashboard/visualizations/SwitchBuilderSchema'
import { zodResolver } from '@hookform/resolvers/zod'
import { FieldErrors, useForm } from 'react-hook-form'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { SingleInstanceCombobox } from './components/single-instance-combobox'
import { SingleParameterCombobox } from './components/single-parameter-combobox'
import { SwitchVisualization } from '../visualizations/SwitchVisualization'
import { Parameter } from '@/context/InstancesContext'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ResponsiveTooltip } from '@/components/responsive-tooltip'
import { Info } from 'lucide-react'
import { getCustomizableIcon } from '@/utils/getCustomizableIcon'
import { SdParameterType } from '@/generated/graphql'
import { useState } from 'react'
import { ResponsiveDialog } from '../cards/components/ResponsiveDialog'
import { IconPicker } from './components/icon-picker'

export interface SwitchBuilderViewProps {
  config?: SwitchCardConfig
  onSubmit: (values: SwitchCardConfig) => void
  onStateParameterChange: (instanceId: number, parameterId: number) => void
  onPercentageParameterChange: (instanceId: number, parameterId: number, lowerBound: number, upperBound: number) => void
  getParameterOptions: (instanceID: number | null, filter: 'number' | 'boolean') => Parameter[]
  getInstanceName: (instanceID: number | null) => string | null
  getBounds: (instanceID: number, parameterID: number) => Promise<{ min: number; max: number }>
  previewData: {
    isOn: boolean
    percentage: number
  }
  isLoading: boolean
}

export function SwitchBuilderView(props: SwitchBuilderViewProps) {
  const [boundsDialogOpen, setBoundsDialogOpen] = useState(false)
  const [openAccordion, setOpenAccordion] = useState<string[]>(['state'])

  // Handles the optional object in schema as upon opening the accordion, it is initialized and perceived as semi-filled
  function percentualSettingsEmpty(percentualSettings?: SwitchCardConfig['percentualSettings']) {
    if (!percentualSettings) return true
    return (
      percentualSettings.instanceID === undefined &&
      percentualSettings.parameter?.id === undefined &&
      percentualSettings.lowerBound === undefined &&
      percentualSettings.upperBound === undefined
    )
  }

  const resolver = async (values: any, context: any, options: any) => {
    const cleaned = { ...values }
    if (percentualSettingsEmpty(cleaned.percentualSettings)) {
      delete cleaned.percentualSettings
    }
    return zodResolver(switchCardSchema)(cleaned, context, options)
  }

  const form = useForm<SwitchCardConfig>({
    resolver,
    defaultValues: props.config || {
      title: 'Switch Status',
      icon: 'TbBulb',
      booleanSettings: {
        instanceID: -1,
        parameter: {
          id: -1,
          denotation: ''
        }
      }
    }
  })

  const IconComponent = getCustomizableIcon(form.watch('icon')!)

  const handleGetAutomaticBounds = async (instanceID: number, parameterID: number) => {
    const { min, max } = await props.getBounds(instanceID, parameterID)
    form.setValue('percentualSettings.lowerBound', min, { shouldValidate: true })
    form.setValue('percentualSettings.upperBound', max, { shouldValidate: true })
  }

  const handleError = (errors: FieldErrors<SwitchCardConfig>) => {
    const open: string[] = []
    if (errors.booleanSettings) open.push('state')
    if (errors.percentualSettings) open.push('percentage')
    setOpenAccordion(open)
  }

  return (
    <div className="w-full">
      <Card className="relative mb-4 p-2">
        <div className="absolute inset-0 z-10" />
        <h3 className="mb-4 text-lg font-semibold">Switch Preview</h3>
        <div className="py-2">
          <SwitchVisualization
            isOn={props.previewData.isOn}
            percentage={props.previewData.percentage}
            icon={IconComponent}
            title={form.watch('title')}
            isLoading={props.isLoading}
            isError={false}
          />
        </div>
      </Card>

      <Card className="p-2">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(props.onSubmit, handleError)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
              }
            }}
          >
            <div className="flex w-full items-center gap-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="Enter title" {...field} />
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
                      <IconPicker icon={field.value!} setIcon={(value) => field.onChange(value)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Accordion type="multiple" className="mt-4" value={openAccordion} onValueChange={setOpenAccordion}>
              <AccordionItem value="state">
                <AccordionTrigger>State Configuration</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="booleanSettings.instanceID"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="inline-flex gap-1">
                            State Instance
                            <ResponsiveTooltip
                              content={
                                <div>
                                  <p className="text-sm">Why are there instances missing?</p>
                                  <p className="text-sm text-muted-foreground">
                                    Only instances with at least one boolean parameter are shown.
                                  </p>
                                </div>
                              }
                            >
                              <Info className="h-4 w-4" />
                            </ResponsiveTooltip>
                          </FormLabel>
                          <FormControl>
                            <SingleInstanceCombobox
                              onValueChange={(instance) => {
                                field.onChange(instance?.id || null)
                                form.setValue('booleanSettings.parameter', {
                                  id: 0,
                                  denotation: ''
                                })
                              }}
                              value={field.value}
                              filter={SdParameterType.Boolean}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="booleanSettings.parameter"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="inline-flex gap-1">
                            State Parameter
                            <ResponsiveTooltip
                              content={
                                <div>
                                  <p className="text-sm text-muted-foreground">
                                    Only boolean parameters are supported for state configuration.
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    This determines the state of the switch (ON/OFF).
                                  </p>
                                </div>
                              }
                            >
                              <Info className="h-4 w-4" />
                            </ResponsiveTooltip>
                          </FormLabel>
                          <FormControl>
                            <SingleParameterCombobox
                              value={Number(field.value.id) === -1 ? null : field.value}
                              onValueChange={(value) => {
                                props.onStateParameterChange(form.getValues('booleanSettings.instanceID'), value?.id!)
                                field.onChange(value)
                              }}
                              options={props.getParameterOptions(form.watch('booleanSettings.instanceID'), 'boolean')}
                              disabled={form.watch('booleanSettings.instanceID') === -1}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="percentage">
                <AccordionTrigger>Percentage Configuration</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="percentualSettings.instanceID"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Percentage Instance</FormLabel>
                          <FormControl>
                            <SingleInstanceCombobox
                              allowClear={true}
                              onValueChange={(instance) => {
                                if (instance) {
                                  form.setValue('percentualSettings', {
                                    instanceID: instance.id,
                                    parameter: { id: -1, denotation: '' },
                                    lowerBound: null,
                                    upperBound: null
                                  })
                                  field.onChange(instance?.id)
                                } else {
                                  field.onChange(null)
                                  form.setValue('percentualSettings', undefined)
                                }
                              }}
                              value={field.value!}
                              filter={SdParameterType.Number}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="percentualSettings.parameter"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="inline-flex gap-1">
                            Percentage Parameter
                            <ResponsiveTooltip
                              content={
                                <div>
                                  <p className="text-sm text-muted-foreground">
                                    Only number parameters are supported for percentage configuration.
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    This determines the percentage value of the switch.
                                  </p>
                                </div>
                              }
                            >
                              <Info className="h-4 w-4" />
                            </ResponsiveTooltip>
                          </FormLabel>
                          <FormControl>
                            <SingleParameterCombobox
                              value={Number(field.value?.id!) === -1 ? null : field.value}
                              onValueChange={(parameter) => {
                                props.onPercentageParameterChange(
                                  form.getValues('percentualSettings.instanceID')!,
                                  parameter?.id!,
                                  form.getValues('percentualSettings.lowerBound')!,
                                  form.getValues('percentualSettings.upperBound')!
                                )
                                if (
                                  !form.getValues('percentualSettings.lowerBound') &&
                                  !form.getValues('percentualSettings.upperBound')
                                ) {
                                  setBoundsDialogOpen(true)
                                }
                                field.onChange(parameter)
                              }}
                              options={props.getParameterOptions(
                                form.watch('percentualSettings.instanceID')!,
                                'number'
                              )}
                              disabled={form.watch('percentualSettings.instanceID') === -1}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="percentualSettings.lowerBound"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lower Bound</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Lower bound"
                              value={field.value ?? ''}
                              onChange={(e) => {
                                props.onPercentageParameterChange(
                                  form.getValues('percentualSettings.instanceID')!,
                                  form.getValues('percentualSettings.parameter.id'),
                                  parseFloat(e.target.value),
                                  form.getValues('percentualSettings.upperBound')!
                                )
                                field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="percentualSettings.upperBound"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="inline-flex gap-1">
                            Upper Bound
                            <ResponsiveTooltip
                              content={
                                <div>
                                  <p className="text-sm text-muted-foreground">
                                    The upper bound for the percentage value. This value should be greater than the
                                    lower bound.
                                  </p>
                                </div>
                              }
                            >
                              <Info className="h-4 w-4" />
                            </ResponsiveTooltip>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Upper bound"
                              value={field.value ?? ''}
                              onChange={(e) => {
                                props.onPercentageParameterChange(
                                  form.getValues('percentualSettings.instanceID')!,
                                  form.getValues('percentualSettings.parameter.id'),
                                  form.getValues('percentualSettings.lowerBound')!,
                                  parseFloat(e.target.value)
                                )
                                field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            <ResponsiveDialog
              externalOpen={boundsDialogOpen}
              onExternalOpenChange={setBoundsDialogOpen}
              title="Automatic Bounds"
              description="Would you like to set the bounds automatically based on the selected parameter? You can always change them later."
              onSuccess={() =>
                handleGetAutomaticBounds(
                  form.getValues('percentualSettings.instanceID')!,
                  form.getValues('percentualSettings.parameter.id')
                )
              }
            />
            <Button type="submit" className="ml-auto mt-4 flex">
              Submit
            </Button>
          </form>
        </Form>
      </Card>
    </div>
  )
}

import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { SingleInstanceCombobox } from './components/single-instance-combobox'
import { SingleParameterCombobox } from './components/single-parameter-combobox'
import IconPicker from '@/ui/IconPicker'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import {
  sequentialStatesBuilderSchema,
  SequentialStatesCardConfig
} from '@/schemas/dashboard/visualizations/SequentialStatesBuilderSchema'
import { getCustomizableIcon } from '@/utils/getCustomizableIcon'
import { SequentialStatesVisualization } from '../devices/components/SequentialStatesVisualization'
import { Datum } from '@nivo/line'
import { useEffect, useMemo } from 'react'
import { TimeFrameSelector } from './components/time-frame-selector'
import { useInstances } from '@/context/InstancesContext'

interface SequentialStatesBuilderViewProps {
  data: Datum[]
  config?: SequentialStatesCardConfig
  onSubmit: (values: SequentialStatesCardConfig) => void
  getParameterOptions: (instanceID: number | null) => any[]
  fetchPreviewData: (instanceUid: string, parameterDenotation: string, timeFrame: string) => Promise<void>
  ereaseData: () => void
}

export function SequentialStatesBuilderView(props: SequentialStatesBuilderViewProps) {
  const { getInstanceById, getParameterByIds } = useInstances()
  const form = useForm<SequentialStatesCardConfig>({
    resolver: zodResolver(sequentialStatesBuilderSchema),
    defaultValues: props.config || {
      title: '',
      icon: '',
      instance: { id: null, uid: '' },
      parameter: { id: null, denotation: '' },
      timeFrame: '24'
    }
  })

  const instance = form.watch('instance')
  const parameter = form.watch('parameter')
  const timeFrame = form.watch('timeFrame')

  useEffect(() => {
    if (instance?.uid && parameter?.denotation && timeFrame) {
      props.fetchPreviewData(instance.uid, parameter.denotation, timeFrame)
    } else {
      props.ereaseData()
    }
  }, [instance?.uid, parameter?.denotation, timeFrame])

  const wholeInstance = useMemo(() => {
    if (instance?.id) {
      return getInstanceById(instance.id)
    }
    return null
  }, [instance?.id, getInstanceById])

  const wholeParameter = useMemo(() => {
    if (parameter?.id) {
      return getParameterByIds(instance?.id!, parameter.id!)
    }
    return null
  }, [instance?.id, parameter?.id, getParameterByIds])

  const iconValue = form.watch('icon') ?? ''
  const IconComponent = iconValue ? getCustomizableIcon(iconValue) : null

  return (
    <div className="w-full">
      <Card className="h-fit min-h-[70px] w-full overflow-hidden p-2 pt-0">
        <div className="flex items-center gap-2">
          {IconComponent && <IconComponent className="h-5 w-5 text-muted-foreground" />}
          {form.watch('title') && <h3 className="text-lg font-semibold">{form.watch('title')}</h3>}
        </div>
        <div className="h-[60px] w-full overflow-hidden">
          <SequentialStatesVisualization
            data={props.data}
            dataInfo={{
              instanceName: wholeInstance?.userIdentifier || instance?.uid!,
              parameterName: wholeParameter?.label || wholeParameter?.denotation || parameter?.denotation
            }}
          />
        </div>
      </Card>
      <Card className="p-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(props.onSubmit)}>
            <div className="flex w-full items-center gap-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Card Title</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
              name="instance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instance</FormLabel>
                  <FormControl>
                    <SingleInstanceCombobox
                      value={field.value.id}
                      onValueChange={(instance) => {
                        form.setValue('parameter', { id: null, denotation: '' })
                        field.onChange(instance)
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="parameter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parameter</FormLabel>
                  <FormControl>
                    <SingleParameterCombobox
                      value={field.value}
                      options={props.getParameterOptions(form.watch('instance.id'))}
                      onValueChange={(param) => field.onChange(param)}
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
                  <FormLabel>timeFrame</FormLabel>
                  <FormControl>
                    <TimeFrameSelector value={field.value} onValueChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="mt-4">
              Submit
            </Button>
          </form>
        </Form>
      </Card>
    </div>
  )
}

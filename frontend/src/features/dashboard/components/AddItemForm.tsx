import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useQuery, useLazyQuery } from '@apollo/client'
import { GET_INSTANCES, GET_PARAMETERS, GET_SAMPLEDATA } from '@/graphql/Queries'
import { AddItemCombobox } from './AddItemCombobox'
import { ParameterCombobox } from './ParameterCombobox'
import type { SdInstance, SdParameter, SdType } from '@/../../src/generated/graphql'
import { useEffect, useState } from 'react'
import { VisualizationGallery } from './visualizationExamples/VisualizationGallery'
import { VisualizationBuilder } from './VisualizationBuilder'
import { GridItem } from '@/types/GridItem'

const formSchema = z.object({
  device: z.string().min(1, {
    message: 'A device must be selected'
  }),
  parameter: z.string().min(1, {
    message: 'A parameter must be selected'
  }),
  visualization: z.string().min(1, {
    message: 'A visualization must be chosen'
  }),
  details: z
    .string()
    .min(1, {
      message: 'Details must be filled'
    })
    .optional()
})

export interface AddItemFormProps {
  setDialogOpen: (open: boolean) => void
  onAddItem: (item: GridItem) => void
}

export function AddItemForm({ setDialogOpen, onAddItem }: AddItemFormProps) {
  const { data } = useQuery<{ sdInstances: SdInstance[] }>(GET_INSTANCES)
  const [selectedDevice, setSelectedDevice] = useState<SdInstance | null>(null)

  const [availableParameters, setAvailableParameters] = useState<SdParameter[] | null>(null)
  const [selectedParameter, setSelectedParameter] = useState<SdParameter | null>(null)

  const [selectedVisualization, setSelectedVisualization] = useState<'line' | 'switch' | 'table' | 'bullet' | 'entitycard' | null>(null)

  const [activeTab, setActiveTab] = useState('device')
  const [processedData, setProcessedData] = useState<any[] | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      device: '',
      parameter: '',
      visualization: '',
      details: ''
    }
  })

  const [getParameters, { data: parametersData }] = useLazyQuery<{ sdType: SdType }>(GET_PARAMETERS)

  useEffect(() => {
    if (selectedDevice) {
      getParameters({
        variables: {
          sdTypeId: selectedDevice.type.id
        }
      })
    }
  }, [selectedDevice, getParameters])

  useEffect(() => {
    if (parametersData) {
      setAvailableParameters(parametersData.sdType.parameters)
    }
  }, [parametersData])

  const [getSampleData, { data: sampleData, error }] = useLazyQuery(GET_SAMPLEDATA)

  useEffect(() => {
    if (selectedParameter) {
      getSampleData({
        variables: {
          sensors: {
            sensors: [
              {
                key: selectedDevice?.uid,
                values: [selectedParameter?.denotation]
              }
            ]
          },
          request: {
            from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            aggregateMinutes: '30',
            operation: 'last'
          }
        }
      })
    }
  }, [selectedParameter, selectedDevice, getSampleData])

  // TODO: This will need to change for multiple parameters
  useEffect(() => {
    if (sampleData) {
      setProcessedData(
        sampleData.statisticsQuerySensorsWithFields.map((item: any) => {
          const parsedData = JSON.parse(item.data)
          const { host, ...rest } = parsedData
          return {
            x: item.time,
            y: rest[selectedParameter?.denotation!]
          }
        })
      )
      console.log('Processed data', sampleData.statisticsQuerySensorsWithFields)
    }
    if (error) {
      console.error('Error fetching sample data', error)
    }
  }, [sampleData, error])

  const deviceValue = form.watch('device')
  const parameterValue = form.watch('parameter')
  const visualizationValue = form.watch('visualization')

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log('Form values', values)
    const item: GridItem = {
      instance: selectedDevice!,
      parameters: [selectedParameter!],
      visualization: selectedVisualization!,
      visualizationConfig: values.details
    }
    onAddItem(item)
    setDialogOpen(false)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="sm:space-y-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="device">Device</TabsTrigger>
            <TabsTrigger value="parameter" disabled={!deviceValue}>
              Parameter
            </TabsTrigger>
            <TabsTrigger value="visualization" disabled={!parameterValue}>
              Visualization
            </TabsTrigger>
            <TabsTrigger value="details" disabled={!visualizationValue}>
              Details
            </TabsTrigger>
          </TabsList>
          <TabsContent value="device">
            <FormField
              control={form.control}
              name="device"
              render={() => (
                <FormItem>
                  <FormLabel>Select a device</FormLabel>
                  <FormControl>
                    <AddItemCombobox
                      instances={data?.sdInstances}
                      selectedInstance={selectedDevice}
                      setInstance={(instance) => {
                        setSelectedDevice(instance)
                        form.setValue('device', instance?.type?.denotation || '')
                        setSelectedParameter(null)
                        form.setValue('parameter', '')
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end mt-4">
              <Button disabled={!deviceValue} onClick={() => setActiveTab('parameter')}>
                Next
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="parameter">
            <FormField
              control={form.control}
              name="parameter"
              render={() => (
                <FormItem>
                  <FormLabel>Select a parameter</FormLabel>
                  <FormControl>
                    <ParameterCombobox
                      parameters={availableParameters}
                      selectedParameter={selectedParameter}
                      setParameter={(parameter) => {
                        setSelectedParameter(parameter)
                        form.setValue('parameter', parameter?.denotation || '')
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end mt-4">
              <Button disabled={!deviceValue || !parameterValue} onClick={() => setActiveTab('visualization')}>
                Next
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="visualization">
            <FormField
              control={form.control}
              name="visualization"
              render={() => (
                <FormItem>
                  <FormLabel>Choose a visualization</FormLabel>
                  <FormControl>
                    <div>
                      <VisualizationGallery
                        selectedVisualization={selectedVisualization}
                        setSelectedVisualization={(visualization) => {
                          setSelectedVisualization(visualization as 'line' | 'switch' | 'table' | 'bullet' | 'entitycard')
                          form.setValue('visualization', visualization)
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end mt-4">
              <Button disabled={!deviceValue || !parameterValue || !selectedVisualization} onClick={() => setActiveTab('details')}>
                Next
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="details">
            <FormField
              control={form.control}
              name="details"
              render={() => (
                <FormItem>
                  <FormLabel>Style the selected visualization</FormLabel>
                  <FormControl>
                    <VisualizationBuilder
                      selectedVisualization={selectedVisualization}
                      setVisualizationDetails={(data) => {
                        form.setValue('details', data)
                      }}
                      selectedParameter={selectedParameter!}
                      data={processedData}
                      instances={data?.sdInstances || []}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>
      </form>
    </Form>
  )
}

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useQuery, useLazyQuery } from '@apollo/client'
import { GET_INSTANCES, GET_PARAMETERS, GET_SAMPLEDATA } from '@/graphql/Queries'
import type { SdInstance, SdParameter, SdType } from '@/../../src/generated/graphql'
import { VisualizationGallery } from './visualizationExamples/VisualizationGallery'
import { VisualizationBuilder } from './VisualizationBuilder'
import { GridItem } from '@/types/GridItem'
import { Button } from '@/components/ui/button'
import { FaArrowRight } from 'react-icons/fa6'

export interface AddItemFormProps {
  setDialogOpen: (open: boolean) => void
  onAddItem: (item: GridItem) => void
}

export function AddItemForm({ setDialogOpen, onAddItem }: AddItemFormProps) {
  const { data } = useQuery<{ sdInstances: SdInstance[] }>(GET_INSTANCES)
  const [selectedVisualization, setSelectedVisualization] = useState<'line' | 'switch' | 'table' | 'bullet' | 'entitycard' | null>(null)
  const [activeTab, setActiveTab] = useState('visualization')

  // const [getParameters, { data: parametersData }] = useLazyQuery<{ sdType: SdType }>(GET_PARAMETERS)

  // useEffect(() => {
  //   if (selectedDevice) {
  //     getParameters({
  //       variables: {
  //         sdTypeId: selectedDevice.type.id
  //       }
  //     })
  //   }
  // }, [selectedDevice, getParameters])

  // useEffect(() => {
  //   if (parametersData) {
  //     setAvailableParameters(parametersData.sdType.parameters)
  //   }
  // }, [parametersData])

  // const [getSampleData, { data: sampleData, error }] = useLazyQuery(GET_SAMPLEDATA)

  // useEffect(() => {
  //   if (selectedParameter) {
  //     getSampleData({
  //       variables: {
  //         sensors: {
  //           sensors: [
  //             {
  //               key: selectedDevice?.uid,
  //               values: [selectedParameter?.denotation]
  //             }
  //           ]
  //         },
  //         request: {
  //           from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  //           aggregateMinutes: '30',
  //           operation: 'last'
  //         }
  //       }
  //     })
  //   }
  // }, [selectedParameter, selectedDevice, getSampleData])

  // useEffect(() => {
  //   if (sampleData) {
  //     setProcessedData(
  //       sampleData.statisticsQuerySensorsWithFields.map((item: any) => {
  //         const parsedData = JSON.parse(item.data)
  //         const { host, ...rest } = parsedData
  //         return {
  //           x: item.time,
  //           y: rest[selectedParameter?.denotation!]
  //         }
  //       })
  //     )
  //     console.log('Processed data', sampleData.statisticsQuerySensorsWithFields)
  //   }
  //   if (error) {
  //     console.error('Error fetching sample data', error)
  //   }
  // }, [sampleData, error])

  const handleVisualizationSelect = (visualization: 'line' | 'switch' | 'table' | 'bullet' | 'entitycard') => {
    setSelectedVisualization(visualization)
  }

  const handleAddItem = (details: string) => {
    const item: GridItem = {
      visualization: selectedVisualization!,
      visualizationConfig: details
    }
    onAddItem(item)
    setDialogOpen(false)
  }

  return (
    <div className="sm:space-y-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="visualization">Visualization</TabsTrigger>
          <TabsTrigger value="builder" disabled={!selectedVisualization}>
            Builder
          </TabsTrigger>
        </TabsList>
        <TabsContent value="visualization" className="w-full">
          <VisualizationGallery selectedVisualization={selectedVisualization} setSelectedVisualization={handleVisualizationSelect} />
          <div className="flex justify-end mt-4">
            <Button onClick={() => setActiveTab('builder')} disabled={!selectedVisualization}>
              Next
              <FaArrowRight className="ml-2" />
            </Button>
          </div>
        </TabsContent>
        <TabsContent value="builder">
          {selectedVisualization && (
            <VisualizationBuilder
              selectedVisualization={selectedVisualization}
              setVisualizationConfig={handleAddItem}
              setActiveTab={setActiveTab}
              instances={data?.sdInstances || []}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

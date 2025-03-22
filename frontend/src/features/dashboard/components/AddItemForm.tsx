import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useQuery } from '@apollo/client'
import { GET_INSTANCES } from '@/graphql/Queries'
import type { SdInstance } from '@/../../src/generated/graphql'
import { VisualizationGallery } from './visualizationExamples/VisualizationGallery'
import { VisualizationBuilder } from './VisualizationBuilder'
import { BuilderResult, GridItem, AllConfigTypes } from '@/types/GridItem'
import { Button } from '@/components/ui/button'
import { FaArrowRight } from 'react-icons/fa6'

export interface AddItemFormProps {
  setDialogOpen: (open: boolean) => void
  onAddItem<ConfigType extends AllConfigTypes>(item: GridItem<ConfigType>) : void
}

export function AddItemForm({ setDialogOpen, onAddItem }: AddItemFormProps) {
  const { data } = useQuery<{ sdInstances: SdInstance[] }>(GET_INSTANCES)
  const [selectedVisualization, setSelectedVisualization] = useState<'line' | 'switch' | 'table' | 'bullet' | 'entitycard' | null>(null)
  const [activeTab, setActiveTab] = useState('visualization')

  const handleVisualizationSelect = (visualization: 'line' | 'switch' | 'table' | 'bullet' | 'entitycard') => {
    setSelectedVisualization(visualization)
  }

  function handleAddItem<ConfigType extends AllConfigTypes>(config: BuilderResult<ConfigType>)  {
    const item: GridItem<ConfigType> = {
      visualization: selectedVisualization!,
      visualizationConfig: config
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
            <VisualizationBuilder selectedVisualization={selectedVisualization} setVisualizationConfig={handleAddItem} setActiveTab={setActiveTab} instances={data?.sdInstances || []} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

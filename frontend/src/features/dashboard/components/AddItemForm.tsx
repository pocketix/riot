import { useEffect, useMemo, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { VisualizationGallery } from './visualizationExamples/VisualizationGallery'
import { VisualizationBuilder } from './VisualizationBuilder'
import { BuilderResult, GridItem, AllConfigTypes, VisualizationTypes } from '@/types/dashboard/gridItem'
import { Button } from '@/components/ui/button'
import { FaArrowRight } from 'react-icons/fa6'
import { DBItemDetails, Tab } from '@/schemas/dashboard/DashboardSchema'
import { Accordion, AccordionItem, AccordionContent, AccordionTrigger } from '@/components/ui/accordion'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { getCustomizableIcon } from '@/utils/getCustomizableIcon'
import { ResponsiveTooltip } from '@/components/responsive-tooltip'
import { InfoIcon } from 'lucide-react'
import { useDebounce } from 'use-debounce'
import { Layout } from 'react-grid-layout'
import { ResponsiveAlertDialog } from './cards/components/ResponsiveAlertDialog'
import { useSwipeable } from 'react-swipeable'

export interface AddItemFormProps {
  setDialogOpen: (open: boolean) => void
  onAddItem<ConfigType extends AllConfigTypes>(item: GridItem<ConfigType>): void
  tabs: Tab[]
  activeTabID: number
  currentBreakpoint: string
}
export function AddItemForm(props: AddItemFormProps) {
  const [selectedVisualization, setSelectedVisualization] = useState<VisualizationTypes | null>(null)
  const [activeTab, setActiveTab] = useState('visualization')
  const [openAccordions, setOpenAccordions] = useState<string[]>([])
  const [openNestedAccordions, setOpenNestedAccordions] = useState<Record<number, string[]>>({})
  const [selectedConfig, setSelectedConfig] = useState<{
    config: DBItemDetails['visualizationConfig']
    layoutID: string
  } | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [search] = useDebounce(searchInput, 300)
  const [showLeavingAlert, setShowLeavingAlert] = useState(false)

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (activeTab === 'visualization' && selectedVisualization) {
        setActiveTab('builder')
      }
    },
    onSwipedRight: () => {
      if (activeTab === 'builder') {
        setShowLeavingAlert(true)
      }
    },
    swipeDuration: 300,
    delta: 80
  })

  const handleVisualizationSelect = (visualization: VisualizationTypes) => {
    // if the visualization is already selected, proceed to the builder
    // fixes testing issue with the next button not always being visible
    if (visualization === selectedVisualization) {
      setActiveTab('builder')
      return
    }
    setSelectedVisualization(visualization)
    if (selectedConfig) {
      setSelectedConfig(null)
    }
  }

  function handleVisualizationCardSelect(detail: DBItemDetails, layoutIndex: string) {
    setSelectedVisualization(detail.visualization)
    setSelectedConfig({ config: detail.visualizationConfig, layoutID: layoutIndex })
  }

  const currentTab = useMemo(() => {
    return props.tabs?.find((tab) => tab.id === props.activeTabID)
  }, [props.activeTabID, props.tabs])

  function groupVisualizationsByBreakpoints(
    layoutsByBreakpoint: Record<string, Layout[]>,
    details: Record<string, DBItemDetails>,
    tab?: Tab
  ) {
    const breakpointToReadableName: Record<string, string> = {
      lg: 'Laptop',
      md: 'Tablet',
      sm: 'Small Tablet',
      xs: 'Large Phone',
      xxs: 'Phone'
    }

    const grouped: Record<string, { detail: DBItemDetails; layoutI: string; breakpoints: string[]; tab?: Tab }> = {}
    for (const [breakpoint, layouts] of Object.entries(layoutsByBreakpoint)) {
      for (const layout of layouts) {
        const layoutI = layout.i
        const detail = details[layoutI]
        if (!detail) continue
        if (!grouped[layoutI]) {
          grouped[layoutI] = {
            detail,
            layoutI,
            breakpoints: [breakpointToReadableName[breakpoint] || breakpoint],
            tab
          }
        } else {
          if (!grouped[layoutI].breakpoints.includes(breakpoint)) {
            grouped[layoutI].breakpoints.push(breakpointToReadableName[breakpoint] || breakpoint)
          }
        }
      }
    }
    return Object.values(grouped)
  }

  const groupedCurrentTabVisualizations = useMemo(() => {
    if (!currentTab) return []
    const currentLayoutIndexes = new Set(
      (currentTab.layout[props.currentBreakpoint] || []).map((layout: Layout) => layout.i)
    )

    const otherLayouts: Record<string, Layout[]> = {}
    for (const [breakpoint, layouts] of Object.entries(currentTab.layout)) {
      if (breakpoint === props.currentBreakpoint) continue
      otherLayouts[breakpoint] = layouts.filter((layout: Layout) => !currentLayoutIndexes.has(layout.i))
    }

    return groupVisualizationsByBreakpoints(otherLayouts, currentTab.details)
  }, [currentTab, props.currentBreakpoint])

  const groupedOtherTabsVisualizations = useMemo(() => {
    if (!props.tabs) return []

    return props.tabs
      .filter((tab) => tab.id !== props.activeTabID)
      .map((tab) => ({
        tab,
        visualizations: groupVisualizationsByBreakpoints(tab.layout, tab.details, tab)
      }))
      .filter((group) => group.visualizations.length > 0)
  }, [props.tabs, props.activeTabID])

  function renderVisualizationSummaryCard(detail: DBItemDetails, layoutIndex: string, breakpoints?: string[]) {
    if (!detail) return null

    const title = detail.visualizationConfig.title! || 'Untitled'
    const visualizationType = detail.visualization

    const visualizationToReadableName: Record<string, string> = {
      line: 'Line Chart',
      switch: 'Switch Card',
      table: 'Table Card',
      bullet: 'Bullet Chart',
      entitycard: 'Entity Card',
      seqstates: 'Sequential States'
    }

    const IconComponent = getCustomizableIcon(detail.visualizationConfig.icon!)

    return (
      <Card
        key={layoutIndex}
        className={cn(
          'mb-2 cursor-pointer p-2',
          selectedConfig?.config === detail.visualizationConfig ? 'border-2 border-blue-500' : 'border-2'
        )}
        onClick={() => handleVisualizationCardSelect(detail, layoutIndex)}
      >
        <div className="flex items-center gap-1 font-semibold">
          {IconComponent && <IconComponent className="h-4 w-4" />}
          {title}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          <b>Visualization:</b> {visualizationToReadableName[visualizationType]}
        </div>
        {breakpoints && breakpoints.length > 0 && (
          <div className="mt-1 text-xs text-muted-foreground">
            <b>Screen size:</b> {breakpoints.join(', ')}
          </div>
        )}
      </Card>
    )
  }

  function handleAddItem<ConfigType extends AllConfigTypes>(config: BuilderResult<ConfigType>) {
    const item: GridItem<ConfigType> = {
      ...(selectedConfig?.layoutID ? { layoutID: selectedConfig.layoutID } : {}),
      visualization: selectedVisualization!,
      visualizationConfig: config
    }
    props.onAddItem(item)
    props.setDialogOpen(false)
  }

  function findSearch(titleToFind: string) {
    if (!search.trim()) return true

    const title = titleToFind
    return title.toLowerCase().includes(search.trim().toLowerCase())
  }

  const filteredGroupedCurrentTabVisualizations: {
    detail: DBItemDetails
    layoutI: string
    breakpoints: string[]
  }[] = useMemo(() => {
    return groupedCurrentTabVisualizations.filter(({ detail }) => findSearch(detail.visualizationConfig.title!))
  }, [groupedCurrentTabVisualizations, search])

  const filteredGroupedOtherTabsVisualizations = useMemo(() => {
    return groupedOtherTabsVisualizations
      .map(({ tab, visualizations }) => ({
        tab,
        visualizations: visualizations.filter(({ detail }) => findSearch(detail.visualizationConfig.title!))
      }))
      .filter(({ visualizations }) => visualizations.length > 0) // only display tabs with some visualizations
  }, [groupedOtherTabsVisualizations, search])

  useEffect(() => {
    // Automatic accordion opening based on search results
    const open: string[] = []
    const nested: Record<string, string[]> = {}

    if (search.trim()) {
      if (filteredGroupedCurrentTabVisualizations.length > 0) open.push('other-breakpoints')
      if (filteredGroupedOtherTabsVisualizations.length > 0) {
        open.push('other-tabs')
        filteredGroupedOtherTabsVisualizations.forEach(({ tab, visualizations }) => {
          if (visualizations.length > 0) {
            nested[tab.id] = [`tab-${tab.id}`]
          }
        })
      }
    }
    setOpenAccordions(open)
    setOpenNestedAccordions(nested)
  }, [search, filteredGroupedCurrentTabVisualizations, filteredGroupedOtherTabsVisualizations])

  const handleNestedAccordionChange = (tabId: number, values: string[]) => {
    setOpenNestedAccordions((prev) => ({
      ...prev,
      [tabId]: values
    }))
  }

  return (
    <div className="sm:space-y-8" {...swipeHandlers}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="visualization">Visualization</TabsTrigger>
          <TabsTrigger value="builder" disabled={!selectedVisualization}>
            Builder
          </TabsTrigger>
        </TabsList>
        <TabsContent value="visualization" className="w-full">
          <VisualizationGallery
            selectedVisualization={selectedVisualization}
            setSelectedVisualization={handleVisualizationSelect}
          />
          <Separator orientation="horizontal" className="my-4" />
          <div className="my-2">
            <div className="inline-flex items-center gap-1">
              <h2 className="text-lg font-semibold">Search existing visualizations</h2>
              <ResponsiveTooltip
                content={
                  <div className="mt-2 text-center">
                    <p className="font-semibold">Searching is based on the card title</p>
                    <p className="text-sm text-muted-foreground">
                      Edditing an existing visualization will result in a global change.
                    </p>
                    <p className="text-sm text-muted-foreground">Screen sizes correspond to the device screen width.</p>
                    <p className="text-sm text-muted-foreground">
                      For example, a screen size of "Large" usually refers to laptops, and "Medium" to tablets.
                    </p>
                  </div>
                }
              >
                <InfoIcon className="h-4 w-4 text-muted-foreground" />
              </ResponsiveTooltip>
            </div>
            <Input
              type="text"
              placeholder="Search visualizations by title..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full rounded border px-3 py-2"
            />
          </div>
          <Accordion type="multiple" className="mt-4" value={openAccordions} onValueChange={setOpenAccordions}>
            {filteredGroupedCurrentTabVisualizations.length > 0 && (
              <AccordionItem value="other-breakpoints">
                <AccordionTrigger>Visualizations in other screen sizes</AccordionTrigger>
                <AccordionContent>
                  {filteredGroupedCurrentTabVisualizations.map(({ detail, layoutI, breakpoints }) => (
                    <div key={layoutI} className="mb-2">
                      {renderVisualizationSummaryCard(detail, layoutI, breakpoints)}
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            )}
            <AccordionItem value="other-tabs">
              <AccordionTrigger>Visualizations in other tabs</AccordionTrigger>
              <AccordionContent>
                <Card>
                  {filteredGroupedOtherTabsVisualizations.map(({ tab, visualizations }) => (
                    <Accordion
                      type="multiple"
                      key={tab.id}
                      className="mb-2 px-2"
                      value={openNestedAccordions[tab.id] || []}
                      onValueChange={(values) =>
                        handleNestedAccordionChange(tab.id, typeof values === 'string' ? [values] : values)
                      }
                    >
                      <AccordionItem value={`tab-${tab.id}`}>
                        <AccordionTrigger>
                          <div className="flex items-center gap-1">
                            {tab.icon &&
                              (() => {
                                const Icon = getCustomizableIcon(tab.icon)
                                return Icon ? <Icon className="h-4 w-4" /> : null
                              })()}
                            <b>{tab.userIdentifier}</b>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          {visualizations.map(({ detail, layoutI, breakpoints }) =>
                            renderVisualizationSummaryCard(detail, layoutI, breakpoints)
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  ))}
                </Card>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <div className="mt-4 flex justify-end">
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
              config={selectedConfig?.config}
            />
          )}
        </TabsContent>
      </Tabs>
      <div className="absolute">
        <ResponsiveAlertDialog
          onSuccess={() => {
            setActiveTab('visualization')
            setSelectedVisualization(null)
            setSelectedConfig(null)
          }}
          externalOpen={showLeavingAlert}
          onExternalOpenChange={setShowLeavingAlert}
          content={
            <p className="text-center font-semibold text-destructive">
              Going back will discard any changes made in the builder.
            </p>
          }
        >
          <div />
        </ResponsiveAlertDialog>
      </div>
    </div>
  )
}

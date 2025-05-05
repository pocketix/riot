// Necessary for the react-grid-layout library
import '@/../node_modules/react-grid-layout/css/styles.css'
import '@/../node_modules/react-resizable/css/styles.css'

import { Responsive, Layout, WidthProvider } from 'react-grid-layout'
import { useMemo, useState, useLayoutEffect, useCallback } from 'react'
import { DashboardRoot, Navbar, MainGrid } from '@/styles/dashboard/DashboardGlobal'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@mui/material'
import { AddItemModal } from './components/AddItemModal'
import { RestoreLayoutDialog } from './components/RestoreLayoutDialog'
import { DashboardGroupCardsController } from './components/groups/DashboardGroupCardsController'
import { InView } from 'react-intersection-observer'
import { AllConfigTypes, BuilderResult, GridItem } from '@/types/dashboard/gridItem'
import { MyHandle } from './components/cards/components/DragHandle'
import { Instance } from '@/context/InstancesContext'
import { toast } from 'sonner'
import { useDebounce } from 'use-debounce'
import { FaPlus } from 'react-icons/fa'
import { BulletCardController } from './components/cards/BulletCardController'
import { ChartCardController } from './components/cards/ChartCardController'
import { TableCardController } from './components/cards/TableCardController'
import { EntityCardController } from './components/cards/EntityCardController'
import { DBItemDetails, Tab } from '@/schemas/dashboard/DashboardSchema'
import { AddTabFormSchemaType } from '@/schemas/dashboard/AddTabSchema'
import { ResponsiveTabs } from './components/ResponsiveTabs'
import { useSwipeable } from 'react-swipeable'
import { SwitchCardController } from './components/cards/SwitchCardController'
import { SequentialStatesCardController } from './components/cards/SequentialStatesCardController'

interface DashboardViewProps {
  layouts: { [key: string]: Layout[] }
  details: { [key: string]: DBItemDetails }
  instances: Instance[]
  mounted: boolean
  cols: { lg: number; md: number; xs: number; xxs: number }
  rowHeight: number
  highlightedCardIDInitial?: string | null
  editMode: boolean
  setEditMode: (editMode: boolean) => void
  onLayoutChange: (layout: Layout[], layouts: { [key: string]: Layout[] }, currentBreakpoint: string) => void
  onDeleteItem: (id: string, breakpoint: string) => void
  onRestoreAllTabs: (savedTabsState: Tab[]) => boolean
  onAddItem: <ConfigType extends AllConfigTypes>(item: GridItem<ConfigType>, currentBreakpoint: string) => void
  onSaveConfig: <ConfigType extends AllConfigTypes>(
    builderResult: BuilderResult<ConfigType>,
    dbItemDetails: DBItemDetails,
    detailsIndex: string
  ) => void

  // TABS
  tabs: Tab[]
  activeTabId: number
  onAddTab: (values: AddTabFormSchemaType) => void
  onChangeTab: (tabId: number) => void
  onDeleteTab: (tabId: number) => void
  onEditTab: (tabId: number, values: AddTabFormSchemaType) => void
  getNextTabId: () => number
  getPreviousTabId: () => number
}

const DashboardView = (props: DashboardViewProps) => {
  const ResponsiveGridLayout = useMemo(() => WidthProvider(Responsive), [])
  const [resizeCardID, setResizeCardID] = useState<string | null>(null)
  const [currentBreakpoint, setCurrentBreakpoint] = useState('lg')
  const [width, setWidth] = useState<number>(0)
  const [highlightedCardID, setHighlightedCardID] = useState<string | null>(props.highlightedCardIDInitial || null)
  const [savedTabsState, setSavedTabsState] = useState<Tab[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)

  const handleBreakpointChanged = (breakpoint: string) => {
    setCurrentBreakpoint(breakpoint)
  }

  const handleResizeStart = (_layouts: Layout[], _layout: Layout, newItem: Layout) => {
    setResizeCardID(newItem.i)
  }

  const handleResizeStop = () => {
    setResizeCardID(null)
  }

  const handleSetEditMode = () => {
    if (!props.editMode) {
      setSavedTabsState([...props.tabs])
      props.setEditMode(!props.editMode)
      toast.info('Your current dashboard settings have been saved.')
    } else {
      toast.success('You have exited the edit mode.')
    }

    const newEditMode = !props.editMode
    props.setEditMode(newEditMode)
    setHighlightedCardID(null)
  }

  const handleAddItem = (item: GridItem<AllConfigTypes>) => {
    props.onAddItem(item, currentBreakpoint)
  }

  const handleRestoreLayout = () => {
    toast.loading('Restoring dashboard...', { id: 'restore-dashboard' })
    const result = props.onRestoreAllTabs(savedTabsState)
    if (result) {
      toast.success('Dashboard restored successfully.', { id: 'restore-dashboard' })
    } else {
      toast.error('Failed to restore dashboard.', { id: 'restore-dashboard' })
    }
  }

  const calculateWidth = useCallback((item: Layout) => {
    const itemRef = document.getElementById(item.i)
    if (itemRef) {
      const { width } = itemRef.getBoundingClientRect()
      const newWidth = width / item.w
      setWidth(newWidth)
    }
  }, [])

  const [debouncedCalculateWidth] = useDebounce(calculateWidth, 200)

  // Fetches the initial width just before the component mounts
  // then updates upon resizing the window/layout
  useLayoutEffect(() => {
    if (!props.mounted || !props.layouts || !props.layouts[currentBreakpoint]?.length) return

    const getWidth = () => {
      const item = props.layouts[currentBreakpoint][0]
      if (item) {
        debouncedCalculateWidth(item)
      }
    }

    if (props.layouts[currentBreakpoint][0]) {
      const item = props.layouts[currentBreakpoint][0]
      const itemRef = document.getElementById(item.i)
      if (itemRef) {
        const { width } = itemRef.getBoundingClientRect()
        const newWidth = width / item.w
        setWidth(newWidth)
      }
    }

    const observer = new ResizeObserver(getWidth)

    const layoutContainer = document.querySelector('.layout')
    if (layoutContainer) {
      observer.observe(layoutContainer)
    }

    window.addEventListener('resize', getWidth)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', getWidth)
    }
  }, [props.mounted, currentBreakpoint, props.layouts, debouncedCalculateWidth])

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (props.tabs.length > 1) {
        props.onChangeTab(props.getNextTabId())
      }
    },
    onSwipedRight: () => {
      if (props.tabs.length > 1) {
        props.onChangeTab(props.getPreviousTabId())
      }
    },
    // TODO: maybe adjust?
    swipeDuration: 500,
    delta: 80
  })

  if (!props.mounted || !props.layouts || !props.details || !props.instances || !ResponsiveGridLayout) {
    return (
      <div className="grid grid-cols-2 gap-4 overflow-hidden p-4">
        <Skeleton variant="rounded" width={'100%'} height={200} />
        <Skeleton variant="rounded" width={'100%'} height={200} />
        <Skeleton variant="rounded" width={'100%'} height={200} className="col-span-2" />
        <Skeleton variant="rounded" width={'100%'} height={200} />
        <Skeleton variant="rounded" width={'100%'} height={200} />
        <Skeleton variant="rounded" width={'100%'} height={200} className="col-span-2" />
        <Skeleton variant="rounded" width={'100%'} height={200} />
        <Skeleton variant="rounded" width={'100%'} height={200} />
      </div>
    )
  }

  return (
    <DashboardRoot>
      <Navbar>
        <h3 className="text-primary">Dashboard</h3>
        <div className="flex gap-2">
          {props.editMode && <RestoreLayoutDialog onSuccess={handleRestoreLayout} />}
          <Button onClick={handleSetEditMode} variant={'default'}>
            {props.editMode ? 'End' : 'Edit'}
          </Button>
        </div>
      </Navbar>
      <MainGrid>
        <DashboardGroupCardsController />
        <ResponsiveTabs
          tabs={props.tabs}
          activeTabId={props.activeTabId}
          onChangeTab={props.onChangeTab}
          onDeleteTab={props.onDeleteTab}
          onEditTab={props.onEditTab}
          onAddTab={props.onAddTab}
          editMode={props.editMode}
        />
        <div {...swipeHandlers} className="min-h-[80vh] w-full overflow-hidden pb-10">
          {!props.layouts || props.layouts[currentBreakpoint]?.length === 0 || !props.layouts[currentBreakpoint] ? (
            <Card className="mx-auto my-auto flex h-full w-2/3 flex-col items-center justify-center gap-2 self-center rounded-lg border border-dashed border-gray-300 p-4 text-center">
              <div className="rounded-full bg-gray-100 p-4 shadow-lg">
                <FaPlus className="h-8 w-8 text-black" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Your dashboard in this tab is empty</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Click the <b>plus button</b> in the bottom-right corner or the button below to add your first item.
                </p>
              </div>
              <Button onClick={() => setShowAddDialog(true)} variant="outline" className="mt-2">
                Add an item
              </Button>
            </Card>
          ) : (
            <ResponsiveGridLayout
              key={currentBreakpoint}
              className="layout"
              layouts={props.layouts}
              onLayoutChange={(currentLayout, allLayouts) =>
                props.onLayoutChange(currentLayout, allLayouts, currentBreakpoint)
              }
              onBreakpointChange={handleBreakpointChanged}
              breakpoints={{ lg: 1200, md: 996, xs: 480, xxs: 0 }}
              cols={props.cols}
              draggableHandle=".drag-handle"
              rowHeight={props.rowHeight}
              isDraggable={props.editMode}
              isResizable={props.editMode}
              isDroppable={props.editMode}
              onResizeStart={handleResizeStart}
              onResizeStop={handleResizeStop}
              useCSSTransforms={false}
              containerPadding={[10, 0]}
              compactType={'vertical'}
              verticalCompact={true}
              resizeHandle={<MyHandle $editMode={props.editMode} />}
            >
              {props.layouts[currentBreakpoint]?.map((item: Layout) => {
                const itemId = item.i
                const detail = props.details ? props.details[itemId] : undefined

                if (!detail) return null

                const cardProps = {
                  id: itemId,
                  className: highlightedCardID === itemId ? 'z-10' : ''
                }

                const visualizationProps = {
                  cardID: itemId,
                  layout: props.layouts[currentBreakpoint],
                  setLayout: (newLayout: Layout[]) => {
                    const updatedLayouts = {
                      ...props.layouts,
                      [currentBreakpoint]: newLayout
                    }
                    props.onLayoutChange(newLayout, updatedLayouts, currentBreakpoint)
                  },
                  editModeEnabled: props.editMode,
                  breakPoint: currentBreakpoint,
                  cols: props.cols,
                  handleDeleteItem: props.onDeleteItem,
                  height: props.rowHeight,
                  width,
                  setHighlightedCardID,
                  configuration: props.details[itemId],
                  beingResized: resizeCardID === itemId,
                  handleSaveEdit: (config: BuilderResult<AllConfigTypes>) =>
                    props.onSaveConfig(config, props.details[itemId], itemId)
                }

                const renderVisualization = () => {
                  switch (detail.visualization) {
                    case 'table':
                      return (
                        <InView threshold={0} triggerOnce={true} rootMargin="100px" className="h-full w-full">
                          {({ inView, ref }) => (
                            <div ref={ref} className="h-full w-full">
                              <TableCardController {...visualizationProps} isVisible={inView} />
                            </div>
                          )}
                        </InView>
                      )
                    case 'bullet':
                      return (
                        <InView threshold={0} triggerOnce={true} rootMargin="100px" className="h-full w-full">
                          {({ inView, ref }) => (
                            <div ref={ref} className="h-full w-full">
                              <BulletCardController {...visualizationProps} isVisible={inView} />
                            </div>
                          )}
                        </InView>
                      )
                    case 'line':
                      return (
                        <InView threshold={0} triggerOnce={true} rootMargin="100px" className="h-full w-full">
                          {({ inView, ref }) => (
                            <div ref={ref} className="h-full w-full">
                              <ChartCardController {...visualizationProps} isVisible={inView} />
                            </div>
                          )}
                        </InView>
                      )
                    case 'entitycard':
                      return (
                        <InView threshold={0} triggerOnce={true} rootMargin="100px" className="h-full w-full">
                          {({ inView, ref }) => (
                            <div ref={ref} className="h-full w-full">
                              <EntityCardController {...visualizationProps} isVisible={inView} />
                            </div>
                          )}
                        </InView>
                      )
                    case 'switch':
                      return (
                        <InView threshold={0} triggerOnce={true} rootMargin="100px" className="h-full w-full">
                          {({ inView, ref }) => (
                            <div ref={ref} className="h-full w-full">
                              <SwitchCardController {...visualizationProps} isVisible={inView} />
                            </div>
                          )}
                        </InView>
                      )
                    case 'seqstates':
                      return (
                        <InView threshold={0} triggerOnce={true} rootMargin="100px" className="h-full w-full">
                          {({ inView, ref }) => (
                            <div ref={ref} className="h-full w-full">
                              <SequentialStatesCardController {...visualizationProps} isVisible={inView} />
                            </div>
                          )}
                        </InView>
                      )
                    default:
                      return null
                  }
                }

                return (
                  <Card key={itemId} {...cardProps}>
                    {renderVisualization()}
                  </Card>
                )
              })}
            </ResponsiveGridLayout>
          )}
        </div>
      </MainGrid>
      <AddItemModal
        onAddItem={handleAddItem}
        triggerOpen={showAddDialog}
        onDialogOpenChange={(isOpen) => setShowAddDialog(isOpen)}
        tabs={props.tabs}
        activeTabID={props.activeTabId}
        currentBreakpoint={currentBreakpoint}
      />
    </DashboardRoot>
  )
}

export default DashboardView

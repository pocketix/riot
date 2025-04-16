// Necessary for the react-grid-layout library
import '@/../node_modules/react-grid-layout/css/styles.css'
import '@/../node_modules/react-resizable/css/styles.css'

import { Responsive, Layout, WidthProvider, Layouts } from 'react-grid-layout'
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
import { DBItemDetails } from '@/types/dashboard/dbItem'
import { MyHandle } from './components/cards/components/DragHandle'
import { Instance } from '@/context/InstancesContext'
import { toast } from 'sonner'
import { useDebounce } from 'use-debounce'
import { FaPlus } from 'react-icons/fa'
import { BulletCardController } from './components/cards/BulletCardController'
import { ChartCardController } from './components/cards/ChartCardController'
import { TableCardController } from './components/cards/TableCardController'
import { EntityCardController } from './components/cards/EntityCardController'

interface DashboardViewProps {
  layouts: { [key: string]: Layout[] }
  details: { [key: string]: DBItemDetails<AllConfigTypes> }
  instances: Instance[]
  mounted: boolean
  cols: { lg: number; md: number; sm: number; xs: number; xxs: number }
  rowHeight: number
  highlightedCardIDInitial?: string | null
  onLayoutChange: (layout: Layout[], layouts: { [key: string]: Layout[] }) => void
  onDeleteItem: (id: string) => void
  onRestoreLayout: (layouts: Layouts) => boolean
  onAddItem: <ConfigType extends AllConfigTypes>(item: GridItem<ConfigType>) => void
  onSaveConfig: <ConfigType extends AllConfigTypes>(
    config: BuilderResult<ConfigType>,
    dbItemDetails: DBItemDetails<ConfigType>
  ) => void
}

const DashboardView = (props: DashboardViewProps) => {
  const ResponsiveGridLayout = useMemo(() => WidthProvider(Responsive), [])
  const [resizeCardID, setResizeCardID] = useState<string | null>(null)
  const [currentBreakpoint, setCurrentBreakpoint] = useState('lg')
  const [width, setWidth] = useState<number>(0)
  const [editMode, setEditMode] = useState<boolean>(false)
  const [highlightedCardID, setHighlightedCardID] = useState<string | null>(props.highlightedCardIDInitial || null)
  const [savedLayout, setSavedLayout] = useState<Layouts>({})
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
    if (!editMode) {
      setSavedLayout(props.layouts)
      toast.info('You are now in edit mode. Your current layout has been saved.')
    } else {
      toast.success('You have exited edit mode.')
    }

    const newEditMode = !editMode
    setEditMode(newEditMode)
    setHighlightedCardID(null)
  }

  const handleRestoreLayout = () => {
    const result = props.onRestoreLayout(savedLayout)
    if (result) {
      toast.success('Layout restored successfully.')
    } else {
      toast.error('Failed to restore layout.')
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
          {editMode && <RestoreLayoutDialog onSuccess={handleRestoreLayout} />}
          <Button onClick={handleSetEditMode} variant={'default'}>
            {editMode ? 'End' : 'Edit'}
          </Button>
        </div>
      </Navbar>
      <MainGrid>
        <DashboardGroupCardsController />
        {!props.layouts || props.layouts[currentBreakpoint]?.length === 0 || !props.layouts[currentBreakpoint] ? (
          <Card className="mx-auto my-auto flex h-full w-2/3 flex-col items-center justify-center gap-2 self-center rounded-lg border border-dashed border-gray-300 p-4 text-center">
            <div className="rounded-full bg-gray-100 p-4 shadow-lg">
              <FaPlus className="h-8 w-8 text-black" />
            </div>
            <div>
              <h3 className="text-lg font-medium">Your dashboard is empty</h3>
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
            className="layout"
            layouts={props.layouts}
            onBreakpointChange={handleBreakpointChanged}
            breakpoints={{ lg: 1200, md: 996, xs: 480, xxs: 0 }}
            cols={props.cols}
            draggableHandle=".drag-handle"
            rowHeight={props.rowHeight}
            isDraggable={editMode}
            isResizable={editMode}
            isDroppable={editMode}
            onResizeStart={handleResizeStart}
            onResizeStop={handleResizeStop}
            useCSSTransforms={false}
            containerPadding={[10, 10]}
            compactType={'vertical'}
            verticalCompact={true}
            resizeHandle={<MyHandle $editMode={editMode} />}
            onLayoutChange={props.onLayoutChange}
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
                  props.onLayoutChange(newLayout, updatedLayouts)
                },
                editModeEnabled: editMode,
                breakPoint: currentBreakpoint,
                cols: props.cols,
                handleDeleteItem: props.onDeleteItem,
                height: props.rowHeight,
                width,
                setHighlightedCardID,
                configuration: props.details[itemId],
                beingResized: resizeCardID === itemId,
                handleSaveEdit: (config: BuilderResult<AllConfigTypes>) =>
                  props.onSaveConfig(config, props.details[itemId])
              }

              const renderVisualization = () => {
                switch (detail.visualization) {
                  case 'table':
                    return (
                      <InView threshold={0} triggerOnce={true} rootMargin="100px" className="h-full w-full">
                        {({ inView, ref }) => (
                          <div ref={ref} className="h-full w-full">
                            <TableCardController key={itemId} {...visualizationProps} isVisible={inView} />
                          </div>
                        )}
                      </InView>
                    )
                  case 'bullet':
                    return (
                      <InView threshold={0} triggerOnce={true} rootMargin="100px" className="h-full w-full">
                        {({ inView, ref }) => (
                          <div ref={ref} className="h-full w-full">
                            <BulletCardController key={itemId} {...visualizationProps} isVisible={inView} />
                          </div>
                        )}
                      </InView>
                    )
                  case 'line':
                    return (
                      <InView threshold={0} triggerOnce={true} rootMargin="100px" className="h-full w-full">
                        {({ inView, ref }) => (
                          <div ref={ref} className="h-full w-full">
                            <ChartCardController key={itemId} {...visualizationProps} isVisible={inView} />
                          </div>
                        )}
                      </InView>
                    )
                  case 'entitycard':
                    return (
                      <InView threshold={0} triggerOnce={true} rootMargin="100px" className="h-full w-full">
                        {({ inView, ref }) => (
                          <div ref={ref} className="h-full w-full">
                            <EntityCardController key={itemId} {...visualizationProps} isVisible={inView} />
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
      </MainGrid>
      <AddItemModal
        onAddItem={props.onAddItem}
        triggerOpen={showAddDialog}
        onDialogOpenChange={(isOpen) => setShowAddDialog(isOpen)}
      />
    </DashboardRoot>
  )
}

export default DashboardView

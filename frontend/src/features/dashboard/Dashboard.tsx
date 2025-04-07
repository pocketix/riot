// Imports necessary for the react-grid-layout library
import '@/../node_modules/react-grid-layout/css/styles.css'
import '@/../node_modules/react-resizable/css/styles.css'

import { WidthProvider, Responsive, Layouts, Layout } from 'react-grid-layout'
import { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import { DashboardRoot, Navbar, MainGrid } from '@/styles/dashboard/DashboardGlobal'
import { Button } from '@/components/ui/button'
import { ChartCard } from './components/cards/ChartCard'
import { AddItemModal } from './components/AddItemModal'
import { BulletCard } from './components/cards/BulletCard'
import { toast } from 'sonner'
import { RestoreLayoutDialog } from './components/RestoreLayoutDialog'
import { TableCard } from './components/cards/TableCard'
import { Card } from '@/components/ui/card'
import { MyHandle } from './components/cards/components/DragHandle'
import { utils } from 'react-grid-layout'
import { EntityCard } from './components/cards/EntityCard'
import { AllConfigTypes, GridItem, BuilderResult } from '@/types/dashboard/GridItem'
import { DBItemDetails } from '@/types/dashboard/DBItem'
import _ from 'lodash'
import {
  useSdInstancesWithTypeAndSnapshotQuery,
  useUpdateUserConfigMutation,
  useUserConfigQuery
} from '@/generated/graphql'
import { RiotDashboardConfig } from '@/types/dashboard/dashboard'
import { Skeleton } from '@mui/material'
import { DashboardGroupCardsController } from './components/groups/DashboardGroupCardsController'

const Dashboard = () => {
  const ResponsiveGridLayout = useMemo(() => WidthProvider(Responsive), [])
  const userID = 1 // TODO: This will get replaced by user context
  const [updateUserConfig, { data: saveConfigData, loading: saveConfigLoading, error: saveConfigError }] =
    useUpdateUserConfigMutation()
  const {
    data: fetchedConfigData,
    loading: fetchedConfigLoading,
    error: fetchedConfigError
  } = useUserConfigQuery({
    variables: {
      userConfigId: userID
    },
    skip: !userID
  })

  const rowHeight: number = 100
  const [editMode, setEditMode] = useState<boolean>(false)
  const [isMobileView, setIsMobileView] = useState(false)
  const scrollRef = useRef<'up' | 'down' | null>(null)
  const scrollAnimationFrame = useRef<number | null>(null)
  const scrollSpeedMultiplier = useRef(1)
  const [mounted, setMounted] = useState<boolean>(false) // TODO: Problem kvoli scroll baru..
  const [width, setWidth] = useState<number>(0)
  const [highlightedCardID, setHighlightedCardID] = useState<string | null>(null)
  const [savedLayout, setSavedLayout] = useState<Layouts>()
  const [resizeCardID, setResizeCardID] = useState<string | null>(null)

  const [layouts, setLayouts] = useState<{ [key: string]: Layout[] }>()
  const [details, setDetails] = useState<{ [key: string]: DBItemDetails<AllConfigTypes> }>({})
  const [currentBreakpoint, setCurrentBreakpoint] = useState('lg')
  const loadingToastRef = useRef<string | number | null>(null)
  const { data: instances } = useSdInstancesWithTypeAndSnapshotQuery()

  // Handle window resize for mobile view
  // TODO: Phone scroll on drag ??
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768)
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const layoutChanged = useCallback(
    (_layout: Layout[], newLayouts: { [key: string]: Layout[] }) => {
      if (!newLayouts) return

      // As the newLayouts are returned with all properties explicitly defined,
      // we must normalize the layouts before comparing them, thus remove the undefined properties
      const normalizeLayouts = (layouts: { [key: string]: Layout[] }) => {
        const normalized = { ...layouts }
        for (const breakpoint in normalized) {
          normalized[breakpoint] = normalized[breakpoint].map((item) => {
            return {
              w: item.w,
              h: item.h,
              x: item.x,
              y: item.y,
              i: item.i,
              minW: item.minW || 0,
              minH: item.minH || 0,
              maxW: item.maxW,
              maxH: item.maxH,
              moved: item.moved || false,
              static: item.static || false
              // Other properties are not needed for comparison
            }
          })
        }
        return normalized
      }

      const normalizedOldLayouts = normalizeLayouts(layouts ?? {})
      const normalizedNewLayouts = normalizeLayouts(newLayouts)

      // Deep compare the normalized layouts
      if (_.isEqual(normalizedOldLayouts, normalizedNewLayouts)) return

      // Update layouts and save to DB
      setLayouts(newLayouts)
      handleSaveToDB(newLayouts, details)
    },
    [layouts, details, handleSaveToDB]
  )

  const breakpointChanged = (newBreakpoint: string) => {
    setCurrentBreakpoint(newBreakpoint)
  }

  const handleScroll = () => {
    const baseStep = 5
    const scrollRoot = document.documentElement || document.body
    const scrollStep = scrollRef.current === 'up' ? -baseStep : baseStep

    scrollRoot.scrollBy({
      left: 0,
      top: scrollStep * scrollSpeedMultiplier.current
    })
    scrollAnimationFrame.current = requestAnimationFrame(handleScroll)
  }

  const startScrolling = (direction: 'up' | 'down') => {
    if (scrollRef.current !== direction) {
      scrollRef.current = direction
      if (!scrollAnimationFrame.current) {
        scrollAnimationFrame.current = requestAnimationFrame(handleScroll)
      }
    }
  }

  const stopScrolling = () => {
    if (scrollAnimationFrame.current) {
      cancelAnimationFrame(scrollAnimationFrame.current)
      scrollAnimationFrame.current = null
    }
    scrollRef.current = null
  }

  const adjustSpeed = (distanceFromEdge: number) => {
    if (distanceFromEdge < 10) {
      scrollSpeedMultiplier.current = 3
      // console.log('scrollSpeedMultiplier.current', scrollSpeedMultiplier.current)
    } else if (distanceFromEdge < 30) {
      // console.log('scrollSpeedMultiplier.current', scrollSpeedMultiplier.current)
      scrollSpeedMultiplier.current = 2
    } else {
      // console.log('scrollSpeedMultiplier.current', scrollSpeedMultiplier.current)
      scrollSpeedMultiplier.current = 1
    }
  }

  const cols = { lg: 6, md: 3, sm: 3, xs: 3, xxs: 1 }

  function handleDeleteItem(id: string) {
    const newLayouts = { ...layouts }
    for (const key in newLayouts) {
      newLayouts[key] = newLayouts[key].filter((item) => item.i !== id)
    }
    setLayouts(newLayouts)
    const newDetails = { ...details }
    delete newDetails[id]
    setDetails(newDetails)
    handleSaveToDB(newLayouts, newDetails)
  }

  // Upon resizing the window, get the current width of a single item and divide it by its w
  // TODO: resize ?
  useEffect(() => {
    if (mounted && layouts && layouts[currentBreakpoint].length > 0) {
      const item = layouts![currentBreakpoint][0]
      const itemRef = document.getElementsByClassName(item.i)[0]
      if (itemRef) {
        const { width } = itemRef.getBoundingClientRect()
        const newWidth = width / item.w
        setWidth(newWidth)
      }
    }
  }, [mounted, currentBreakpoint, layouts])

  const handleSetEditMode = () => {
    if (!editMode) {
      setSavedLayout(layouts)
      toast.info('You are now in edit mode. Your current layout has been saved.')
    } else {
      toast.success('You have exited edit mode.')
    }
    setEditMode(!editMode)
    setHighlightedCardID(null)
  }

  const handleRestoreLayout = () => {
    if (savedLayout) {
      setLayouts(savedLayout)
      handleSaveToDB(savedLayout, details)
      toast.success('Layout has been restored.')
    }
  }

  function handleAddItem<ConfigType extends AllConfigTypes>(item: GridItem<ConfigType>) {
    const newLayouts = { ...layouts }

    // Get the largest index in the layout
    let largestIndex = 0
    Object.keys(newLayouts).forEach((breakpoint) => {
      newLayouts[breakpoint].forEach((layoutItem) => {
        if (parseInt(layoutItem.i) > largestIndex) {
          largestIndex = parseInt(layoutItem.i)
        }
      })
    })

    const sizing = item.visualizationConfig?.sizing

    // Calculate the new index and make the y position Infinity
    // the position will be adjusted by the vertical compaction
    const newIndex = (largestIndex + 1).toString()
    const itemLayout: Layout = {
      w: sizing?.w! || 2,
      h: sizing?.h! || 2,
      x: 0,
      y: Infinity,
      i: newIndex,
      minH: sizing?.minH! || 0,
      minW: sizing?.minW! || 0
    }

    // Insert the new item into all of the layouts
    Object.keys(newLayouts).forEach((breakpoint) => {
      newLayouts[breakpoint].push({ ...itemLayout })
      newLayouts[breakpoint] = utils.compact(
        utils.moveElement(
          newLayouts[breakpoint],
          itemLayout,
          0,
          0,
          true,
          false,
          'vertical',
          cols[breakpoint as keyof typeof cols],
          false
        ),
        'vertical',
        cols[breakpoint as keyof typeof cols]
      )
    })

    item.layoutID = newIndex

    // Construct a new DB item
    const dbItemDetails: DBItemDetails<AllConfigTypes> = {
      layoutID: newIndex,
      visualization: item.visualization,
      visualizationConfig: item.visualizationConfig.config
    }

    const newDetails = { ...details, [newIndex]: dbItemDetails }

    setDetails(newDetails)
    setLayouts(newLayouts)
    // Save to DB
    handleSaveToDB(newLayouts, newDetails)
  }

  useEffect(() => {
    if (fetchedConfigLoading && !loadingToastRef.current) {
      loadingToastRef.current = toast.loading('Fetching from database...')
    }

    if (!fetchedConfigLoading && loadingToastRef.current) {
      toast.dismiss(loadingToastRef.current)

      if (fetchedConfigError) {
        toast.error('Failed to fetch from database')
        console.error('Failed to fetch from database:', fetchedConfigError)
      }

      if (fetchedConfigData) {
        const config = fetchedConfigData.userConfig.config
        const parsedConfig: RiotDashboardConfig = JSON.parse(config)

        if (!parsedConfig.riot) {
          console.error('Invalid config format')
          toast.error('Failed to fetch dashboard configuration')
          return
        }

        setLayouts(parsedConfig.riot.layout)
        setDetails(parsedConfig.riot.details)
        setMounted(true)

        // // Scroll bar fix TODO: might not be necessary
        // setTimeout(() => {
        //   const event = new CustomEvent('resize')
        //   window.dispatchEvent(event)
        // }, 200)
      }
    }
  }, [fetchedConfigLoading, fetchedConfigError, fetchedConfigData])

  function handleSaveToDB(layout: Layouts, details: { [key: string]: DBItemDetails<AllConfigTypes> }) {
    const DBDataStructure: RiotDashboardConfig = {
      riot: {
        layout,
        details
      }
    }

    updateUserConfig({
      variables: {
        userId: userID,
        input: {
          config: JSON.stringify(DBDataStructure)
        }
      }
    })
  }

  useEffect(() => {
    if (saveConfigLoading) {
      toast.info('Saving to database')
    }

    if (saveConfigError) {
      toast.error('Failed to save to database')
      console.error('Failed to save to DB:', saveConfigError)
    }

    if (saveConfigData) {
      console.log('Saved to DB:', saveConfigData)
      toast.success('Saved to database')
    }
  }, [saveConfigLoading, saveConfigError, saveConfigData])

  function handleSaveConfig<ConfigType extends AllConfigTypes>(
    builderResult: BuilderResult<ConfigType>,
    dbItemDetails: DBItemDetails<ConfigType>
  ) {
    const newDetails = { ...details }

    const newDetailsItem: DBItemDetails<AllConfigTypes> = {
      layoutID: dbItemDetails.layoutID,
      visualization: dbItemDetails.visualization,
      visualizationConfig: builderResult.config
    }

    // Find the item in layouts and update its size based on builderResult.sizing
    const newLayouts = { ...layouts }
    Object.keys(newLayouts).forEach((breakpoint) => {
      newLayouts[breakpoint] = newLayouts[breakpoint].map((layoutItem) => {
        if (layoutItem.i === dbItemDetails.layoutID) {
          return {
            ...layoutItem,
            w: builderResult.sizing?.w || layoutItem.w,
            h: builderResult.sizing?.h || layoutItem.h
          }
        }
        return layoutItem
      })
    })

    setLayouts(newLayouts)

    newDetails[dbItemDetails?.layoutID!] = newDetailsItem
    setDetails(newDetails)
    handleSaveToDB(newLayouts, newDetails)
  }

  if (!mounted || !layouts || !details || !instances) {
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
          <Button
            onClick={() => {
              handleSetEditMode()
            }}
            variant={'default'}
          >
            {editMode ? 'End' : 'Edit'}
          </Button>
        </div>
      </Navbar>
      <MainGrid>
        <DashboardGroupCardsController />
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          onBreakpointChange={(breakpoint) => {
            breakpointChanged(breakpoint)
          }}
          breakpoints={{ lg: 1200, md: 996, xs: 480, xxs: 0 }}
          cols={cols}
          draggableHandle=".drag-handle"
          measureBeforeMount={false}
          useCSSTransforms={true}
          rowHeight={rowHeight}
          isDraggable={editMode}
          isResizable={editMode}
          isDroppable={editMode}
          onResizeStart={(_layouts, _layout, newItem) => {
            console.log('Dragging card with ID:', newItem.i)
            setResizeCardID(newItem.i)
          }}
          onResizeStop={() => {
            setResizeCardID(null)
          }}
          containerPadding={[10, 10]}
          compactType={'vertical'}
          verticalCompact={true}
          resizeHandle={<MyHandle editMode={editMode} />}
          onLayoutChange={(layout, layouts) => layoutChanged(layout, layouts)}
          onDrag={(_layouts, _layout, _newItem, _placeholder, _event, element) => {
            const { top, bottom } = element.getBoundingClientRect()
            if (isMobileView) {
              const distanceFromBottom = window.innerHeight - bottom
              const distanceFromTop = top

              if (distanceFromBottom < 50) {
                adjustSpeed(distanceFromBottom)
                startScrolling('down')
              } else if (distanceFromTop < 50) {
                adjustSpeed(distanceFromTop)
                startScrolling('up')
              } else {
                stopScrolling()
              }
            }
          }}
          onDragStop={() => {
            stopScrolling()
          }}
        >
          {layouts![currentBreakpoint].map((item) => {
            const detail = details[item.i]
            if (!detail) return null

            switch (detail.visualization) {
              case 'table':
                return (
                  <Card key={item.i} className={`${highlightedCardID === item.i ? 'z-10' : ''}`}>
                    <TableCard
                      key={item.i}
                      cardID={item.i}
                      title={`Item ${item.i}`}
                      layout={layouts![currentBreakpoint]}
                      setLayout={(newLayout) => {
                        const updatedLayouts = {
                          ...layouts,
                          [currentBreakpoint]: newLayout
                        }
                        setLayouts(updatedLayouts)
                        handleSaveToDB(updatedLayouts, details)
                      }}
                      editModeEnabled={editMode}
                      breakPoint={currentBreakpoint}
                      cols={cols}
                      handleDeleteItem={handleDeleteItem}
                      height={rowHeight}
                      width={width}
                      setHighlightedCardID={setHighlightedCardID}
                      configuration={details[item.i]}
                      beingResized={resizeCardID === item.i}
                      handleSaveEdit={(config) => handleSaveConfig(config, details[item.i])}
                    />
                  </Card>
                )
              case 'bullet':
                return (
                  <Card key={item.i} className={`${highlightedCardID === item.i ? 'z-10' : ''}`}>
                    <BulletCard
                      key={item.i}
                      cardID={item.i}
                      title={`Item ${item.i}`}
                      layout={layouts![currentBreakpoint]}
                      setLayout={(newLayout) => {
                        const updatedLayouts = {
                          ...layouts,
                          [currentBreakpoint]: newLayout
                        }
                        setLayouts(updatedLayouts)
                        handleSaveToDB(updatedLayouts, details)
                      }}
                      editModeEnabled={editMode}
                      breakPoint={currentBreakpoint}
                      cols={cols}
                      handleDeleteItem={handleDeleteItem}
                      height={rowHeight}
                      width={width}
                      setHighlightedCardID={setHighlightedCardID}
                      configuration={details[item.i]}
                      beingResized={resizeCardID === item.i}
                      handleSaveEdit={(config) => handleSaveConfig(config, details[item.i])}
                      instances={instances.sdInstances}
                    />
                  </Card>
                )
              case 'line':
                return (
                  <Card key={item.i} className={`${highlightedCardID === item.i ? 'z-10' : ''}`}>
                    <ChartCard
                      key={item.i}
                      cardID={item.i}
                      title={`Item ${item.i}`}
                      layout={layouts![currentBreakpoint]}
                      setLayout={(newLayout) => {
                        const updatedLayouts = {
                          ...layouts,
                          [currentBreakpoint]: newLayout
                        }
                        setLayouts(updatedLayouts)
                        handleSaveToDB(updatedLayouts, details)
                      }}
                      editModeEnabled={editMode}
                      breakPoint={currentBreakpoint}
                      cols={cols}
                      handleDeleteItem={handleDeleteItem}
                      height={rowHeight}
                      width={width}
                      setHighlightedCardID={setHighlightedCardID}
                      configuration={details[item.i]}
                      breakpoint={currentBreakpoint}
                      beingResized={resizeCardID === item.i}
                      handleSaveEdit={(config) => handleSaveConfig(config, details[item.i])}
                    />
                  </Card>
                )
              case 'switch':
              case 'entitycard':
                return (
                  <Card key={item.i} className={`${highlightedCardID === item.i ? 'z-10' : ''}`}>
                    <EntityCard
                      key={item.i}
                      cardID={item.i}
                      title={`Item ${item.i}`}
                      layout={layouts![currentBreakpoint]}
                      setLayout={(newLayout) => {
                        const updatedLayouts = {
                          ...layouts,
                          [currentBreakpoint]: newLayout
                        }
                        setLayouts(updatedLayouts)
                        handleSaveToDB(updatedLayouts, details)
                      }}
                      editModeEnabled={editMode}
                      breakPoint={currentBreakpoint}
                      cols={cols}
                      handleDeleteItem={handleDeleteItem}
                      height={rowHeight}
                      width={width}
                      setHighlightedCardID={setHighlightedCardID}
                      configuration={details[item.i]}
                      handleSaveEdit={(config) => handleSaveConfig(config, details[item.i])}
                    />
                  </Card>
                )
              default:
                return null
            }
          })}
        </ResponsiveGridLayout>
      </MainGrid>
      <AddItemModal onAddItem={handleAddItem} />
      {/* <StatusTimeline /> */}
    </DashboardRoot>
  )
}

export default Dashboard

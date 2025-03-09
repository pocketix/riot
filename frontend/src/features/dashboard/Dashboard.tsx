// Imports necessary for the react-grid-layout library
import '@/../node_modules/react-grid-layout/css/styles.css'
import '@/../node_modules/react-resizable/css/styles.css'

import { WidthProvider, Responsive, Layouts, Layout } from 'react-grid-layout'
import { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import { DashboardRoot, Navbar, MainGrid } from '@/styles/dashboard/DashboardGlobal'
import { Button } from '@/components/ui/button'
import { ChartCard } from './components/cards/ChartCard'
import { AddItemModal } from './components/AddItem'
import { BulletCard } from './components/cards/BulletCard'
import { toast } from 'sonner'
import { RestoreLayoutDialog } from './components/RestoreLayoutDialog'
import { TableCard } from './components/cards/TableCard'
import { Card } from '@/components/ui/card'
import { MyHandle } from './components/cards/DragHandle'
import { GridItem } from '@/types/GridItem'
import { utils } from 'react-grid-layout'

const Dashboard = () => {
  const ResponsiveGridLayout = useMemo(() => WidthProvider(Responsive), [])

  const [editMode, setEditMode] = useState<boolean>(false) // TODO: ked sa skonci edit, prompt na ulozenie do DB
  const [isMobileView, setIsMobileView] = useState(false)
  const scrollRef = useRef<'up' | 'down' | null>(null)
  const scrollAnimationFrame = useRef<number | null>(null)
  const scrollSpeedMultiplier = useRef(1)
  const [mounted, setMounted] = useState<boolean>(false) // TODO: Problem kvoli scroll baru..
  const rowHeight: number = 100
  const [width, setWidth] = useState<number>(0)
  const [highlightedCardID, setHighlightedCardID] = useState<string | null>(null)
  const [savedLayout, setSavedLayout] = useState<Layouts>()

  // Default layout
  const defaultLayouts: Layouts = {
    lg: [],
    md: [],
    xs: [],
    xxs: []
  }

  const [layouts, setLayouts] = useState<{ [key: string]: Layout[] }>()
  const [details, setDetails] = useState<{ [key: string]: GridItem }>({})
  const [currentBreakpoint, setCurrentBreakpoint] = useState('lg')

  // https://github.com/react-grid-layout/react-grid-layout/blob/master/test/examples/07-localstorage.jsx
  // Function to get layouts from local storage
  function getFromLS(key: string): { [key: string]: Layout[] } {
    let ls: { [key: string]: any } = {}
    if (window.localStorage) {
      try {
        const item = window.localStorage.getItem('layouts')
        ls = item ? JSON.parse(item) : {}
      } catch (e) {
        /*Ignore*/
      }
    }
    console.log('getFromLS', ls[key])
    return ls[key]
  }

  // Function to save layouts to local storage
  function saveToLS(key: string, value: { [key: string]: Layout[] }) {
    if (window.localStorage) {
      const data = {
        layouts: value,
        layoutsLastUpdate: new Date().toISOString() // TODO: Database sync
      }
      window.localStorage.setItem(key, JSON.stringify(data))
    }
  }

  // Fetch layouts from database
  async function fetchLayoutsFromDB(): Promise<{
    [key: string]: Layout[]
  } | null> {
    try {
      const response = await fetch('/api/get-layouts') // Replace with your API endpoint
      const data = await response.json()
      return data.layouts
    } catch (error) {
      console.error('Failed to fetch layouts from DB:', error)
      return null
    }
  }

  async function getDetailsFromLS(): Promise<{ [key: string]: GridItem } | undefined> {
    if (window.localStorage) {
      try {
        const item = window.localStorage.getItem('details')
        return item ? JSON.parse(item) : undefined
      } catch (e) {
        /*Ignore*/
      }
    }
  }

  async function saveDetailsToLS(value: { [key: string]: GridItem }) {
    if (window.localStorage) {
      window.localStorage.setItem('details', JSON.stringify(value))
    }
  }

  // Get layouts on mount, in order of priority: local storage -> database -> default TODO
  useEffect(() => {
    const initializeLayouts = async () => {
      // Try to get layouts from local storage
      const lsLayouts = getFromLS('layouts')

      console.log('Got layouts from LS', lsLayouts)

      const storedDetails = await getDetailsFromLS()
      if (storedDetails) {
        setDetails(storedDetails)
      }

      if (lsLayouts) {
        setLayouts(lsLayouts)
      } else {
        // If not in local storage, try to fetch from DB
        const dbLayouts = await fetchLayoutsFromDB()

        if (dbLayouts) {
          setLayouts(dbLayouts)
          saveToLS('layouts', dbLayouts)
        } else {
          // Fallback
          console.log('Using default layouts')
          setLayouts(defaultLayouts)
          console.log('Saving default layouts', defaultLayouts)
        }
      }
    }

    initializeLayouts()
    setMounted(true)

    // Scroll bar fix
    setTimeout(() => {
      const event = new CustomEvent('resize')
      window.dispatchEvent(event)
    }, 200)
  }, [])

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
    (_: Layout[], newLayouts: { [key: string]: Layout[] }) => {
      // Only change layouts, if the layout has changed
      // Check if the layout has changed
      if (JSON.stringify(newLayouts) === JSON.stringify(layouts)) return

      console.log('layoutChanged', newLayouts)
      saveToLS('layouts', newLayouts)
      setLayouts(newLayouts)
    },
    [layouts]
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
      console.log('scrollSpeedMultiplier.current', scrollSpeedMultiplier.current)
    } else if (distanceFromEdge < 30) {
      console.log('scrollSpeedMultiplier.current', scrollSpeedMultiplier.current)
      scrollSpeedMultiplier.current = 2
    } else {
      console.log('scrollSpeedMultiplier.current', scrollSpeedMultiplier.current)
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
    saveToLS('layouts', newLayouts)
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
      saveToLS('layouts', savedLayout)
      toast.success('Layout has been restored.')
    }
  }

  const handleAddItem = (item: GridItem) => {
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

    const sizing = JSON.parse(item.visualizationConfig).sizing

    const newIndex = (largestIndex + 1).toString()
    const newCard: Layout = {
      w: sizing.w ?? 2,
      h: sizing.h ?? 2,
      x: 0,
      y: Infinity,
      i: newIndex,
      minH: sizing.minH ?? 0,
      minW: sizing.minW ?? 0
    }

    Object.keys(newLayouts).forEach((breakpoint) => {
      newLayouts[breakpoint].push({ ...newCard })
      newLayouts[breakpoint] = utils.compact(
        utils.moveElement(newLayouts[breakpoint], newCard, 0, 0, true, false, 'vertical', cols[breakpoint as keyof typeof cols], false),
        'vertical',
        cols[breakpoint as keyof typeof cols]
      )
    })

    item.layoutID = newIndex

    const newDetails = { ...details, [newIndex]: item }

    saveDetailsToLS(newDetails)
    setDetails(newDetails)
    setLayouts(newLayouts)
    saveToLS('layouts', newLayouts)
  }

  if (!mounted || !layouts || !details) {
    return <div>Loading...</div>
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
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          // onLayoutChange={layoutChanged}
          onBreakpointChange={(breakpoint) => {
            breakpointChanged(breakpoint)
          }}
          breakpoints={{ lg: 1200, md: 996, xs: 480, xxs: 0 }}
          cols={cols}
          draggableHandle=".drag-handle"
          measureBeforeMount={false}
          useCSSTransforms={mounted}
          rowHeight={rowHeight}
          isDraggable={editMode}
          isResizable={editMode}
          isDroppable={editMode}
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
                        saveToLS('layouts', updatedLayouts)
                        console.log('Saving layout from TableCard', updatedLayouts)
                      }}
                      editModeEnabled={editMode}
                      breakPoint={currentBreakpoint}
                      cols={cols}
                      handleDeleteItem={handleDeleteItem}
                      height={rowHeight}
                      width={width}
                      setHighlightedCardID={setHighlightedCardID}
                      configuration={details[item.i]}
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
                        saveToLS('layouts', updatedLayouts)
                      }}
                      editModeEnabled={editMode}
                      breakPoint={currentBreakpoint}
                      cols={cols}
                      handleDeleteItem={handleDeleteItem}
                      height={rowHeight}
                      width={width}
                      setHighlightedCardID={setHighlightedCardID}
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
                        saveToLS('layouts', updatedLayouts)
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
                    />
                  </Card>
                )
              case 'switch':
              case 'entitycard':
              default:
                return null
            }
          })}
        </ResponsiveGridLayout>
      </MainGrid>
      <AddItemModal onAddItem={handleAddItem} />
    </DashboardRoot>
  )
}

export default Dashboard

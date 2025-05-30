import { useState, useEffect, useCallback, useMemo } from 'react'
import { Layouts, Layout } from 'react-grid-layout'
import { toast } from 'sonner'
import { AllConfigTypes, BuilderResult, GridItem } from '@/types/dashboard/gridItem'
import { useUpdateUserConfigMutation, useUserConfigQuery } from '@/generated/graphql'
import { useInstances } from '@/context/InstancesContext'
import { utils } from 'react-grid-layout'
import _ from 'lodash'
import DashboardView from './DashboardView'
import { DashboardConfig, DBItemDetails, RiotDashboardConfigSchema, Tab } from '@/schemas/dashboard/DashboardSchema'
import { AddTabFormSchemaType } from '@/schemas/dashboard/AddTabSchema'

const DashboardController = () => {
  const userID = 1 // Replace with real user id when implemented
  const { instances } = useInstances()
  const [mounted, setMounted] = useState<boolean>(false)
  const [tabs, setTabs] = useState<Tab[]>([])
  const [activeTabID, setActiveTabID] = useState<number>(0)
  const [editMode, setEditMode] = useState<boolean>(false)
  const [pendingChanges, setPendingChanges] = useState<Tab[]>([])
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

  const activeTab = useMemo(() => {
    return tabs.find((tab) => tab.id === activeTabID)
  }, [tabs, activeTabID])

  const layouts = useMemo(() => activeTab?.layout || {}, [activeTab])
  const details = useMemo(() => activeTab?.details || {}, [activeTab])

  // CONSTANTS
  const COLS_CONST = { lg: 6, md: 4, xs: 3, xxs: 2 }
  const ROW_HEIGHT = 10

  const handleSaveToDB = useCallback(
    (updatedTabs: Tab[], sync?: boolean) => {
      if (editMode && !sync) {
        setPendingChanges(updatedTabs)
        return
      }

      const DBDataStructure: DashboardConfig = {
        riot: {
          tabs: sync ? pendingChanges : updatedTabs
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
    },
    [updateUserConfig, userID, editMode, pendingChanges, setPendingChanges]
  )

  const layoutChanged = useCallback(
    (_layout: Layout[], newLayouts: { [key: string]: Layout[] }, currentBreakpoint: string) => {
      if (!newLayouts) return

      // Normalize layouts before comparing
      const normalizeLayouts = (layouts: { [key: string]: Layout[] }) => {
        const normalized = { ...layouts }
        return (normalized[currentBreakpoint] = normalized[currentBreakpoint].map((item) => ({
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
        })))
      }

      const normalizedOldLayouts = normalizeLayouts(layouts ?? {})
      const normalizedNewLayouts = normalizeLayouts(newLayouts)

      if (_.isEqual(normalizedOldLayouts, normalizedNewLayouts)) return

      const updatedTabs = tabs.map((tab) => {
        if (tab.id === activeTabID) {
          return {
            ...tab,
            layout: newLayouts
          }
        }
        return tab
      })

      setTabs(updatedTabs)
      handleSaveToDB(updatedTabs)
    },
    [tabs, activeTabID, handleSaveToDB]
  )

  const handleSetEditMode = (newEditMode: boolean) => {
    if (editMode && !newEditMode) {
      // User finished editting, save pending changes
      setEditMode(newEditMode)
      handleSaveToDB(pendingChanges, true)
    } else if (!editMode && newEditMode) {
      setEditMode(newEditMode)
      setPendingChanges([...tabs])
    }
  }

  const handleAddTab = (values: AddTabFormSchemaType) => {
    let highestId = 0
    if (tabs.length > 0) {
      highestId = Math.max(...tabs.map((tab) => Number(tab.id)))
    }

    const newTabId = highestId + 1

    const defaultLayouts: Layouts = {}
    Object.keys(COLS_CONST).forEach((key) => {
      defaultLayouts[key] = []
    })

    const newTab: Tab = {
      id: newTabId,
      userIdentifier: values.userIdentifier,
      icon: values.icon,
      layout: defaultLayouts,
      details: {}
    }

    const updatedTabs = [...tabs, newTab] // append the new tab
    setTabs(updatedTabs)
    setActiveTabID(newTabId)
    handleSaveToDB(updatedTabs)
  }

  const handleChangeTab = (tabId: number) => setActiveTabID(tabId)

  const handleDeleteItem = useCallback(
    (id: string, breakpoint: string) => {
      if (!activeTabID || !activeTab) return

      const newLayouts = { ...activeTab.layout }

      if (breakpoint) {
        if (newLayouts[breakpoint]) {
          newLayouts[breakpoint] = newLayouts[breakpoint].filter((item) => item.i !== id)
        }
      } else {
        Object.keys(newLayouts).forEach((key) => {
          newLayouts[key] = newLayouts[key].filter((item) => item.i !== id)
        })
      }

      const stillExists = Object.values(newLayouts).some((layoutArr) => layoutArr.some((item) => item.i === id))

      const newDetails = { ...activeTab.details }
      if (!stillExists) {
        delete newDetails[id]
      }

      const updatedTabs = tabs.map((tab) => {
        if (tab.id === activeTabID) {
          return {
            ...tab,
            layout: newLayouts,
            details: newDetails
          }
        }
        return tab
      })

      setTabs(updatedTabs)
      handleSaveToDB(updatedTabs)
    },
    [tabs, activeTabID, activeTab, handleSaveToDB]
  )

  const handleAddItem = useCallback(
    <ConfigType extends AllConfigTypes>(item: GridItem<ConfigType>, currentBreakpoint: string) => {
      if (!activeTabID || !activeTab) return
      // If the item.layouID is defined, it means that the item is already in the details for given tab
      // and we are only inserting it into the current breakpoint layout

      const newLayouts = { ...activeTab.layout }
      const currentDetails = { ...activeTab.details }

      // Find largest index across all layouts in all tabs
      let largestIndex = 0
      if (!item.layoutID) {
        tabs.forEach((tab) => {
          Object.keys(tab.layout).forEach((breakpoint) => {
            tab.layout[breakpoint].forEach((layoutItem) => {
              const itemIndex = parseInt(layoutItem.i)
              if (!isNaN(itemIndex) && itemIndex > largestIndex) {
                largestIndex = itemIndex
              }
            })
          })
        })
      } else {
        largestIndex = parseInt(item.layoutID)
      }

      const newIndex = item.layoutID || (largestIndex + 1).toString()

      // Get layouts separately for all breakpoints,
      // as the widths cannot be the same for all breakpoints.
      // This also prevents the unnecessary config saves when onLayoutChange occurs,
      // as the layouts' items already have the correct width and do not need to be adjusted.
      const getItemLayoutForBreakpoint = <ConfigType extends AllConfigTypes>(
        breakpoint: string,
        item: GridItem<ConfigType>
      ) => {
        const colsCount = COLS_CONST[breakpoint as keyof typeof COLS_CONST]
        const sizing = item.visualizationConfig?.sizing
        const itemLayout: Layout = {
          w: Math.min(sizing?.w! || 2, colsCount),
          h: sizing?.h! || 2,
          x: 0,
          y: Infinity,
          i: newIndex,
          minH: sizing?.minH! || 1,
          minW: sizing?.minW! || 1
        }
        return itemLayout
      }

      // Adding into the current breakpoint ONLY!
      if (item.layoutID) {
        const itemLayout = getItemLayoutForBreakpoint(currentBreakpoint, item)
        newLayouts[currentBreakpoint].push({ ...itemLayout })
        newLayouts[currentBreakpoint] = utils.compact(
          utils.moveElement(
            newLayouts[currentBreakpoint],
            itemLayout,
            0,
            Infinity,
            true,
            false,
            'vertical',
            COLS_CONST[currentBreakpoint as keyof typeof COLS_CONST],
            false
          ),
          'vertical',
          COLS_CONST[currentBreakpoint as keyof typeof COLS_CONST]
        )
      } else {
        // Insert into all layouts for the current tab
        Object.keys(newLayouts).forEach((breakpoint) => {
          const itemLayout = getItemLayoutForBreakpoint(breakpoint, item)
          newLayouts[breakpoint].push({ ...itemLayout })
          newLayouts[breakpoint] = utils.compact(
            utils.moveElement(
              newLayouts[breakpoint],
              itemLayout,
              0,
              Infinity,
              true,
              false,
              'vertical',
              COLS_CONST[breakpoint as keyof typeof COLS_CONST],
              false
            ),
            'vertical',
            COLS_CONST[breakpoint as keyof typeof COLS_CONST]
          )
        })
      }

      // Create database item entry
      const dbItemDetails = {
        visualization: item.visualization,
        visualizationConfig: item.visualizationConfig.config
      } as DBItemDetails

      currentDetails[newIndex] = dbItemDetails

      const updatedTabs = tabs.map((tab) => {
        if (tab.id === activeTabID) {
          return {
            ...tab,
            layout: newLayouts,
            details: currentDetails
          }
        }
        return tab
      })

      setTabs(updatedTabs)
      handleSaveToDB(updatedTabs)
    },
    [tabs, activeTabID, activeTab, COLS_CONST, handleSaveToDB]
  )

  const handleSaveConfig = useCallback(
    <ConfigType extends AllConfigTypes>(
      builderResult: BuilderResult<ConfigType>,
      dbItemDetails: DBItemDetails,
      detailsIndex: string
    ) => {
      if (!activeTabID) return

      const currentDetails = { ...activeTab?.details }

      const newDetailsItem = {
        visualization: dbItemDetails.visualization,
        visualizationConfig: builderResult.config
      }

      // Update layouts with new sizing
      const newLayouts = { ...activeTab?.layout }
      Object.keys(newLayouts).forEach((breakpoint) => {
        newLayouts[breakpoint] = newLayouts[breakpoint].map((layoutItem) => {
          if (layoutItem.i === detailsIndex) {
            return {
              ...layoutItem,
              w: builderResult.sizing?.w || layoutItem.w,
              h: builderResult.sizing?.h! > layoutItem.h ? builderResult.sizing?.h! || layoutItem.h : layoutItem.h, // if the user has changed the height and it is still suitable, leave it
              minH: builderResult.sizing?.minH || layoutItem.minH,
              minW: builderResult.sizing?.minW || layoutItem.minW
            }
          }
          return layoutItem
        })
      })

      currentDetails[detailsIndex] = newDetailsItem as DBItemDetails

      const updatedTabs = tabs.map((tab) => {
        if (tab.id === activeTabID) {
          return {
            ...tab,
            layout: newLayouts,
            details: currentDetails
          }
        }
        return tab
      })

      setTabs(updatedTabs)
      handleSaveToDB(updatedTabs)
    },
    [tabs, activeTabID, handleSaveToDB]
  )

  const handleRestoreAllTabs = (savedTabsState: Tab[]): boolean => {
    if (!savedTabsState || savedTabsState.length === 0) return false

    setTabs(savedTabsState)
    handleSaveToDB(savedTabsState)
    return true
  }

  const handleDeleteTab = useCallback(
    (tabId: number) => {
      const tabToDelete = tabs.find((tab) => tab.id === tabId)
      if (!tabToDelete) {
        toast.error('Tab not found')
        return
      }

      toast.loading(`Deleting tab "${tabToDelete.userIdentifier}"...`, {
        id: 'delete-tab'
      })

      const updatedTabs = tabs.filter((tab) => tab.id !== tabId)
      setTabs(updatedTabs)
      handleSaveToDB(updatedTabs)

      toast.success(`Tab "${tabToDelete.userIdentifier}" deleted`, {
        id: 'delete-tab'
      })
    },
    [tabs, activeTabID, handleSaveToDB]
  )

  useEffect(() => {
    const getDefaultTab = () => {
      const defaultLayouts: Layouts = {}
      Object.keys(COLS_CONST).forEach((key) => {
        defaultLayouts[key] = []
      })

      return {
        id: 1,
        userIdentifier: 'General',
        icon: '',
        layout: defaultLayouts,
        details: {}
      }
    }

    if (fetchedConfigError) {
      // I came across this error, when the deleteUserConfig mutation was called
      // this should be rechecked whether new users are created with empty config or '{}'
      const isNewUserError = fetchedConfigError.message.includes('record not found')

      if (isNewUserError) {
        toast.loading('Creating a new dashboard...', { id: 'dashboard-config-load' })
        console.log('First time user detected, creating default dashboard.')

        const defaultTab = getDefaultTab()

        setTabs([defaultTab])
        setActiveTabID(1)
        setMounted(true)

        handleSaveToDB([defaultTab])

        toast.dismiss('dashboard-config-load')
        toast.success('Welcome! Your dashboard is ready.')
      } else {
        console.log('Error : ', fetchedConfigError.message)
        toast.error('Failed to fetch from database', { id: 'dashboard-config-load' })
        console.error('Failed to fetch from database:', fetchedConfigError)

        const defaultTab = getDefaultTab()
        setTabs([defaultTab])
        setActiveTabID(1)
        setMounted(true)
      }

      return
    }

    if (fetchedConfigLoading) {
      toast.loading('Loading dashboard configuration...', { id: 'dashboard-config-load' })
    }

    if (fetchedConfigData) {
      try {
        const config = fetchedConfigData.userConfig.config
        const parsedResult = RiotDashboardConfigSchema.safeParse(JSON.parse(config))

        if (!parsedResult.success) {
          toast.error('Invalid dashboard config format', { id: 'dashboard-config-load' })
          console.warn('Config validation error:', parsedResult.error)

          // Create a default tab when config format is invalid
          const defaultLayouts: Layouts = {}
          Object.keys(COLS_CONST).forEach((key) => {
            defaultLayouts[key] = []
          })

          const defaultTab = getDefaultTab()
          setTabs([defaultTab])
          setActiveTabID(1)
          setMounted(true)
          return
        }

        const parsedConfig = parsedResult.data

        if (!parsedConfig.riot || !parsedConfig.riot.tabs || parsedConfig.riot.tabs.length === 0) {
          console.warn('No tabs found in config, creating default tab')

          // Create a default tab when no tabs exist
          const defaultLayouts: Layouts = {}
          Object.keys(COLS_CONST).forEach((key) => {
            defaultLayouts[key] = []
          })

          const defaultTab = getDefaultTab()
          setTabs([defaultTab])
          setActiveTabID(1)
          handleSaveToDB([defaultTab])
        } else {
          setTabs(parsedConfig.riot.tabs)

          if (parsedConfig.riot.tabs.length > 0) setActiveTabID(parsedConfig.riot.tabs[0].id)
        }

        toast.dismiss('dashboard-config-load')
        setMounted(true)
      } catch (error) {
        console.error('Error parsing dashboard config:', error)
        toast.error('Error loading dashboard configuration', { id: 'dashboard-config-load' })

        // Create an empty default tab when parsing fails
        const defaultLayouts: Layouts = {}
        Object.keys(COLS_CONST).forEach((key) => {
          defaultLayouts[key] = []
        })

        const defaultTab: Tab = {
          id: 1,
          userIdentifier: 'General',
          icon: '',
          layout: defaultLayouts,
          details: {}
        }

        setTabs([defaultTab])
        setActiveTabID(1)
        setMounted(true)
      }
    }
  }, [fetchedConfigError, fetchedConfigData, fetchedConfigLoading])

  const handleEditTab = (tabId: number, values: AddTabFormSchemaType) => {
    const updatedTabs = tabs.map((tab) => {
      if (tab.id === tabId) {
        return {
          ...tab,
          userIdentifier: values.userIdentifier,
          icon: values.icon
        }
      }
      return tab
    })
    toast.loading(`Saving tab "${values.userIdentifier}"...`, {
      id: 'edit-tab'
    })

    setTabs(updatedTabs)
    handleSaveToDB(updatedTabs)
    toast.success(`Tab "${values.userIdentifier}" updated successfully`, {
      id: 'edit-tab'
    })
  }

  const getNextTabId = () => {
    const currentIndex = tabs.findIndex((tab) => tab.id === activeTabID)
    const nextIndex = (currentIndex + 1) % tabs.length
    return tabs[nextIndex].id
  }

  const getPreviousTabId = () => {
    const currentIndex = tabs.findIndex((tab) => tab.id === activeTabID)
    const previousIndex = (currentIndex - 1 + tabs.length) % tabs.length
    return tabs[previousIndex].id
  }

  useEffect(() => {
    if (saveConfigLoading) {
      toast.loading('Saving changes...', { id: 'dashboard-config-save' })
    }

    if (saveConfigError) {
      toast.error('Failed to save to database', { id: 'dashboard-config-save' })
      console.error('Failed to save to DB:', saveConfigError)
    }

    if (saveConfigData) {
      toast.success('Changes saved!', { id: 'dashboard-config-save' })
    }
  }, [saveConfigLoading, saveConfigError, saveConfigData])

  return (
    <DashboardView
      layouts={layouts}
      details={details}
      instances={instances}
      mounted={mounted}
      cols={COLS_CONST}
      rowHeight={ROW_HEIGHT}
      editMode={editMode}
      setEditMode={handleSetEditMode}
      onLayoutChange={layoutChanged}
      onDeleteItem={handleDeleteItem}
      onRestoreAllTabs={handleRestoreAllTabs}
      onAddItem={handleAddItem}
      onSaveConfig={handleSaveConfig}
      onAddTab={handleAddTab}
      onChangeTab={handleChangeTab}
      onDeleteTab={handleDeleteTab}
      onEditTab={handleEditTab}
      tabs={tabs}
      activeTabId={activeTabID}
      getNextTabId={getNextTabId}
      getPreviousTabId={getPreviousTabId}
    />
  )
}

export default DashboardController

import { useState, useEffect, useCallback } from 'react'
import { Layouts, Layout } from 'react-grid-layout'
import { toast } from 'sonner'
import { AllConfigTypes, BuilderResult, GridItem } from '@/types/dashboard/gridItem'
import { DBItemDetails } from '@/types/dashboard/dbItem'
import { useUpdateUserConfigMutation, useUserConfigQuery } from '@/generated/graphql'
import { RiotDashboardConfig } from '@/types/dashboard/dashboard'
import { useInstances } from '@/context/InstancesContext'
import { utils } from 'react-grid-layout'
import _ from 'lodash'
import DashboardView from './DashboardView'

const DashboardController = () => {
  const userID = 1 // TODO: Replace with real user id
  const [updateUserConfig, { data: saveConfigData, loading: saveConfigLoading, error: saveConfigError }] =
    useUpdateUserConfigMutation()

  const { data: fetchedConfigData, error: fetchedConfigError } = useUserConfigQuery({
    variables: {
      userConfigId: userID
    },
    skip: !userID
  })

  const { instances } = useInstances()

  const [layouts, setLayouts] = useState<{ [key: string]: Layout[] }>({})
  const [details, setDetails] = useState<{ [key: string]: DBItemDetails<AllConfigTypes> }>({})
  const [mounted, setMounted] = useState<boolean>(false)

  // Configuration
  const cols = { lg: 6, md: 3, sm: 3, xs: 3, xxs: 1 }
  const rowHeight = 10

  const handleSaveToDB = useCallback(
    (layout: Layouts, details: { [key: string]: DBItemDetails<AllConfigTypes> }) => {
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
    },
    [updateUserConfig, userID]
  )

  const layoutChanged = useCallback(
    (_layout: Layout[], newLayouts: { [key: string]: Layout[] }) => {
      if (!newLayouts) return

      // Normalize layouts before comparing
      const normalizeLayouts = (layouts: { [key: string]: Layout[] }) => {
        const normalized = { ...layouts }
        for (const breakpoint in normalized) {
          normalized[breakpoint] = normalized[breakpoint].map((item) => ({
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
          }))
        }
        return normalized
      }

      const normalizedOldLayouts = normalizeLayouts(layouts ?? {})
      const normalizedNewLayouts = normalizeLayouts(newLayouts)

      if (_.isEqual(normalizedOldLayouts, normalizedNewLayouts)) return

      setLayouts(newLayouts)
      handleSaveToDB(newLayouts, details)
    },
    [layouts, details, handleSaveToDB]
  )

  const handleDeleteItem = useCallback(
    (id: string) => {
      const newLayouts = { ...layouts }
      for (const key in newLayouts) {
        newLayouts[key] = newLayouts[key].filter((item) => item.i !== id)
      }
      setLayouts(newLayouts)
      const newDetails = { ...details }
      delete newDetails[id]
      setDetails(newDetails)
      handleSaveToDB(newLayouts, newDetails)
    },
    [layouts, details, handleSaveToDB]
  )

  const handleRestoreLayout = useCallback(
    (layout: Layouts): boolean => {
      if (layout) {
        setLayouts(layout)
        handleSaveToDB(layout, details)
        return true
      }
      return false
    },
    [details, handleSaveToDB]
  )

  const handleAddItem = useCallback(
    <ConfigType extends AllConfigTypes>(item: GridItem<ConfigType>) => {
      const newLayouts = { ...layouts }

      let largestIndex = 0
      Object.keys(newLayouts).forEach((breakpoint) => {
        newLayouts[breakpoint].forEach((layoutItem) => {
          if (parseInt(layoutItem.i) > largestIndex) {
            largestIndex = parseInt(layoutItem.i)
          }
        })
      })

      const newIndex = (largestIndex + 1).toString()

      // Get layouts separately for all breakpoints,
      // as the widths cannot be the same for all breakpoints.
      // This also prevents the unnecessary config saves when onLayoutChange occurs,
      // as the layouts' items already have the correct width and do not need to be adjusted.
      const getItemLayoutForBreakpoint = <ConfigType extends AllConfigTypes>(
        breakpoint: string,
        item: GridItem<ConfigType>
      ) => {
        const colsCount = cols[breakpoint as keyof typeof cols]
        console.log('Cols for breakpoint', breakpoint, 'are', colsCount)
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

      // Insert into all layouts
      Object.keys(newLayouts).forEach((breakpoint) => {
        const itemLayout = getItemLayoutForBreakpoint(breakpoint, item)
        console.log('inserting itemLayout', itemLayout, ' into breakpoint', breakpoint)
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

      // Create database item entry
      const dbItemDetails: DBItemDetails<AllConfigTypes> = {
        layoutID: newIndex,
        visualization: item.visualization,
        visualizationConfig: item.visualizationConfig.config
      }

      const newDetails = { ...details, [newIndex]: dbItemDetails }

      setDetails(newDetails)
      setLayouts(newLayouts)
      handleSaveToDB(newLayouts, newDetails)
    },
    [layouts, details, cols, handleSaveToDB]
  )

  const handleSaveConfig = useCallback(
    <ConfigType extends AllConfigTypes>(
      builderResult: BuilderResult<ConfigType>,
      dbItemDetails: DBItemDetails<ConfigType>
    ) => {
      const newDetails = { ...details }
      const newDetailsItem: DBItemDetails<AllConfigTypes> = {
        layoutID: dbItemDetails.layoutID,
        visualization: dbItemDetails.visualization,
        visualizationConfig: builderResult.config
      }

      // Update layouts with new sizing
      const newLayouts = { ...layouts }
      Object.keys(newLayouts).forEach((breakpoint) => {
        newLayouts[breakpoint] = newLayouts[breakpoint].map((layoutItem) => {
          if (layoutItem.i === dbItemDetails.layoutID) {
            return {
              ...layoutItem,
              w: builderResult.sizing?.w || layoutItem.w,
              h: builderResult.sizing?.h || layoutItem.h,
              minH: builderResult.sizing?.minH || layoutItem.minH,
              minW: builderResult.sizing?.minW || layoutItem.minW
            }
          }
          return layoutItem
        })
      })

      setLayouts(newLayouts)
      newDetails[dbItemDetails?.layoutID!] = newDetailsItem
      setDetails(newDetails)
      handleSaveToDB(newLayouts, newDetails)
    },
    [details, layouts, handleSaveToDB]
  )

  // Process fetched config data
  useEffect(() => {
    if (fetchedConfigError) {
      toast.error('Failed to fetch from database')
      console.error('Failed to fetch from database:', fetchedConfigError)
    }

    if (fetchedConfigData) {
      const config = fetchedConfigData.userConfig.config
      const parsedConfig: RiotDashboardConfig = JSON.parse(config)

      if (!parsedConfig.riot) {
        console.warn('Invalid config format or empty config')
      }

      // We did not get any layouts from the database,
      // create the default empty layouts with breakpoints
      const defaultLayouts: Layouts = {}
      Object.keys(cols).forEach((key) => {
        defaultLayouts[key] = []
      })

      setLayouts(parsedConfig.riot?.layout || defaultLayouts)
      setDetails(parsedConfig.riot?.details || {})
      setMounted(true)
    }
  }, [fetchedConfigError, fetchedConfigData])

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

  return (
    <DashboardView
      layouts={layouts}
      details={details}
      instances={instances}
      mounted={mounted}
      cols={cols}
      rowHeight={rowHeight}
      onLayoutChange={layoutChanged}
      onDeleteItem={handleDeleteItem}
      onRestoreLayout={handleRestoreLayout}
      onAddItem={handleAddItem}
      onSaveConfig={handleSaveConfig}
    />
  )
}

export default DashboardController

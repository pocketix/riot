import { useEffect, useMemo, useState } from 'react'
import { bulletChartBuilderSchema, BulletCardConfig } from '@/schemas/dashboard/BulletChartBuilderSchema'
import { BuilderResult } from '@/types/dashboard/GridItem'
import { StatisticsOperation, useStatisticsQuerySensorsWithFieldsLazyQuery } from '@/generated/graphql'
import { BulletRow } from './components/BulletRow'
import { BaseCard } from './BaseCard'
import { Layout } from 'react-grid-layout'

interface BulletCardProps {
  cardID: string
  layout: Layout[]
  breakPoint: string
  cols: { lg: number; md: number; sm: number; xs: number; xxs: number }
  height: number
  width: number
  setLayout: (layout: Layout[]) => void
  handleDeleteItem: (id: string) => void
  setHighlightedCardID: (id: string) => void
  editModeEnabled: boolean
  beingResized: boolean
  configuration: any
  handleSaveEdit: (config: BuilderResult<BulletCardConfig>) => void
}

export const BulletCard = (props: BulletCardProps) => {
  const [chartConfig, setChartConfig] = useState<BulletCardConfig>()
  const [data, setData] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  // Poll interval based on the smallest time frame in the card config
  const minimumTimeframe = useMemo(() => {
    const rows = chartConfig?.rows
    if (!rows) return 0

    const timeframes = rows.map((row) => Number(row.config.timeFrame))
    const minTimeframe = Math.min(...timeframes)

    return minTimeframe
  }, [chartConfig])

  const [getChartData] = useStatisticsQuerySensorsWithFieldsLazyQuery({
    pollInterval: minimumTimeframe > 0 ? minimumTimeframe * 60 * 60 * 1000 : 0
  })

  const fetchData = async () => {
    if (chartConfig) {
      const rows = chartConfig.rows
      if (!rows) return

      // "last" function rows will use real-time data
      const aggregationRows = rows.filter((row) => row.config.function !== 'last')

      if (aggregationRows.length === 0) {
        setData([])
        return
      }

      const results = await Promise.allSettled(
        aggregationRows.map(async (row) => {
          return getChartData({
            variables: {
              sensors: {
                sensors: [
                  {
                    key: row.instance.uid,
                    values: [row.parameter.denotation]
                  }
                ]
              },
              request: {
                from: new Date(Date.now() - Number(row.config.timeFrame) * 60 * 60 * 1000).toISOString(),
                aggregateMinutes: Number(row.config.timeFrame) * 60 * 1000,
                operation: row.config.function as StatisticsOperation
              }
            }
          })
        })
      )

      const parsedData = results.map((result) => {
        if (result.status === 'fulfilled' && result.value.data?.statisticsQuerySensorsWithFields.length! > 0) {
          return result.value.data?.statisticsQuerySensorsWithFields
        } else {
          const sensor = result.status === 'fulfilled' ? result.value.variables?.sensors?.sensors[0]! : null
          console.error('Failed to fetch data for sensor', sensor)
          console.error('Fetch error:', result.status === 'rejected' ? result.reason : 'Empty data')
          return null
        }
      })

      const newData = aggregationRows.map((row, index) => {
        const parsed = parsedData[index]
        if (!parsed) return null

        const parsedValue = parsed[0]?.data ? JSON.parse(parsed[0].data) : null
        const value = parsedValue ? parsedValue[row.parameter.denotation] : undefined

        if (value === undefined) {
          return null
        }

        return {
          rowIndex: rows.findIndex((r) => r === row), // Store the original row index
          data: {
            id: row.config.name,
            measures: [value],
            markers: row.config.markers,
            ranges: row.config.ranges ? row.config.ranges.flatMap((range) => [range.min, range.max]) : [0, 0]
          }
        }
      })

      setData(newData.filter(Boolean))
    }
  }

  useEffect(() => {
    if (chartConfig) {
      fetchData()
    }
  }, [chartConfig])

  useEffect(() => {
    if (props.configuration) {
      // Safe parse does not throw an error and we can leverage its success property
      const parsedConfig = bulletChartBuilderSchema.safeParse(props.configuration.visualizationConfig)
      if (parsedConfig.success) {
        setChartConfig(parsedConfig.data)
      } else {
        setError('Failed to parse configuration')
        console.error('Failed to parse configuration', parsedConfig.error)
      }
    }
  }, [props.configuration])

  const isLoading = !chartConfig || !data

  return (
    <BaseCard<BulletCardConfig>
      {...props}
      isLoading={isLoading}
      error={error}
      visualizationType="bullet"
      cardTitle={chartConfig?.cardTitle}
      configuration={chartConfig!}
    >
      <div className="flex h-full w-full flex-col justify-evenly gap-1">
        {chartConfig?.rows?.map((row, index) => {
          if (row.config.function === 'last') {
            return (
              <div className="h-full max-h-[70px] w-full overflow-hidden">
                <BulletRow key={index} row={row} editModeEnabled={props.editModeEnabled} />
              </div>
            )
          }

          const rowData = data.find((d) => d.rowIndex === index)?.data
          return <BulletRow key={index} row={row} aggregatedData={rowData} editModeEnabled={props.editModeEnabled} />
        })}
      </div>
    </BaseCard>
  )
}

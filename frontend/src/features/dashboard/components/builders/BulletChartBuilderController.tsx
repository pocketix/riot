import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { StatisticsOperation, useStatisticsQuerySensorsWithFieldsLazyQuery } from '@/generated/graphql'
import { BulletCardConfig } from '@/schemas/dashboard/BulletChartBuilderSchema'
import { BuilderResult } from '@/types/dashboard/gridItem'
import { useInstances } from '@/context/InstancesContext'
import { Datum } from '@nivo/bullet'
import { BulletChartBuilderView } from './BulletChartBuilderView'

type BulletChartBuilderResult = BuilderResult<BulletCardConfig>

export interface BulletChartBuilderControllerProps {
  onDataSubmit: (data: BulletChartBuilderResult) => void
  config?: BulletCardConfig
}

export function BulletChartBuilderController({ onDataSubmit, config }: BulletChartBuilderControllerProps) {
  const { getInstanceByUid, getInstanceById, getInstanceParameters } = useInstances()
  const [getChartData] = useStatisticsQuerySensorsWithFieldsLazyQuery()
  const [data, setData] = useState<Datum[]>([])
  const [smartRangeDialog, setSmartRangeDialog] = useState<{ open: boolean; rowIndex: number | null }>({
    open: false,
    rowIndex: null
  })

  // Initialize rows from config or start with empty data array
  useEffect(() => {
    if (config) {
      config.rows.forEach((rowData, index) => {
        fetchRowData(index, rowData)
      })
    }
  }, [config])

  const generateRangesAndTarget = async (rowData: BulletCardConfig['rows'][number]) => {
    if (!rowData?.instance?.uid || !rowData?.parameter?.denotation) {
      // should not happen, but we cannot fetch without this,
      // the checkRowAndFetch function should prevent this
      toast.error('Please select an instance and parameter first')
      return null
    }

    toast.loading('Analyzing parameter data...', { id: 'range-generator' })

    try {
      // Fetch min, max, and avg values for the parameter,
      // these values are fetched with doubled time frame compared to the one set in the config
      const results = await Promise.allSettled([
        // Min
        getChartData({
          variables: {
            sensors: {
              sensors: [{ key: rowData.instance.uid, values: [rowData.parameter.denotation] }]
            },
            request: {
              from: new Date(Date.now() - Number(rowData.config.timeFrame!) * 2 * 60 * 60 * 1000).toISOString(),
              aggregateMinutes: Number(rowData.config.timeFrame!) * 2 * 60 * 1000,
              operation: StatisticsOperation.Min
            }
          }
        }),
        // Max
        getChartData({
          variables: {
            sensors: {
              sensors: [{ key: rowData.instance.uid, values: [rowData.parameter.denotation] }]
            },
            request: {
              from: new Date(Date.now() - Number(rowData.config.timeFrame!) * 2 * 60 * 60 * 1000).toISOString(),
              aggregateMinutes: Number(rowData.config.timeFrame!) * 2 * 60 * 1000,
              operation: StatisticsOperation.Max
            }
          }
        }),
        // Mean
        getChartData({
          variables: {
            sensors: {
              sensors: [{ key: rowData.instance.uid, values: [rowData.parameter.denotation] }]
            },
            request: {
              from: new Date(Date.now() - Number(rowData.config.timeFrame!) * 2 * 60 * 60 * 1000).toISOString(),
              aggregateMinutes: Number(rowData.config.timeFrame!) * 2 * 60 * 1000,
              operation: StatisticsOperation.Mean
            }
          }
        })
      ])

      const minResult =
        results[0].status === 'fulfilled' ? results[0].value.data?.statisticsQuerySensorsWithFields[0]?.data : null
      const maxResult =
        results[1].status === 'fulfilled' ? results[1].value.data?.statisticsQuerySensorsWithFields[0]?.data : null
      const meanResult =
        results[2].status === 'fulfilled' ? results[2].value.data?.statisticsQuerySensorsWithFields[0]?.data : null

      if (!minResult || !maxResult || !meanResult) {
        toast.error('Not enough data to suggest ranges', { id: 'range-generator' })
        return null
      }

      const minValue = JSON.parse(minResult)[rowData.parameter.denotation]
      const maxValue = JSON.parse(maxResult)[rowData.parameter.denotation]
      const meanValue = JSON.parse(meanResult)[rowData.parameter.denotation]

      if (minValue === undefined || maxValue === undefined || meanValue === undefined) {
        toast.error('Could not extract parameter values', { id: 'range-generator' })
        return null
      }

      const totalRange = maxValue - minValue

      // Either 10% of the total range, or 5% of the mean value
      // handles cases where the ranges for min,max,mean are identical, such as voltage for some devices
      const buffer = Math.max(totalRange * 0.1, Math.abs(meanValue) * 0.05)

      // custom rounding function as the data can differ in precision
      const round = (value: number) => {
        const precision = totalRange > 100 ? 0 : totalRange > 10 ? 1 : 2
        return Number(value.toFixed(precision))
      }

      const roundedMin = round(minValue - buffer)

      // get the size of a single range, we want 3 ranges
      const rangeSize = round((maxValue + buffer - roundedMin) / 3)

      const ranges = [
        { min: roundedMin, max: round(roundedMin + rangeSize) },
        { min: round(roundedMin + rangeSize), max: round(roundedMin + 2 * rangeSize) },
        { min: round(roundedMin + 2 * rangeSize), max: round(maxValue + buffer) }
      ]

      // Target somewhere between the max and the mean
      const target = round(meanValue + (maxValue - meanValue) * 0.7)
      const markers = [target]

      toast.success('Ranges generated successfully!', { id: 'range-generator' })

      return {
        ranges,
        markers,
        minValue: roundedMin,
        maxValue: round(maxValue + buffer)
      }
    } catch (error) {
      console.error('Error generating ranges:', error)
      toast.error('Failed to generate ranges', { id: 'range-generator' })
      return null
    }
  }

  const fetchRowData = async (rowIndex: number, row: BulletCardConfig['rows'][number]) => {
    if (!row || !row.instance.uid || !row.parameter.denotation) return

    try {
      // 'last' values are handled by the bulletRow component

      // other functions using statistics API
      const result = await getChartData({
        variables: {
          sensors: {
            sensors: [{ key: row.instance.uid, values: [row.parameter.denotation] }]
          },
          request: {
            from: new Date(Date.now() - Number(row.config.timeFrame) * 60 * 60 * 1000).toISOString(),
            aggregateMinutes: Number(row.config.timeFrame) * 60 * 1000,
            operation: row.config.function as StatisticsOperation
          }
        }
      })

      if (result.data?.statisticsQuerySensorsWithFields.length! > 0) {
        const parsedValue = result.data?.statisticsQuerySensorsWithFields[0]?.data
          ? JSON.parse(result.data?.statisticsQuerySensorsWithFields[0].data)
          : null

        const value = parsedValue ? parsedValue[row.parameter.denotation] : undefined

        if (value !== undefined) {
          setData((prev) => {
            const newData = [...prev]
            newData[rowIndex] = {
              id: row.config.name || row.parameter.denotation,
              ranges: [
                ...(row.config.ranges || []).flatMap((range: { min: number; max: number }) => [range.min, range.max]),
                0,
                0
              ],
              measures: [value],
              markers: row.config.markers || []
            }
            return newData
          })
        }
      }
    } catch (error) {
      const instance = getInstanceByUid(row.instance.uid)
      toast.error(
        `Failed to fetch data for '${instance?.userIdentifier || row.instance.uid} - ${row.parameter.denotation}'`
      )
      console.error('Fetch error:', error)
    }
  }

  const checkRowAndFetch = async (rowIndex: number, rowData: BulletCardConfig['rows'][number]) => {
    // Check if row at index is valid and fetch data
    const valid =
      rowData?.instance?.uid &&
      rowData?.parameter?.denotation &&
      rowData?.config?.function &&
      (rowData.config.function !== 'last' ? rowData.config.timeFrame : true)

    // Do not trigger the dialog when the builder is opened in editor mode
    // for the already existing rows, or if there are some ranges already set for given row
    if (valid && (rowData.config.ranges?.length === 0 || rowData.config.ranges === undefined)) {
      setSmartRangeDialog({
        open: true,
        rowIndex
      })
    }

    if (valid) {
      try {
        // 'last' values are handled by the bulletRow component

        // other functions using statistics API
        const result = await getChartData({
          variables: {
            sensors: {
              sensors: [{ key: rowData.instance.uid, values: [rowData.parameter.denotation] }]
            },
            request: {
              from: new Date(Date.now() - Number(rowData.config.timeFrame) * 60 * 60 * 1000).toISOString(),
              aggregateMinutes: Number(rowData.config.timeFrame) * 60 * 1000,
              operation: rowData.config.function as StatisticsOperation
            }
          }
        })

        if (result.data?.statisticsQuerySensorsWithFields.length! > 0) {
          const parsedValue = result.data?.statisticsQuerySensorsWithFields[0]?.data
            ? JSON.parse(result.data?.statisticsQuerySensorsWithFields[0].data)
            : null

          const value = parsedValue ? parsedValue[rowData.parameter.denotation] : undefined

          if (value !== undefined) {
            setData((prev) => {
              const newData = [...prev]
              newData[rowIndex] = {
                id: rowData.config.name || rowData.parameter.denotation,
                ranges: [...(rowData.config.ranges || []).flatMap((range: any) => [range.min, range.max]), 0, 0],
                measures: [value],
                markers: rowData.config.markers || []
              }
              return newData
            })
            return true
          }
        }
        return false
      } catch (error) {
        const instance = getInstanceById(rowData.instance.id!)
        toast.error(
          `Failed to fetch data for '${instance?.userIdentifier || rowData.instance.uid} - ${rowData.parameter.denotation}'`
        )
        console.error('Fetch error:', error)
        return false
      }
    }
    return false
  }

  // This function handles 'data' changes as the nivo/bullet chart takes ranges/markers/measures from the data prop
  const handleBulletDataChange = (
    index: number,
    updatedData: {
      ranges?: number[]
      markers?: number[]
      measures?: number[]
      id?: string
    }
  ) => {
    setData((prev) => {
      if (!prev[index]) return prev

      const newData = [...prev]
      const { ranges, markers, measures, id } = updatedData

      if (ranges) newData[index].ranges = ranges
      if (markers) newData[index].markers = markers
      if (measures) newData[index].measures = measures
      if (id) newData[index].id = id.trim()

      return newData
    })
  }

  const getParameterOptions = (instanceID: number | null) => {
    if (!instanceID) return []
    const instance = getInstanceById(instanceID)
    if (!instance) return []
    return getInstanceParameters(instance.id).filter((param) => param.type === 'NUMBER')
  }

  const handleSubmit = (values: BulletCardConfig) => {
    const result: BulletChartBuilderResult = {
      config: values,
      sizing: {
        minH: 5,
        h: Math.max(values.rows.length * 3 + 2, 4),
        w: 2
      }
    }
    onDataSubmit(result)
  }

  const handleRemoveRow = (index: number) => {
    setData((prevData) => {
      const newData = [...prevData]
      newData.splice(index, 1)
      return newData
    })
  }

  return (
    <BulletChartBuilderView
      chartData={data}
      config={config}
      onSubmit={handleSubmit}
      onCheckRowAndFetch={checkRowAndFetch}
      onGenerateRangesAndTarget={generateRangesAndTarget}
      onBulletDataChange={handleBulletDataChange}
      onRemoveRow={handleRemoveRow}
      getParameterOptions={getParameterOptions}
      smartRangeDialog={smartRangeDialog}
      onSmartRangeDialogChange={setSmartRangeDialog}
    />
  )
}

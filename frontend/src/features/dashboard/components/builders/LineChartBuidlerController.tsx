import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useStatisticsQuerySensorsWithFieldsLazyQuery, SdParameterType, StatisticsOperation } from '@/generated/graphql'
import { ChartCardConfig } from '@/schemas/dashboard/visualizations/LineChartBuilderSchema'
import { BuilderResult } from '@/types/dashboard/gridItem'
import { LineChartBuilderView } from './LineChartBuilderView'
import { SelectedParameters } from './components/multi-select-parameter'
import { useInstances } from '@/context/InstancesContext'
import { Serie } from '@nivo/line'

type LineBuilderResult = BuilderResult<ChartCardConfig>

export interface LineChartBuilderProps {
  onDataSubmit: (data: LineBuilderResult) => void
  config?: ChartCardConfig
}

export function LineChartBuilderController({ onDataSubmit, config }: LineChartBuilderProps) {
  const { getInstanceParameters } = useInstances()
  const [getChartData] = useStatisticsQuerySensorsWithFieldsLazyQuery()
  const [chartData, setChartData] = useState<Serie[]>([])
  const [usedParamsByInstance, setUsedParamsByInstance] = useState<{
    [instanceID: number]: Array<{ parameter: { id: number; denotation: string; row: number } }>
  }>({})

  const fetchData = async (
    instances: ChartCardConfig['instances'],
    timeFrame: ChartCardConfig['timeFrame'],
    aggregateMinutes: ChartCardConfig['aggregateMinutes']
  ) => {
    if (instances.length === 0) return

    // Filter out instances without UIDs or parameters
    const validInstances = instances.filter(
      (instance) => instance.uid && instance.parameters && instance.parameters.length > 0
    )

    if (validInstances.length === 0) {
      setChartData([])
      return
    }

    const sensors = validInstances.map((instance: { uid: string; parameters: { denotation: string }[] }) => ({
      key: instance.uid,
      values: instance.parameters.map((param) => param.denotation)
    }))

    const request = {
      from: new Date(Date.now() - Number(timeFrame) * 60 * 60 * 1000).toISOString(),
      aggregateMinutes: aggregateMinutes,
      operation: StatisticsOperation.Last
    }

    try {
      const result = await getChartData({
        variables: {
          sensors: { sensors },
          request
        }
      })

      if (!result.data) {
        console.warn('No data returned from data fetch')
        return
      }

      const newData: Serie[] = []

      validInstances.forEach((instance) => {
        const sensorDataArray = result.data?.statisticsQuerySensorsWithFields.filter(
          (item: any) => item.deviceId === instance.uid
        )

        if (sensorDataArray?.length === 0) return

        // process each param
        instance.parameters.forEach((param: any) => {
          if (!sensorDataArray) return

          const dataPoints =
            sensorDataArray.length > 0
              ? sensorDataArray
                  .map((sensorData: any) => {
                    const parsedData = sensorData.data ? JSON.parse(sensorData.data) : null
                    if (!parsedData || parsedData[param.denotation] === undefined) return null
                    return {
                      x: sensorData.time,
                      y: parsedData[param.denotation]
                    }
                  })
                  .filter((point): point is { x: any; y: any } => point !== null)
              : []

          const paramData: Serie = {
            id: param.id + ' ' + instance.id,
            data: dataPoints
          }

          if (paramData.data.length > 0) {
            newData.push(paramData)
          } else {
            console.warn(`No data for parameter ${param.denotation} in instance ${instance.uid}`)
          }
        })
      })

      setChartData(newData)
    } catch (error) {
      console.error('Error fetching chart data:', error)
      toast.error('Failed to fetch chart data')
    }
  }

  const fetchRowData = async (
    rowIndex: number,
    config: ChartCardConfig,
    instance: ChartCardConfig['instances'][number]
  ) => {
    if (!instance?.uid || !instance?.parameters?.length) {
      fetchData(config.instances, config.timeFrame, config.aggregateMinutes)
      return
    }

    const request = {
      from: new Date(Date.now() - Number(config.timeFrame) * 60 * 60 * 1000).toISOString(),
      aggregateMinutes: config.aggregateMinutes,
      operation: StatisticsOperation.Last
    }

    try {
      const result = await getChartData({
        variables: {
          sensors: {
            sensors: [
              {
                key: instance.uid,
                values: instance.parameters.map((param: any) => param.denotation)
              }
            ]
          },
          request
        }
      })

      if (result.data) {
        const sensorDataArray = result.data.statisticsQuerySensorsWithFields.filter(
          (item: any) => item.deviceId === instance.uid
        )

        let newRowData: Serie[] = []

        instance.parameters.forEach((param: any) => {
          const paramData: Serie = {
            id: param.id + ' ' + instance.id + ' ' + rowIndex,
            data:
              sensorDataArray.length > 0
                ? sensorDataArray
                    .map((sensorData: any) => {
                      const parsedData = sensorData.data ? JSON.parse(sensorData.data) : null
                      if (!parsedData || parsedData[param.denotation] === undefined) return null
                      return {
                        x: sensorData.time,
                        y: parsedData[param.denotation]
                      }
                    })
                    .filter((point): point is { x: any; y: any } => point !== null)
                : []
          }

          if (paramData.data.length === 0) {
            toast.error(`No data available for ${param.denotation} in the selected time frame.`)
            return
          }

          newRowData.push(paramData)
        })

        setChartData((prevData) => {
          // remove any existing data for this row's parameters
          const filteredData = prevData.filter((item) => {
            const [_, instanceID, dataRow] = String(item.id).split(' ')
            return Number(instanceID) !== instance.id || dataRow !== rowIndex.toString()
          })

          return [...filteredData, ...newRowData]
        })
      }
    } catch (error) {
      toast.error(`Failed to fetch data for instance ${instance.uid}`)
      console.error('Fetch error:', error)
    }
  }

  const getParameterOptions = (instanceID: number | null) => {
    if (!instanceID) return []
    const parameters = getInstanceParameters(instanceID)
    if (!parameters) return []

    const numberParameters = parameters.filter((param) => param.type === SdParameterType.Number)
    return numberParameters
  }

  const handleInstanceSelectionChange = (index: number, prevInstance: ChartCardConfig['instances'][number]) => {
    if (prevInstance?.uid!) {
      clearRowData(index, prevInstance.id!)
    }
  }

  const handleRemoveInstance = (index: number, instance: ChartCardConfig['instances'][number]) => {
    clearRowData(index, instance?.id!)

    // Reindex the remaining rows in usedParamsByInstance as useFieldArray reindexes he instances
    setUsedParamsByInstance((prev) => {
      const newState = { ...prev }

      // For each instance
      Object.keys(newState).forEach((instanceID) => {
        // Update row indices for any row after the deleted one
        newState[Number(instanceID)] = newState[Number(instanceID)].map((item) => {
          if (item.parameter.row > index) {
            return {
              ...item,
              parameter: {
                ...item.parameter,
                row: item.parameter.row - 1
              }
            }
          }
          return item
        })
      })

      return newState
    })

    // Also update chart data IDs for rows that come after the deleted row
    setChartData((prev) => {
      return prev.map((item) => {
        const [parameterID, instanceID, dataRowStr] = String(item.id).split(' ')
        const dataRow = parseInt(dataRowStr)

        if (dataRow > index) {
          // Decrement the row index for rows after the deleted one, as useFieldArray does not touch data
          return {
            ...item,
            id: `${parameterID} ${instanceID} ${dataRow - 1}`
          }
        }
        return item
      })
    })
  }

  const clearRowData = (rowIndex: number, instanceID?: number) => {
    // If instanceID is provided, only clear that specific instance's data for this row
    // Otherwise, clear any data associated with this row index
    setChartData((prevData) => {
      return prevData.filter((item) => {
        const [_, dataInstanceID, dataRow] = String(item.id).split(' ')

        if (instanceID) {
          return !(Number(dataInstanceID) === instanceID && dataRow === rowIndex.toString())
        } else {
          return dataRow !== rowIndex.toString()
        }
      })
    })

    // Also clean up usedParamsByInstance
    if (instanceID) {
      setUsedParamsByInstance((prev) => {
        const newState = { ...prev }
        if (newState[instanceID]) {
          // Remove parameters for this row
          newState[instanceID] = newState[instanceID].filter((item) => item.parameter.row !== rowIndex)
        }
        return newState
      })
    } else {
      // Clear for any instance that might have data for this row
      setUsedParamsByInstance((prev) => {
        const newState = { ...prev }
        Object.keys(newState).forEach((instanceID) => {
          newState[Number(instanceID)] = newState[Number(instanceID)].filter((item) => item.parameter.row !== rowIndex)
        })
        return newState
      })
    }
  }

  // Check if the row has valid parameters and fetch/refetch data if possible
  const checkAndFetchRow = (
    rowIndex: number,
    instance: ChartCardConfig['instances'][number],
    config: ChartCardConfig
  ) => {
    if (!instance?.uid) return

    const allInstances = config.instances
    const allParamsForThisInstance = allInstances
      .filter((inst: any) => inst.id === instance.id && inst.parameters?.length > 0)
      .flatMap((inst: any) => inst.parameters.map((p: any) => p.id))

    if (instance.parameters?.length === 0) {
      // If there are no parameters, clear this row's data completely
      // handles combobox badge removal or complete clear
      clearRowData(rowIndex, instance.id!)
      return
    }

    // Clean up chart data before fetching
    setChartData((prevData) => {
      return prevData.filter((item) => {
        // Get parameter name and instance ID from the item ID
        const [paramID, dataInstanceID, dataRow] = String(item.id).split(' ')

        // If this is for a different instance or row, keep it
        if (Number(dataInstanceID) !== instance.id || dataRow !== rowIndex.toString()) return true

        // Only keep parameters that are used in ANY row
        return allParamsForThisInstance.includes(paramID)
      })
    })

    // Only fetch new data if this row has valid parameters
    const hasValidParameters = instance.parameters?.length > 0
    if (hasValidParameters) {
      fetchRowData(rowIndex, config, instance)
    }
  }

  const handleParameterChange = (
    value: SelectedParameters[],
    index: number,
    instance: ChartCardConfig['instances'][number],
    formValues: ChartCardConfig
  ): SelectedParameters[] => {
    const instanceID = instance.id
    if (!instanceID) return []

    const paramsOtherRows = Object.values(usedParamsByInstance[instanceID] || []).filter(
      (item) => item.parameter.row !== index
    )

    // Duplicate parameters break nivo chart as their data series have the same IDs
    // and also displaying the same data is redundant
    const duplicateParams = value.filter((param) =>
      paramsOtherRows.some((usedParam) => usedParam.parameter.id === param.id)
    )

    const filteredParams = value.filter((param: any) => !duplicateParams.some((dupParam) => dupParam.id === param.id))

    if (duplicateParams.length > 0) {
      toast.error(
        `${duplicateParams.map((param) => param.denotation).join(', ')} ${duplicateParams.length > 1 ? 'are' : 'is'} already used with this instance. Duplicate parameters were removed.`
      )
    }

    setUsedParamsByInstance((prev) => {
      const newState = { ...prev }
      if (!newState[instanceID]) {
        newState[instanceID] = []
      }

      // Remove any existing parameters for this row
      newState[instanceID] = newState[instanceID].filter((item) => item.parameter.row !== index)

      filteredParams.forEach((param: any) => {
        newState[instanceID].push({
          parameter: {
            id: param.id,
            denotation: param.denotation,
            row: index
          }
        })
      })

      return newState
    })

    const updatedInstance = {
      ...instance,
      parameters: filteredParams
    }

    // insert the updated instance
    const updatedConfig = {
      ...formValues,
      instances: [...formValues.instances.slice(0, index), updatedInstance, ...formValues.instances.slice(index + 1)]
    }

    checkAndFetchRow(index, updatedInstance, updatedConfig)
    return filteredParams
  }

  const handleSubmit = (values: ChartCardConfig) => {
    const result: LineBuilderResult = {
      config: values,
      sizing: {
        minH: 5,
        w: 2,
        h: 10 + (values.cardTitle ? 1 : 0)
      }
    }
    onDataSubmit(result)
  }

  const handleTimeFrameChange = (formValues: ChartCardConfig) => {
    fetchData(formValues.instances, formValues.timeFrame, formValues.aggregateMinutes)
  }

  useEffect(() => {
    if (config) {
      setChartData([])

      // Get the used parameters for each instance
      const initialUsedParams: {
        [instanceID: number]: Array<{ parameter: { id: number; denotation: string; row: number } }>
      } = {}

      setUsedParamsByInstance(initialUsedParams)

      // Fetch the instances using the fetchRowData function so that their
      // data is correctly indexed and can be manipulated by user in the builder
      config.instances.forEach((instance, index) => {
        if (instance.uid && instance.parameters && instance.parameters.length > 0) {
          if (instance.id && !initialUsedParams[instance.id]) {
            initialUsedParams[instance.id] = []
          }

          instance.parameters.forEach((param) => {
            if (instance.id) {
              initialUsedParams[instance.id].push({
                parameter: {
                  id: param.id,
                  denotation: param.denotation,
                  row: index
                }
              })
            }
          })

          fetchRowData(index, config, instance)
        }
      })
    }
  }, [config])

  return (
    <LineChartBuilderView
      chartData={chartData}
      config={config}
      onParameterChange={handleParameterChange}
      onInstanceSelectionChange={handleInstanceSelectionChange}
      onRemoveInstance={handleRemoveInstance}
      getParameterOptions={getParameterOptions}
      handleSubmit={handleSubmit}
      onTimeFrameChange={handleTimeFrameChange}
    />
  )
}

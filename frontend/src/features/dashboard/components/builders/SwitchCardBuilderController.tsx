import { useEffect, useState } from 'react'
import { SwitchCardConfig } from '@/schemas/dashboard/visualizations/SwitchBuilderSchema'
import { BuilderResult } from '@/types/dashboard/gridItem'
import { useInstances } from '@/context/InstancesContext'
import { useParameterSnapshot } from '@/hooks/useParameterSnapshot'
import { SwitchBuilderView } from './SwitchCardBuilderView'
import { SdParameterType, StatisticsOperation, useStatisticsQuerySensorsWithFieldsLazyQuery } from '@/generated/graphql'
import { toast } from 'sonner'

type SwitchBuilderResult = BuilderResult<SwitchCardConfig>

export interface SwitchCardBuilderControllerProps {
  onDataSubmit: (data: SwitchBuilderResult) => void
  config?: SwitchCardConfig
}

export function SwitchCardBuilderController(props: SwitchCardBuilderControllerProps) {
  const { getInstanceById, getInstanceParameters, getParameterByIds } = useInstances()
  const [fetchStats] = useStatisticsQuerySensorsWithFieldsLazyQuery()

  const [previewData, setPreviewData] = useState({
    isOn: false,
    percentage: 0
  })
  const [loading, setLoading] = useState(false)
  const [booleanSettings, setBooleanSettings] = useState<{
    instanceID: number
    parameterID: number
  }>({
    instanceID: -1,
    parameterID: -1
  })
  const [percentualSettings, setPercentualSettings] = useState<{
    instanceID: number
    parameterID: number
    lowerBound: number
    upperBound: number
  }>({
    instanceID: -1,
    parameterID: -1,
    lowerBound: 0,
    upperBound: 100
  })
  const { value } = useParameterSnapshot(booleanSettings.instanceID, booleanSettings.parameterID)
  const { value: percentageValue } = useParameterSnapshot(percentualSettings.instanceID, percentualSettings.parameterID)

  const fetchMinMaxForParameter = async (instanceID: number, parameterID: number) => {
    const instanceUID = getInstanceById(instanceID)?.uid
    const parameterDenotation = getParameterByIds(instanceID, parameterID)?.denotation
    const from = new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000)

    toast.loading('Getting min/max from the last 7 days...', { id: 'automatic-bounds' })

    if (!instanceUID || !parameterDenotation) {
      toast.error('Error occured, returning default values', { id: 'automatic-bounds' })
      return { min: 0, max: 100 }
    }

    const minPromise = fetchStats({
      variables: {
        sensors: {
          sensors: [{ key: instanceUID, values: [parameterDenotation] }]
        },
        request: {
          from: from.toISOString(),
          aggregateMinutes: from.getMinutes() * 1000,
          operation: StatisticsOperation.Min
        }
      }
    })

    const maxPromise = fetchStats({
      variables: {
        sensors: {
          sensors: [{ key: instanceUID, values: [parameterDenotation] }]
        },
        request: {
          from: from.toISOString(),
          aggregateMinutes: from.getMinutes() * 1000,
          operation: StatisticsOperation.Max
        }
      }
    })

    const [minResult, maxResult] = await Promise.allSettled([minPromise, maxPromise])

    let minFetched = 0
    let maxFetched = 100

    if (minResult.status === 'fulfilled' && minResult.value.data?.statisticsQuerySensorsWithFields?.[0]?.data) {
      const data = minResult.value.data.statisticsQuerySensorsWithFields[0].data
      minFetched = JSON.parse(data)[parameterDenotation] ?? minFetched
    }

    if (maxResult.status === 'fulfilled' && maxResult.value.data?.statisticsQuerySensorsWithFields?.[0]?.data) {
      const data = maxResult.value.data.statisticsQuerySensorsWithFields[0].data
      maxFetched = JSON.parse(data)[parameterDenotation] ?? maxFetched
    }

    toast.success('Boundaries based on the past 7 days set successfully!', { id: 'automatic-bounds' })
    setPercentualSettings((prev) => ({
      ...prev,
      lowerBound: minFetched,
      upperBound: maxFetched
    }))
    return { min: minFetched, max: maxFetched }
  }

  const handleStateParameterChange = async (instanceId: number, parameterId: number) => {
    if (!instanceId || !parameterId) return false

    setBooleanSettings({
      instanceID: instanceId,
      parameterID: parameterId
    })
  }

  const handlePercentageParameterChange = async (
    instanceId: number,
    parameterId: number,
    lowerBound: number,
    upperBound: number
  ) => {
    if (!instanceId || !parameterId) return false

    setPercentualSettings({
      instanceID: instanceId,
      parameterID: parameterId,
      lowerBound,
      upperBound
    })
  }

  useEffect(() => {
    if (value) {
      setLoading(true)
      const isOn = value as boolean
      setPreviewData((prev) => ({
        ...prev,
        isOn: !!isOn
      }))
      setLoading(false)
    }
  }, [value])

  useEffect(() => {
    if (percentageValue) {
      setLoading(true)
      const { lowerBound, upperBound } = percentualSettings

      const numValue = Number(percentageValue)

      const calculatedPercentage = ((numValue - lowerBound) / (upperBound - lowerBound)) * 100

      setPreviewData((prev) => ({
        ...prev,
        percentage: Math.round(calculatedPercentage)
      }))
      setLoading(false)
    }
  }, [percentageValue, percentualSettings])

  const getParameterOptions = (instanceId: number | null, filter: 'number' | 'boolean') => {
    if (!instanceId) return []
    const instance = getInstanceById(instanceId)
    if (!instance) return []
    const instanceParams = getInstanceParameters(instance.id)
    if (!instanceParams) return []
    const filteredParams = instanceParams.filter((param) => {
      if (filter === 'number') {
        return param.type === SdParameterType.Number
      } else if (filter === 'boolean') {
        return param.type === SdParameterType.Boolean
      }
      return false
    })
    return filteredParams
  }

  const handleSubmit = (values: SwitchCardConfig) => {
    const result: SwitchBuilderResult = {
      config: values,
      sizing: {
        minH: 3,
        h: 3,
        w: 1
      }
    }

    props.onDataSubmit(result)
  }

  return (
    <SwitchBuilderView
      config={props.config}
      onSubmit={handleSubmit}
      onStateParameterChange={handleStateParameterChange}
      onPercentageParameterChange={handlePercentageParameterChange}
      getParameterOptions={getParameterOptions}
      getBounds={fetchMinMaxForParameter}
      getInstanceName={(instanceID: number | null) => getInstanceById(instanceID!)?.userIdentifier || null}
      previewData={previewData}
      isLoading={loading}
    />
  )
}

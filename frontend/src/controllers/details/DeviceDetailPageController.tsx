import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  SdInstancesDocument,
  SdInstancesWithParamsDocument,
  SdInstancesWithTypeAndSnapshotDocument,
  SdParameterType,
  StatisticsOperation,
  useSdTypeParametersQuery,
  useStatisticsQuerySensorsWithFieldsQuery,
  useUpdateUserIdentifierOfSdInstanceMutation
} from '@/generated/graphql'
import { DeviceDetailPageProps, DeviceDetailPageView } from '@/views/DeviceDetailView'
import { useInstances } from '@/context/InstancesContext'
import { useInstanceWithKPIs } from '@/hooks/useInstanceWithKPIs'
import { useFormattedLastUpdated } from '@/hooks/useLastUpdated'
import { toast } from 'sonner'

export const DeviceDetailPageController = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  if (!id) {
    useEffect(() => {
      navigate('/devices')
    }, [navigate])
    return null
  }

  const { instance, isLoading: instanceLoading, error: instanceError } = useInstanceWithKPIs(undefined, Number(id))

  const { getInstanceGroups } = useInstances()
  const instanceGroups = useMemo(() => {
    if (!instance?.id) return []
    return getInstanceGroups(instance.id)
  }, [instance?.id, getInstanceGroups])

  const [selectedParameter, setSelectedParameter] = useState<string | null>(null)
  const [timeFrame, setTimeFrame] = useState<string>('24')

  const { data: parametersData, loading: parametersLoading } = useSdTypeParametersQuery({
    variables: { sdTypeId: instance?.type.id! },
    skip: !instance?.type?.id
  })

  const [saveUserIdentifier] = useUpdateUserIdentifierOfSdInstanceMutation({
    onCompleted: () => {
      toast.success('Device updated!', { id: 'device-update' })
    },
    refetchQueries: [
      {
        query: SdInstancesDocument
      },
      {
        query: SdInstancesWithTypeAndSnapshotDocument
      },
      {
        query: SdInstancesWithParamsDocument
      }
    ],
    onError: (error) => {
      toast.error('Failed to update device...', { id: 'device-update' })
      console.error('Failed to update user identifier: ', error)
    }
  })

  const handleUserIdentifierChange = async (newUserIdentifier: string) => {
    if (!instance) return
    toast.loading('Updating device...', { id: 'device-update' })
    await saveUserIdentifier({
      variables: {
        id: instance.id,
        newUserIdentifier: newUserIdentifier
      }
    })
  }

  const currentParameter = useMemo(() => {
    return selectedParameter || parametersData?.sdType.parameters[0]?.denotation || null
  }, [selectedParameter, parametersData?.sdType.parameters])

  const wholeParameter = useMemo(
    () => parametersData?.sdType.parameters.find((param) => param.denotation === currentParameter),
    [parametersData?.sdType.parameters, currentParameter]
  )

  const queryVariables = useMemo(() => {
    if (!instance?.uid || !currentParameter || !wholeParameter) {
      return null
    }

    const isNumberType = wholeParameter.type === SdParameterType.Number
    const fromTime = new Date(new Date().getTime() - Number(timeFrame) * 60 * 60 * 1000).toISOString()

    return {
      sensors: {
        sensors: [
          {
            key: instance.uid,
            values: [currentParameter]
          }
        ]
      },
      request: {
        from: fromTime,
        aggregateMinutes: isNumberType ? Math.ceil(Number(timeFrame)) : 0,
        operation: StatisticsOperation.Last
      }
    }
  }, [instance?.uid, currentParameter, wholeParameter, timeFrame])

  const { data: chartData, loading: chartLoading } = useStatisticsQuerySensorsWithFieldsQuery({
    variables: queryVariables!,
    skip: !queryVariables
  })

  const processedChartData = useMemo(() => {
    if (!chartData || !currentParameter || !instance) return []

    const sensorDataArray = chartData.statisticsQuerySensorsWithFields.filter((item) => item.deviceId === instance.uid)

    if (sensorDataArray.length === 0) return []

    const sortedSensorDataArray = sensorDataArray.sort(
      (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
    )

    return [
      {
        id: wholeParameter?.id + ' ' + instance.id,
        data: sortedSensorDataArray
          .map((sensorData) => {
            const parsedData = sensorData.data ? JSON.parse(sensorData.data) : null
            return {
              x: sensorData.time,
              y: parsedData?.[currentParameter] ?? null
            }
          })
          .filter((point) => point.y !== null)
      }
    ]
  }, [chartData, instance, currentParameter])

  useEffect(() => {
    setSelectedParameter(null)
  }, [Number(id)])

  const lastUpdatedTimestamp = useFormattedLastUpdated(Number(id))

  const viewProps: DeviceDetailPageProps = {
    instance,
    groups: instanceGroups,
    lastUpdated: lastUpdatedTimestamp,

    parameters: parametersData?.sdType.parameters || [],
    currentParameter: wholeParameter || null,

    chartData: processedChartData,

    onUserIdentifierChange: handleUserIdentifierChange,

    selectedParameter,
    setSelectedParameter,
    timeFrame,
    setTimeFrame,

    isLoading: instanceLoading || parametersLoading,
    isChartLoading: chartLoading,
    error: instanceError
  }

  return <DeviceDetailPageView {...viewProps} />
}

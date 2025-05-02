import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  SdInstancesDocument,
  SdInstancesWithParamsDocument,
  SdInstancesWithTypeAndSnapshotDocument,
  SdParameterType,
  StatisticsOperation,
  StatisticsQuerySensorsWithFieldsQuery,
  useStatisticsQuerySensorsWithFieldsLazyQuery,
  useUpdateUserIdentifierOfSdInstanceMutation
} from '@/generated/graphql'
import { DeviceDetailPageProps, DeviceDetailPageView } from '@/views/DeviceDetailView'
import { Instance, useInstances } from '@/context/InstancesContext'
import { useInstanceWithKPIs } from '@/hooks/useInstanceWithKPIs'
import { useFormattedLastUpdated } from '@/hooks/useLastUpdated'
import { toast } from 'sonner'
import { Serie } from '@nivo/line'
import { DeviceDetailSchemaType } from '@/schemas/DeviceDetailSchema'

export const DeviceDetailPageController = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    if (!id) navigate('/devices')
  }, [id])

  const { instance, isLoading: instanceLoading, error: instanceError } = useInstanceWithKPIs(undefined, Number(id))
  const { getInstanceGroups, getParameterByIds, getInstanceParameters, getInstanceById } = useInstances()
  const [comparisonData, setComparisonData] = useState<Serie[]>([])
  const [mainData, setMainData] = useState<Serie[]>([])
  const [isLoadingMain, setIsLoadingMain] = useState(false)
  const [isLoadingComparison, setIsLoadingComparison] = useState(false)
  const [fetchData] = useStatisticsQuerySensorsWithFieldsLazyQuery()

  const instanceGroups = useMemo(() => {
    if (!instance?.id) return []
    return getInstanceGroups(instance.id)
  }, [instance?.id, getInstanceGroups])

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

  const getParameterType = (instanceID: number, parameterID: number): SdParameterType | undefined => {
    const parameter = getParameterByIds(instanceID, parameterID)
    return parameter?.type
  }

  const processData = (
    isComparison: boolean,
    result: StatisticsQuerySensorsWithFieldsQuery['statisticsQuerySensorsWithFields'],
    instancePassed: Instance,
    parameter: DeviceDetailSchemaType['parameter']
  ) => {
    if (!result || result.length === 0) {
      toast.error(`No data found for device ${instancePassed.userIdentifier} and parameter ${parameter.denotation}`)
      if (isComparison) {
        setComparisonData([])
      } else {
        setMainData([])
      }
      return null
    }

    const sensorData = result
      .filter((item) => item.deviceId === instancePassed.uid)
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())

    if (sensorData.length === 0) {
      toast.error(`No data found for device ${instancePassed.userIdentifier} and parameter ${parameter.denotation}`)
      if (isComparison) {
        setComparisonData([])
      } else {
        setMainData([])
      }
      return null
    }

    const processed = {
      id: parameter.id + ' ' + instancePassed.id,
      data: sensorData
        .map((sensorData) => {
          const parsedData = sensorData.data ? JSON.parse(sensorData.data) : null
          return {
            x: sensorData.time,
            y: parsedData?.[parameter.denotation] ?? null
          }
        })
        .filter((point) => point.y !== null)
    }

    if (isComparison) {
      setComparisonData([processed])
    } else {
      setMainData([processed])
    }

    return processed
  }

  const fetchDeviceData = async (
    isComparison = false,
    from: Date,
    to: Date,
    instanceID: number,
    parameter: DeviceDetailSchemaType['parameter']
  ) => {
    try {
      if (isComparison) {
        setIsLoadingComparison(true)
        const paramType = getParameterType(instanceID, parameter.id!)
        const wholeInstance = getInstanceById(instanceID)
        const isNumberType = paramType === SdParameterType.Number
        const hoursDiff = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60))
        const queryVariables = {
          sensors: {
            sensors: [
              {
                key: wholeInstance?.uid!,
                values: [parameter.denotation]
              }
            ]
          },
          request: {
            from: from.toISOString(),
            to: to.toISOString(),
            aggregateMinutes: isNumberType ? hoursDiff : 0,
            operation: StatisticsOperation.Last
          }
        }

        const { data } = await fetchData({ variables: queryVariables })
        processData(true, data?.statisticsQuerySensorsWithFields!, wholeInstance!, parameter!)
      } else {
        setIsLoadingMain(true)
        const paramType = getParameterType(instance?.id!, parameter.id!)
        const isNumberType = paramType === SdParameterType.Number
        const hoursDiff = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60))
        const wholeInstance = getInstanceById(instanceID)
        const queryVariables = {
          sensors: {
            sensors: [
              {
                key: instance?.uid!,
                values: [parameter.denotation]
              }
            ]
          },
          request: {
            from: from.toISOString(),
            to: to.toISOString(),
            aggregateMinutes: isNumberType ? hoursDiff : 0,
            operation: StatisticsOperation.Last
          }
        }
        const { data } = await fetchData({ variables: queryVariables })
        processData(false, data?.statisticsQuerySensorsWithFields!, wholeInstance!, parameter!)
      }
      return true
    } catch (error) {
      console.error(`Error fetching ${isComparison ? 'comparison' : 'main'} data:`, error)
      toast.error(`Failed to fetch ${isComparison ? 'comparison' : 'device'} data`)
      return false
    } finally {
      if (isComparison) {
        setIsLoadingComparison(false)
      } else {
        setIsLoadingMain(false)
      }
    }
  }

  // Gets called repeatedly when user adjusts the form values, only fetches if possible
  const checkAndFetch = (isComparison: boolean, values: DeviceDetailSchemaType) => {
    if (isComparison) {
      const { instanceID, parameter, dateTimeRange } = values.comparison!
      if (!instanceID || !parameter?.id || !parameter?.denotation || !dateTimeRange?.start || !dateTimeRange?.end) {
        return
      }
      fetchDeviceData(true, dateTimeRange.start, dateTimeRange.end, instanceID, parameter)
    } else {
      const { parameter, dateTimeRange } = values
      if (!parameter?.id || !parameter?.denotation || !dateTimeRange?.start || !dateTimeRange?.end) {
        return
      }
      fetchDeviceData(false, dateTimeRange.start, dateTimeRange.end, instance?.id!, parameter)
    }
  }

  const clearComparisonData = () => {
    setComparisonData([])
  }

  const lastUpdatedTimestamp = useFormattedLastUpdated(Number(id))

  const getPrameterOptions = (instanceID: number | null) => {
    if (!instanceID) return []
    return getInstanceParameters(instanceID)
  }

  const viewProps: DeviceDetailPageProps = {
    instance,
    groups: instanceGroups,
    lastUpdated: lastUpdatedTimestamp,
    mainData,
    onUserIdentifierChange: handleUserIdentifierChange,

    isLoading: instanceLoading,
    error: instanceError,

    isLoadingMain,
    isLoadingComparison,

    getParameterOptions: getPrameterOptions,
    getParameterType: getParameterType,

    comparisonData,
    checkAndFetch,
    clearComparisonData
  }

  return <DeviceDetailPageView {...viewProps} />
}

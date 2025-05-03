import { useMediaQuery } from '@/hooks/useMediaQuery'
import { getIcon } from '@/utils/getIcon'
import { useMemo, useState, useEffect } from 'react'
import { Serie } from '@nivo/line'
import {
  SdParameterType,
  StatisticsOperation,
  useSdTypeParametersQuery,
  useStatisticsQuerySensorsWithFieldsQuery
} from '@/generated/graphql'
import { useDeviceDetail } from '@/context/DeviceDetailContext'
import { useNavigate } from 'react-router-dom'
import { DeviceModalDetailView, DeviceModalDetailViewProps } from './DeviceModalDetailView'
import { useInstanceWithKPIs } from '@/hooks/useInstanceWithKPIs'
import { useFormattedLastUpdated } from '@/hooks/useLastUpdated'
import { useInstances } from '@/context/InstancesContext'
import { useParameterSnapshot } from '@/hooks/useParameterSnapshot'

export const DeviceModalDetailController = () => {
  const { selectedDevice, isOpen, setIsOpen } = useDeviceDetail()
  const { instance } = useInstanceWithKPIs(undefined, selectedDevice?.instanceID)
  const { getInstanceGroups } = useInstances()
  const lastUpdated = useFormattedLastUpdated(instance?.id || -1)

  const isDesktop = useMediaQuery('(min-width: 768px)')
  const navigate = useNavigate()

  const [selectedParameter, setSelectedParameter] = useState<string | null>(null)
  const [timeFrame, setTimeFrame] = useState<string>('24')

  useEffect(() => {
    setSelectedParameter(null)
  }, [selectedDevice?.instanceID])

  const IconComponent = getIcon(instance?.type?.icon! || 'TbQuestionMark')

  const instanceGroups = useMemo(() => {
    if (!instance) return []
    return getInstanceGroups(instance.id)
  }, [instance, getInstanceGroups])

  const { data: parametersFetched } = useSdTypeParametersQuery({
    variables: { sdTypeId: instance?.type.id! },
    skip: !instance?.type?.id
  })

  const parameters = useMemo(() => {
    return parametersFetched?.sdType.parameters
  }, [parametersFetched])

  const currentParameter: string | null = useMemo(() => {
    return (
      selectedParameter || parameters?.find((param) => param.id === selectedDevice?.parameterID)?.denotation || null
    )
  }, [selectedParameter, selectedDevice?.parameterID, parameters])

  const wholeParameter = useMemo(
    () => parameters?.find((param) => param.denotation === currentParameter),
    [parameters, currentParameter]
  )

  const parameterLastValue = useParameterSnapshot(instance?.id!, wholeParameter?.id!)

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
            key: instance?.uid,
            values: [currentParameter]
          }
        ]
      },
      request: {
        from: fromTime,
        aggregateMinutes: isNumberType ? Math.ceil((Number(timeFrame) * 60) / 32) : 1,
        operation: StatisticsOperation.Last
      }
    }
  }, [selectedDevice?.instanceID, currentParameter, wholeParameter, timeFrame])

  const { data: graphData } = useStatisticsQuerySensorsWithFieldsQuery({
    variables: queryVariables!,
    skip: !queryVariables || !isOpen
  })

  const processedData: Serie[] = useMemo(() => {
    if (!graphData || !currentParameter || !instance) return []

    const sensorDataArray = graphData.statisticsQuerySensorsWithFields.filter((item) => item.deviceId === instance.uid)

    if (sensorDataArray.length === 0) return []

    const sortedSensorDataArray = sensorDataArray.sort(
      (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
    )

    return [
      {
        id: wholeParameter?.id + ' ' + instance?.id,
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
  }, [graphData, selectedDevice, currentParameter])

  const handleViewAllDetails = () => {
    setIsOpen(false)
    navigate(`/device/${instance?.id}`)
  }

  if (!instance) return null

  const viewProps: DeviceModalDetailViewProps = {
    selectedDevice,
    isOpen,
    setIsOpen,
    instance,
    parameters,
    setSelectedParameter,
    timeFrame,
    setTimeFrame,
    wholeParameter,
    isDesktop,
    lastUpdated,
    IconComponent,
    processedData,
    handleViewAllDetails,
    instanceGroups,
    parameterLastValue: parameterLastValue.value
  }

  return <DeviceModalDetailView {...viewProps} />
}

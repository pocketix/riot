import { useEffect, useMemo, useState } from 'react'
import { SequentialStatesCardConfig } from '@/schemas/dashboard/visualizations/SequentialStatesBuilderSchema'
import { BaseVisualizationCardProps } from '@/types/dashboard/cards/cardGeneral'
import { SequentialStatesCardView } from './SequentialStatesCardView'
import { Datum } from '@nivo/line'
import { useInstances } from '@/context/InstancesContext'
import { StatisticsOperation, useStatisticsQuerySensorsWithFieldsLazyQuery } from '@/generated/graphql'
import { useParameterSnapshot } from '@/hooks/useParameterSnapshot'

type SequentialStatesCardProps = BaseVisualizationCardProps<SequentialStatesCardConfig>

export const SequentialStatesCardController = (props: SequentialStatesCardProps) => {
  const { getInstanceById, getParameterByIds } = useInstances()
  const [data, setData] = useState<Datum[]>([])
  const [cardConfig, setCardConfig] = useState<SequentialStatesCardConfig>()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const wholeInstance = useMemo(() => {
    if (cardConfig?.instance.id) {
      return getInstanceById(cardConfig.instance.id)
    }
    return null
  }, [cardConfig?.instance.id, getInstanceById])

  const wholeParameter = useMemo(() => {
    if (cardConfig?.parameter.id) {
      return getParameterByIds(cardConfig?.instance.id!, cardConfig?.parameter.id!)
    }
    return null
  }, [cardConfig?.instance.id, cardConfig?.parameter.id, getParameterByIds])

  const dataInfo = {
    instanceName: wholeInstance?.userIdentifier || cardConfig?.instance.uid!,
    parameterName: wholeParameter?.label || cardConfig?.parameter.denotation!
  }

  //   TODO: consts
  const pollInterval = cardConfig?.timeFrame ? Number(cardConfig.timeFrame) * 60 * 60 * 1000 : 0
  const FETCHES_PER_TIMEFRAME = 4

  // Uses real-time updates as well, however, this part is quite tricky as the new data is available
  // only for a few seconds and the segment displaying it is small, this gets handled in the visualization itself
  const { value } = useParameterSnapshot(cardConfig?.instance.id!, cardConfig?.parameter.id!)
  const [getCardData, { data: fetchedCardData, loading: cardLoading }] = useStatisticsQuerySensorsWithFieldsLazyQuery({
    pollInterval: pollInterval / FETCHES_PER_TIMEFRAME
  })

  useEffect(() => {
    if (value !== null) {
      setData((prev) => {
        const newData = [...prev]
        newData.push({
          x: new Date().toISOString(),
          y: value as string
        })
        return newData
      })
    }
  }, [value])

  useEffect(() => {
    if (props.configuration) {
      setIsLoading(true)
      setError(null)
      setCardConfig(props.configuration.visualizationConfig)
    }
  }, [props.configuration])

  useEffect(() => {
    if (!cardConfig || !props.isVisible) return

    setIsLoading(true)

    const instance = cardConfig.instance
    const parameter = cardConfig.parameter

    const fromTime = new Date(Date.now() - Number(cardConfig.timeFrame) * 60 * 60 * 1000).toISOString()
    getCardData({
      variables: {
        sensors: { sensors: [{ key: instance.uid, values: [parameter.denotation] }] },
        request: {
          from: fromTime,
          aggregateMinutes: 1,
          operation: StatisticsOperation.Last
        }
      }
    })
  }, [cardConfig, props.isVisible])

  useEffect(() => {
    if (!cardConfig || !fetchedCardData) return

    const parameter = cardConfig.parameter
    let parsedData: Datum[] = []

    if (fetchedCardData.statisticsQuerySensorsWithFields?.length) {
      const items = fetchedCardData.statisticsQuerySensorsWithFields
      for (const item of items) {
        const parsed = item.data ? JSON.parse(item.data) : null
        if (parsed && parsed[parameter.denotation] !== undefined) {
          parsedData.push({
            x: item.time,
            y: parsed[parameter.denotation]
          })
        }
      }
    }

    setData(parsedData)
    setIsLoading(false)
  }, [fetchedCardData, cardConfig])

  return (
    <SequentialStatesCardView
      {...props}
      data={data}
      cardConfig={cardConfig}
      error={error}
      isLoading={isLoading || cardLoading}
      dataInfo={dataInfo}
    />
  )
}

import { useMemo, useState, useEffect, useRef } from 'react'
import { SwitchCardConfig, switchCardSchema } from '@/schemas/dashboard/visualizations/SwitchBuilderSchema'
import { BaseVisualizationCardProps } from '@/types/dashboard/cards/cardGeneral'
import { useParameterSnapshot } from '@/hooks/useParameterSnapshot'
import { SwitchCardView } from './SwitchCardView'

type SwitchCardProps = BaseVisualizationCardProps<SwitchCardConfig>

export const SwitchCardController = (props: SwitchCardProps) => {
  const [error, setError] = useState<string | null>(null)

  const switchConfig = useMemo(() => {
    if (props.configuration && props.isVisible) {
      const parsedConfig = switchCardSchema.safeParse(props.configuration.visualizationConfig)
      if (parsedConfig.success) {
        return parsedConfig.data
      } else {
        setError('Failed to parse configuration')
      }
    }
  }, [props.configuration, props.isVisible])

  const { value: stateValue } = useParameterSnapshot(
    switchConfig?.booleanSettings.instanceID!,
    switchConfig?.booleanSettings.parameter.id!
  )
  const { value: percentageValue } = useParameterSnapshot(
    switchConfig?.percentualSettings?.instanceID!,
    switchConfig?.percentualSettings?.parameter?.id!
  )

  const percentage = useMemo(() => {
    if (!switchConfig?.percentualSettings?.instanceID || percentageValue === undefined) return null

    const numValue = Number(percentageValue)
    if (isNaN(numValue)) return null

    const calculatedPercentage =
      ((numValue - switchConfig.percentualSettings.lowerBound!) /
        (switchConfig.percentualSettings.upperBound! - switchConfig.percentualSettings.lowerBound!)) *
      100

    return Math.round(calculatedPercentage)
  }, [
    percentageValue,
    switchConfig?.percentualSettings?.lowerBound,
    switchConfig?.percentualSettings?.upperBound,
    switchConfig?.percentualSettings?.instanceID
  ])

  const [internalIsOn, setInternalIsOn] = useState(() => stateValue)
  const [internalPercentage, setInternalPercentage] = useState(() => percentage)
  const prevStateValue = useRef(stateValue)
  const prevPercentageValue = useRef(percentage)
  const lastChangedByUser = useRef(false)
  const lastPercentageChangedByUser = useRef(false)

  useEffect(() => {
    if (stateValue !== prevStateValue.current) {
      setInternalIsOn(stateValue)
      prevStateValue.current = stateValue
      lastChangedByUser.current = false
    }
  }, [stateValue])

  useEffect(() => {
    if (percentage !== prevPercentageValue.current) {
      setInternalPercentage(percentage)
      prevPercentageValue.current = percentage
      lastPercentageChangedByUser.current = false
    }
  }, [percentageValue])

  const handleStateChange = (value: boolean) => {
    console.log('Command invocation would send:', value)
    setInternalIsOn(value)
    lastChangedByUser.current = true
  }

  const handlePercentualChange = (value: number) => {
    console.log('Command invocation would send: ', value)
    setInternalPercentage(value)
    if (!internalIsOn && value > 0) {
      setInternalIsOn(true)
    }
    if (value === 0) {
      setInternalIsOn(false)
    }
    lastPercentageChangedByUser.current = true
  }

  useEffect(() => {
    if (stateValue === undefined) {
      setError('Failed to load state data')
    } else if (
      percentageValue === undefined &&
      switchConfig?.percentualSettings?.instanceID &&
      switchConfig?.percentualSettings?.parameter?.id
    ) {
      setError('Failed to load percentage data')
    } else {
      setError(null)
    }
  }, [
    switchConfig?.percentualSettings?.instanceID,
    switchConfig?.percentualSettings?.parameter?.id,
    stateValue,
    percentageValue
  ])

  return (
    <SwitchCardView
      {...props}
      isOn={internalIsOn as boolean}
      percentage={internalPercentage as number}
      isLoading={false}
      error={error}
      switchConfig={props.configuration?.visualizationConfig}
      onPercentualChange={handlePercentualChange}
      onStateChange={handleStateChange}
    />
  )
}

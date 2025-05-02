import { useInstances } from '@/context/InstancesContext'
import { Serie } from '@nivo/line'
import { getColorBlindSchemeWithBW } from './color-schemes/color-impaired'
import { forwardRef } from 'react'
import { useDarkMode } from '@/context/DarkModeContext'
import { useDeviceDetail } from '@/context/DeviceDetailContext'

interface LineChartLegendProps {
  data: Serie[]
  className?: string
  disableDetailsOnClick?: boolean
}

type Legend = {
  instance: string
  parameter: string
  key: string
  color: string
  instanceID: number
  parameterID: number
}

export const LineChartLegend = forwardRef<HTMLDivElement, LineChartLegendProps>(
  ({ data, className, disableDetailsOnClick }: LineChartLegendProps, ref) => {
    const { isDarkMode } = useDarkMode()
    const { getInstanceById, getParameterByIds } = useInstances()
    const { setDetailsSelectedDevice } = useDeviceDetail()
    const colors = getColorBlindSchemeWithBW(isDarkMode)

    const parsedLegends = data.map((serie, index): Legend => {
      const [parameterID, instanceID] = String(serie.id).split(' ')
      const instance = getInstanceById(Number(instanceID))
      const parameter = getParameterByIds(Number(instanceID), Number(parameterID))

      const colorIndex = index % colors.length

      return {
        instance: instance ? `${instance.userIdentifier}` : instanceID,
        parameter: parameter ? `${parameter.label || parameter.denotation}` : parameterID,
        key: `${instanceID} ${parameterID}`,
        color: colors[colorIndex],
        instanceID: Number(instanceID),
        parameterID: Number(parameterID)
      }
    })

    // Sort the legends by instance and parameter for easier reading
    parsedLegends.sort((a, b) => a.instance.localeCompare(b.instance) || a.parameter.localeCompare(b.parameter))

    // We will only display the full instance name for the first legend of each instance
    let currentInstance: string | null = null
    const displayedLegends = parsedLegends.map((legend) => {
      const isFirstInstance = legend.instance !== currentInstance
      currentInstance = legend.instance
      const instanceName = isFirstInstance
        ? legend.instance
        : legend.instance
            .split(' ')
            .map((word) => word[0])
            .join('. ') + '.'
      const parameterName = legend.parameter
      return {
        ...legend,
        instance: instanceName,
        parameter: ` - ${parameterName}`
      }
    })

    const handleLegendClick = (legend: Legend) => {
      if (disableDetailsOnClick) return
      setDetailsSelectedDevice(legend.instanceID, legend.parameterID)
    }

    return (
      <div ref={ref} className={`flex flex-wrap justify-center gap-2 ${className}`}>
        {displayedLegends.map((legend: Legend) => (
          <div
            key={legend.key}
            className="flex cursor-pointer items-center gap-1"
            onClick={() => handleLegendClick(legend)}
          >
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: legend.color }}></div>
            <span className="text-xs font-semibold">{legend.instance}</span>
            <span className="text-xs">{legend.parameter}</span>
          </div>
        ))}
      </div>
    )
  }
)

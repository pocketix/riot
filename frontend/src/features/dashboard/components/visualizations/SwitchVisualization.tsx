import { memo, useState } from 'react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { IconType } from 'react-icons'
import { useLongPress } from '@/hooks/useLongPress'
import { SwitchDetailDialog } from './SwitchDetailDialog'
import { useDeviceDetail } from '@/context/DeviceDetailContext'
import { toast } from 'sonner'

export interface SwitchVisualizationProps {
  isOn: boolean
  percentage?: number | null
  title?: string
  booleanInfo?: {
    instanceID: number
    parameterID: number
  }
  allowPercentualChange?: boolean
  icon?: IconType | null
  isLoading?: boolean
  isError?: boolean
  className?: string
  onShortClick?: () => void
  onPercentualChange?: (value: number) => void
  onStateChange?: (value: boolean) => void
}

const SwitchVisualizationBase = (props: SwitchVisualizationProps) => {
  const [dialogOpen, setDialogOpen] = useState(false)
  const { setDetailsSelectedDevice } = useDeviceDetail()

  const longPressAttrs = useLongPress(
    () => {
      if (!props.allowPercentualChange) {
        toast.info('Percentual configuration was not provided for this switch, only the history can be viewed')
        setDetailsSelectedDevice(props.booleanInfo?.instanceID!, props.booleanInfo?.parameterID!)
        return
      }

      setDialogOpen(true)
    },
    () => {
      if (props.onStateChange) props.onStateChange(!props.isOn)
      if (props.onShortClick) props.onShortClick()
    },
    { threshold: 300, moveThreshold: 10 }
  )

  if (props.isError) {
    return (
      <div className={cn('flex h-full w-full items-center justify-center', props.className)}>
        <span className="text-sm font-semibold text-destructive">Unavailable</span>
      </div>
    )
  }

  return (
    <>
      <Card
        className={cn(
          'relative flex h-full w-full cursor-pointer select-none items-center overflow-hidden',
          props.className
        )}
        {...longPressAttrs}
      >
        <div
          className="absolute left-0 top-0 z-0 h-full bg-yellow-200 transition-all duration-500 ease-in-out"
          style={{
            width: props.isOn ? (props.percentage !== null ? `${props.percentage}%` : '100%') : '0%'
          }}
        />
        <div className="z-[1] flex h-full w-full items-center gap-2 px-4 py-2">
          {props.icon && (
            <span className="flex h-full w-6 flex-shrink-0 items-center justify-center">
              <props.icon
                className={`h-6 w-6 ${props.isOn ? 'text-yellow-700' : 'text-muted-foreground'} transition-all duration-300 ease-in-out`}
              />
            </span>
          )}
          <div className="flex min-w-0 flex-1 flex-col justify-center leading-tight">
            <span className="truncate whitespace-nowrap text-sm font-bold text-muted-foreground">{props.title}</span>
            <span className="truncate text-xs text-muted-foreground">
              {props.isOn ? 'ON' : 'OFF'} {props.percentage && props.isOn ? `| ${props.percentage}%` : ''}
            </span>
          </div>
        </div>
      </Card>
      <SwitchDetailDialog
        open={dialogOpen}
        setOpen={setDialogOpen}
        initialValue={props.percentage!}
        isOn={props.isOn}
        deviceDetail={props.booleanInfo}
        onPercentualChange={props.onPercentualChange}
        onStateChange={props.onStateChange}
      />
    </>
  )
}

export const SwitchVisualization = memo(SwitchVisualizationBase)

import { memo, CSSProperties, useMemo } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { useDeviceDetail } from '@/context/DeviceDetailContext'
import { useParameterSnapshot } from '@/hooks/useParameterSnapshot'
import { ResponsiveLineChart } from './ResponsiveLineChart'
import { EntityCardConfig } from '@/schemas/dashboard/visualizations/EntityCardBuilderSchema'
import { Serie } from '@nivo/line'
import { Switch } from '@/components/ui/switch'
import { ResponsiveTooltip } from '@/components/responsive-tooltip'
import { useInstances } from '@/context/InstancesContext'

export interface EntityRowData {
  sparklineData?: Serie[]
  value?: string | number
}

export interface ResponsiveEntityTableProps {
  config: EntityCardConfig
  sparklineData: Serie[]
  className?: string
  height?: number
  mock?: Boolean
}

const mockValue = 23

const ResponsiveEntityTableBase = ({ config, sparklineData, className, height, mock }: ResponsiveEntityTableProps) => {
  const { setDetailsSelectedDevice } = useDeviceDetail()

  const containerStyle: CSSProperties = height
    ? {
        height: `${height}px`,
        width: '100%',
        minWidth: 0,
        overflow: 'hidden',
        userSelect: 'none'
      }
    : {
        height: '100%',
        width: '100%',
        minWidth: 0,
        overflow: 'hidden',
        userSelect: 'none'
      }

  return (
    <div className={className || ''} style={containerStyle}>
      <table className="h-full w-full">
        <thead className="border-b-[2px]">
          <tr>
            <th className="text-md text-left">Name</th>
          </tr>
        </thead>
        <tbody>
          {config.rows.map((row, rowIndex) => (
            <EntityRow
              key={rowIndex}
              row={row}
              rowCount={config.rows.length}
              sparklineData={sparklineData[rowIndex]}
              mockValue={mock ? mockValue : undefined}
              onRowClick={() => setDetailsSelectedDevice(row.instance.id!, row.parameter.id)}
              mock={!!mock}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface EntityRowProps {
  row: EntityCardConfig['rows'][number]
  sparklineData?: Serie
  rowCount: number
  onRowClick: () => void
  mockValue?: number | string
  mock?: boolean
}

const EntityRow = memo(({ row, sparklineData, rowCount, onRowClick, mockValue, mock }: EntityRowProps) => {
  const { value: realValue } = useParameterSnapshot(row.instance?.id!, row.parameter?.id!)
  const { getParameterByIds, getInstanceById } = useInstances()

  const wholeParameter = getParameterByIds(row.instance?.id!, row.parameter?.id!)
  const value = mock ? mockValue : realValue

  const hasData = useMemo(() => {
    if (row.visualization === 'sparkline') {
      return sparklineData && sparklineData.data && sparklineData.data.length > 0
    }
    return value !== null && value !== undefined
  }, [row.visualization, sparklineData, value])

  if (!hasData) {
    return (
      <tr
        onClick={onRowClick}
        className="cursor-pointer hover:bg-muted/50"
        style={{ height: `calc(100% / ${rowCount})` }}
      >
        <td className="text-sm">{row.name}</td>
        <td className="h-[24px] w-[75px] text-center text-sm">
          <Skeleton className="flex h-full w-full items-center justify-center" disableAnimation>
            <ResponsiveTooltip
              content={
                <div className="flex flex-col items-center justify-center">
                  <span className="font-semibold text-destructive">No data available</span>
                  <span className="break-all text-xs">
                    Device: {getInstanceById(row.instance?.id!)?.userIdentifier || row.instance?.uid!}
                  </span>
                  <span className="break-words text-xs">
                    Parameter: {wholeParameter?.label || wholeParameter?.denotation || 'Unknown'}
                  </span>
                </div>
              }
            >
              <span className="truncate text-xs font-semibold text-destructive">Unavailable</span>
            </ResponsiveTooltip>
          </Skeleton>
        </td>
      </tr>
    )
  }

  return (
    <tr
      onClick={onRowClick}
      className="w-full cursor-pointer hover:bg-muted/50"
      style={{ height: `calc(100% / ${rowCount})` }}
    >
      <td className="text-sm">{row.name}</td>
      {row.visualization === 'sparkline' && (
        <td className="h-[24px] min-w-0 p-0">
          <div className="ml-auto flex h-full min-w-0 max-w-[150px] items-center justify-end gap-0.5 overflow-hidden">
            {row.showRealtime && (
              <span className="flex flex-shrink-0 items-start gap-0.5 pr-1 text-sm">
                {typeof value === 'number' ? Number((value as number).toFixed(row.decimalPlaces)) : String(value)}
                <span>{row.valueSymbol!}</span>
              </span>
            )}
            <div className="relative h-full min-w-[30px] max-w-[100px] flex-1">
              <div className="absolute inset-0">
                <ResponsiveLineChart data={[sparklineData!]} detailsOnClick={false} useSparklineMode={true} />
              </div>
            </div>
          </div>
        </td>
      )}

      {row.visualization === 'immediate' && (
        <td className="w-fit">
          <div className="flex justify-end gap-0.5 text-end text-sm">
            <span>{typeof value === 'number' ? Number(value.toFixed(row.decimalPlaces)) : String(value)}</span>
            <span>{row.valueSymbol!}</span>
          </div>
        </td>
      )}

      {row.visualization === 'switch' && (
        <td className="text-end text-sm">
          {/* command invocation on onCheckedChange - not setup */}
          <ResponsiveTooltip
            content={
              <div className="flex flex-col">
                <span className="break-words font-semibold text-destructive">Command actions not yet available</span>
                <span className="break-words text-xs">This button only displays the current state</span>
              </div>
            }
          >
            <Switch disabled={false} checked={Boolean(value)} className="cursor-not-allowed" />
          </ResponsiveTooltip>
        </td>
      )}
    </tr>
  )
})

export const ResponsiveEntityTable = memo(ResponsiveEntityTableBase)

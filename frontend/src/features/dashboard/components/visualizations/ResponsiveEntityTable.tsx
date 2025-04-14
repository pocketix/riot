import { memo, CSSProperties, useMemo } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useDeviceDetail } from '@/context/DeviceDetailContext'
import { useParameterSnapshot } from '@/hooks/useParameterSnapshot'
import { ResponsiveLineChart } from './ResponsiveLineChart'
import { EntityCardConfig } from '@/schemas/dashboard/EntityCardBuilderSchema'
import { Serie } from '@nivo/line'
import { Switch } from '@/components/ui/switch'

export interface EntityRowData {
  sparklineData?: Serie[]
  value?: string | number
}

export interface ResponsiveEntityTableProps {
  config: EntityCardConfig
  sparklineData: Record<string, Serie[]>
  className?: string
  height?: number
}

const ResponsiveEntityTableBase = ({ config, sparklineData, className, height }: ResponsiveEntityTableProps) => {
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
      <table className="h-fit w-full">
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
              sparklineData={sparklineData[`${row.instance?.id!}-${row.parameter?.id!}`]}
              onRowClick={() => setDetailsSelectedDevice(row.instance.id!, row.parameter.id)}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface EntityRowProps {
  row: EntityCardConfig['rows'][number]
  sparklineData?: Serie[]
  onRowClick: () => void
}

const EntityRow = memo(({ row, sparklineData, onRowClick }: EntityRowProps) => {
  const { value } = useParameterSnapshot(row.instance?.id!, row.parameter?.id!)

  const hasData = useMemo(() => {
    if (row.visualization === 'sparkline') {
      return sparklineData && sparklineData.length > 0 && sparklineData[0].data.length > 0
    }
    return value !== undefined
  }, [row.visualization, sparklineData, value])

  if (!hasData) {
    return (
      <tr onClick={onRowClick} className="cursor-pointer hover:bg-muted/50">
        <td className="text-sm">{row.name}</td>
        <td className="h-[24px] w-[75px] text-center text-sm">
          <Skeleton className="h-full w-full" disableAnimation>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="truncate text-xs font-semibold text-destructive">Unavailable</span>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="flex max-w-28 flex-col">
                    <span className="font-semibold text-destructive">No data available</span>
                    <span className="break-words text-xs">Device: {row.instance?.uid!}</span>
                    <span className="break-words text-xs">Parameter: {row.parameter?.denotation!}</span>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Skeleton>
        </td>
      </tr>
    )
  }

  return (
    <tr onClick={onRowClick} className="cursor-pointer hover:bg-muted/50">
      <td className="text-sm">{row.name}</td>

      {row.visualization === 'sparkline' && (
        <td className="h-[24px] w-[75px] min-w-0 text-end text-sm">
          <ResponsiveLineChart data={sparklineData!} detailsOnClick={false} useSparklineMode={true} />
        </td>
      )}

      {row.visualization === 'immediate' && (
        <td className="w-fit text-end text-sm">
          {typeof value === 'number' ? Number(value.toFixed(row.decimalPlaces)) : String(value)} {row.valueSymbol!}
        </td>
      )}

      {row.visualization === 'switch' && (
        <td className="text-end text-sm">
          {/* command invocation on onCheckedChange - not setup */}
          <Switch disabled={false} checked={Boolean(value)} className="cursor-not-allowed" />
        </td>
      )}
    </tr>
  )
})

export const ResponsiveEntityTable = memo(ResponsiveEntityTableBase)

import { memo, CSSProperties, useMemo } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { TableCardConfig } from '@/schemas/dashboard/TableBuilderSchema'
import { useDeviceDetail } from '@/context/DeviceDetailContext'
import { useParameterSnapshot } from '@/hooks/useParameterSnapshot'

export interface TableRowData {
  name: string
  instance: {
    uid: string
    id: number | null
  }
  parameter: {
    id: number | null
    denotation: string
  }
  values: Array<{
    function: string
    value?: number
  }>
}

export interface ResponsiveTableProps {
  className?: string
  data: TableRowData[]
  config: TableCardConfig
  onRowClick?: (instanceId: number, parameterId: number) => void
  height?: number
}

const ResponsiveTableBase = ({ className, data, config, onRowClick, height }: ResponsiveTableProps) => {
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

  const handleRowClick = (instanceId: number | null, parameterId: number | null) => {
    if (onRowClick && instanceId !== null && parameterId !== null) {
      onRowClick(instanceId, parameterId)
      return
    }

    setDetailsSelectedDevice(instanceId!, parameterId)
  }

  return (
    <div className={className || ''} style={containerStyle}>
      <table className="h-fit w-full">
        <thead className="border-b-[2px]">
          <tr>
            <th className="text-md text-left">{config.tableTitle}</th>
            {config.columns.map((column, index) => (
              <th key={index} className="text-center text-xs">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <TableRow
              key={rowIndex}
              row={row}
              config={config}
              onRowClick={handleRowClick}
              columnsConfig={config.columns}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface TableRowProps {
  row: TableRowData
  config: TableCardConfig
  onRowClick: (instanceId: number | null, parameterId: number | null) => void
  columnsConfig: TableCardConfig['columns']
}

const TableRow = memo(({ row, config, onRowClick, columnsConfig }: TableRowProps) => {
  return (
    <tr onClick={() => onRowClick(row.instance?.id, row.parameter.id)} className="cursor-pointer hover:bg-muted/50">
      <td className="text-sm">{row.name}</td>
      {columnsConfig.map((column, columnIndex) => (
        <TableCell
          key={columnIndex}
          column={column}
          row={row}
          columnIndex={columnIndex}
          decimalPlaces={config.decimalPlaces}
        />
      ))}
    </tr>
  )
})

interface TableCellProps {
  column: TableCardConfig['columns'][number]
  row: TableRowData
  columnIndex: number
  decimalPlaces: number
}

// Has to be a separate component in order to use the snapshot hooks
const TableCell = memo(({ column, row, columnIndex, decimalPlaces }: TableCellProps) => {
  // real-time parameter snapshots for "last" function
  const useRealTimeData = column.function === 'last'
  const { value: snapshotValue } = useRealTimeData
    ? useParameterSnapshot(row.instance.id!, row.parameter.id!)
    : { value: undefined }

  const cellValue = useMemo(() => {
    if (useRealTimeData) {
      return snapshotValue !== undefined ? Number(snapshotValue) : undefined
    }

    return row.values[columnIndex]?.value
  }, [useRealTimeData, snapshotValue, row.values, columnIndex])

  if (cellValue === undefined || isNaN(cellValue)) {
    return (
      <td className="text-center text-sm">
        <Skeleton className="m-auto h-full w-1/2" disableAnimation>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="w-10 truncate text-xs font-semibold text-destructive">Unavailable</span>
              </TooltipTrigger>
              <TooltipContent>
                <div className="flex max-w-28 flex-col">
                  <span className="font-semibold text-destructive">No data available</span>
                  <span className="break-words text-xs">Device: {row.instance.uid}</span>
                  <span className="break-words text-xs">Parameter: {row.parameter.denotation}</span>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Skeleton>
      </td>
    )
  }

  return <td className="text-center text-sm">{parseFloat(cellValue.toFixed(decimalPlaces ?? 2))}</td>
})

export const ResponsiveTable = memo(ResponsiveTableBase)

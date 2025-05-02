import { memo, CSSProperties, useMemo } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { TableCardConfig } from '@/schemas/dashboard/visualizations/TableBuilderSchema'
import { useDeviceDetail } from '@/context/DeviceDetailContext'
import { useParameterSnapshot } from '@/hooks/useParameterSnapshot'
import { TableColumnData } from '../cards/TableCardController'
import { ResponsiveTooltip } from '@/components/responsive-tooltip'
import { useInstances } from '@/context/InstancesContext'

interface TableRowData {
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
    value?: number | null
  }>
  decimalPlaces: number
  valueSymbol?: string
}

export interface ResponsiveTableProps {
  className?: string
  columnData: TableColumnData[]
  config: TableCardConfig
  onRowClick?: (instanceId: number, parameterId: number) => void
  height?: number
}

const ResponsiveTableBase = ({ className, columnData, config, onRowClick, height }: ResponsiveTableProps) => {
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

  // As we are fetching the data by columns, we need to transform the data into rows
  // for easier rendering
  const rows = useMemo(() => {
    if (!config?.rows?.length) return []
    return config.rows.map((row, rowIndex) => ({
      ...row,
      values: config.columns.map((col, colIndex) => ({
        function: col.function,
        value: columnData[colIndex]?.values?.[rowIndex]
      }))
    }))
  }, [config, columnData])

  const handleRowClick = (instanceId: number | null, parameterId: number | null) => {
    if (onRowClick && instanceId !== null && parameterId !== null) {
      onRowClick(instanceId, parameterId)
      return
    }
    setDetailsSelectedDevice(instanceId!, parameterId)
  }

  return (
    <div className={className || ''} style={containerStyle}>
      <table className="h-full w-full">
        <thead className="border-b-[2px]">
          <tr>
            <th className="text-md text-left">{config?.tableTitle!}</th>
            {config?.columns?.map((column, index) => (
              <th key={index} className="text-center text-xs">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <TableRow key={rowIndex} row={row} onRowClick={handleRowClick} columnsConfig={config.columns} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface TableRowProps {
  row: TableRowData
  onRowClick: (instanceId: number | null, parameterId: number | null) => void
  columnsConfig: TableCardConfig['columns']
}

const TableRow = memo(({ row, onRowClick, columnsConfig }: TableRowProps) => {
  return (
    <tr onClick={() => onRowClick(row.instance?.id, row.parameter.id)} className="cursor-pointer hover:bg-muted/50">
      <td className="text-sm">{row.name}</td>
      {columnsConfig.map((column, columnIndex) => (
        <TableCell key={columnIndex} column={column} row={row} columnIndex={columnIndex} />
      ))}
    </tr>
  )
})

interface TableCellProps {
  column: TableCardConfig['columns'][number]
  row: TableRowData
  columnIndex: number
}

// Has to be a separate component in order to use the snapshot hooks
const TableCell = memo(({ column, row, columnIndex }: TableCellProps) => {
  // real-time parameter snapshots for "last" function
  const { getInstanceById } = useInstances()
  const useRealTimeData = column.function === 'last'
  const { value: snapshotValue } = useRealTimeData
    ? useParameterSnapshot(row.instance?.id!, row.parameter?.id!)
    : { value: undefined }

  const directValue = row.values?.[columnIndex]?.value

  const cellValue = useMemo(() => {
    if (useRealTimeData) {
      const result = snapshotValue !== null ? Number(snapshotValue) : null
      return result
    } else {
      return directValue
    }
  }, [useRealTimeData, snapshotValue, directValue, column.function, columnIndex])

  if (cellValue === null || isNaN(cellValue!)) {
    return (
      <td className="text-center text-sm">
        <Skeleton className="m-auto flex h-full w-full" disableAnimation>
          <ResponsiveTooltip
            content={
              <div className="flex flex-col items-center justify-center">
                <span className="font-semibold text-destructive">No data available</span>
                <span className="break-words text-xs">
                  Device: {getInstanceById(row.instance?.id!)?.userIdentifier || row.instance?.uid!}
                </span>
                <span className="break-words text-xs">Parameter: {row.parameter?.denotation}</span>
              </div>
            }
            className="flex h-full w-full items-center justify-center"
          >
            <span className="block w-full max-w-full truncate text-xs font-semibold text-destructive">Unavailable</span>
          </ResponsiveTooltip>
        </Skeleton>
      </td>
    )
  }

  return (
    <td className="text-center text-sm">
      <span>{typeof cellValue === 'number' ? Number(cellValue.toFixed(row.decimalPlaces)) : String(cellValue)}</span>
      <span className="align-top text-[10px] leading-none">{row.valueSymbol}</span>
    </td>
  )
})

export const ResponsiveTable = memo(ResponsiveTableBase)

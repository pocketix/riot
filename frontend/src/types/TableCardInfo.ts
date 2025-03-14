import { SdInstance, SdParameter } from '@/generated/graphql'
import { Sizing } from './CardGeneral'

export type TableCardInfo = {
  _cardID: string
  sizing?: Sizing
  title?: string
  tableTitle?: string
  icon?: string // unused
  aggregatedTime: string // ENUM nejaky v setupe - 15m, 1h, 1d, 1w, 1m, 1y
  decimalPlaces?: number
  columns: Array<{
    header: string
    function: string
  }>
  rows: Array<{
    name: string
    instance: SdInstance
    parameter: SdParameter
    values?: Array<{
      function: string
      value: string
    }>
  }>
}

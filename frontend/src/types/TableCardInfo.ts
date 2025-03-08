import { SdInstance, SdParameter } from '@/generated/graphql'

export type TableCardInfo = {
  _cardID: string
  title?: string
  icon?: string
  aggregatedTime: string // ENUM nejaky v setupe - 15m, 1h, 1d, 1w, 1m, 1y
  instances: Array<{
    order: number
    instance: {
      uid: string
      id: string
      userIdentifier: string
    }
    params: SdParameter[]
  }>
  columns: Array<{
    header: string
    function: string
  }>
  rows: Array<{
    name: string
    values: Array<{
      value: string
    }>
  }>
}

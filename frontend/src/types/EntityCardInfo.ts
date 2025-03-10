import { SdInstance, SdParameter } from '@/generated/graphql'

export interface EntityCardInfo {
  _cardID: string
  title: string
  rows: Array<{
    name: string
    instance: SdInstance | null
    parameter: SdParameter | null
    visualization: 'sparkline' | 'immediate' | 'switch'
    timeFrame?: string
    value?: string
    sparkLineData?: {
      timeFrame?: string
      data?: Array<{
        x: string
        y: number
      }>
    }
  }>
}

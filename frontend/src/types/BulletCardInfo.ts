import { SdInstance, SdParameter } from '@/generated/graphql'
import { CardGeneral } from './CardGeneral'

export interface BulletCardInfo {
  _cardID: string
  sizing?: CardGeneral
  title?: string
  icon?: string
  color?: string
  data: [
    {
      id: string
      ranges: [number]
      instance: SdInstance
      parameter: SdParameter
      measure?: number
      aggregatedTime?: string
      marker: number
    }
  ]
}

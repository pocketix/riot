import { Box } from '@nivo/core'

export type BulletCardConfig = {
  cardTitle?: string
  icon?: string
  chartConfigs?: {
    name?: string
    titleOffsetX?: number
    margin?: Box
    minValue?: number | 'auto'
    maxValue?: number | 'auto'
    ranges?: number[]
    markers?: number[]
    measureSize?: number
    timeFrame?: number
    measure?: number
    colorScheme?: 'greys' | 'nivo'
    function: string
    instance: {
      uid: string
      parameter: {
        denotation: string
        id: number
      }
    }
  }[]
}

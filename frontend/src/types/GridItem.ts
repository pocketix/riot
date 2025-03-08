import { SdInstance, SdParameter } from '@/generated/graphql'

export type GridItem = {
  layoutID?: string
  instance: SdInstance
  parameters: SdParameter[]
  visualization: 'line' | 'switch' | 'table' | 'bullet' | 'entitycard'
  visualizationConfig: any
}

import { Layout } from 'react-grid-layout'
import { AllConfigTypes, BuilderResult } from '@/types/dashboard/gridItem'
import { ReactNode } from 'react'

export type Sizing = {
  w?: number
  h?: number
  minW?: number
  minH?: number
  maxW?: number
  maxH?: number
}

export interface BaseVisualizationCardProps<ConfigType extends AllConfigTypes> {
  cardID: string
  layout: Layout[]
  breakPoint: string
  cols: { lg: number; md: number; xs: number; xxs: number }
  height: number
  width: number
  setLayout: (layout: Layout[]) => void
  handleDeleteItem: (id: string, breakPoint: string) => void
  setHighlightedCardID: (id: string) => void
  editModeEnabled: boolean
  beingResized: boolean
  configuration: any
  isVisible: boolean
  handleSaveEdit: (config: BuilderResult<ConfigType>) => void
}

export interface BaseCardProps<ConfigType extends AllConfigTypes> extends BaseVisualizationCardProps<ConfigType> {
  isLoading: boolean
  error: string | null
  visualizationType: 'table' | 'bullet' | 'line' | 'entitycard' | 'switch' | 'seqstates'
  cardTitle?: string
  cardIcon?: string
  children: ReactNode
}

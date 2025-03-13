export interface EntityCardInfo {
  _cardID: string
  title: string
  rows: {
    name: string
    instance: {
      uid: string
    } | null
    parameter: {
      id: number
    } | null
    visualization: 'switch' | 'sparkline' | 'immediate'
    timeFrame?: string
  }[]
}

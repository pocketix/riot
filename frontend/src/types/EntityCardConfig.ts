export type EntityCardConfig = {
  _cardID: string
  title: string
  rows: {
    name: string
    instance: {
      uid: string
    }
    parameter: {
      id: number
    }
    value: number | string
    sparklineData: any
    visualization: 'switch' | 'sparkline' | 'immediate'
    timeFrame?: string
  }[]
}

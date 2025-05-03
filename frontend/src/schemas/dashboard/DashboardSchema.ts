import { z } from 'zod'
import { bulletChartBuilderSchema } from './visualizations/BulletChartBuilderSchema'
import { entityCardSchema } from './visualizations/EntityCardBuilderSchema'
import { tableCardSchema } from './visualizations/TableBuilderSchema'
import { lineChartBuilderSchema } from './visualizations/LineChartBuilderSchema'
import { switchCardSchema } from './visualizations/SwitchBuilderSchema'
import { sequentialStatesBuilderSchema } from './visualizations/SequentialStatesBuilderSchema'

export const LayoutItemSchema = z.object({
  w: z.number(),
  h: z.number(),
  x: z.number(),
  y: z.number(),
  i: z.string(),
  minW: z.number().optional(),
  minH: z.number().optional(),
  maxW: z.number().optional(),
  maxH: z.number().optional(),
  moved: z.boolean().optional(),
  static: z.boolean().optional()
})

export const LayoutsSchema = z.record(z.string(), z.array(LayoutItemSchema))

const DBItemDetailsSchema = z.discriminatedUnion('visualization', [
  z.object({
    visualization: z.literal('bullet'),
    visualizationConfig: bulletChartBuilderSchema
  }),
  z.object({
    visualization: z.literal('entitycard'),
    visualizationConfig: entityCardSchema
  }),
  z.object({
    visualization: z.literal('line'),
    visualizationConfig: lineChartBuilderSchema
  }),
  z.object({
    visualization: z.literal('table'),
    visualizationConfig: tableCardSchema
  }),
  z.object({
    visualization: z.literal('switch'),
    visualizationConfig: switchCardSchema
  }),
  z.object({
    visualization: z.literal('seqstates'),
    visualizationConfig: sequentialStatesBuilderSchema
  })
])

export const TabSchema = z.object({
  id: z.number(),
  userIdentifier: z.string(),
  icon: z.string().optional(),
  layout: LayoutsSchema,
  details: z.any()
})

export const RiotDashboardConfigSchema = z.object({
  riot: z.object({
    tabs: z.array(TabSchema)
  })
})

export type DashboardConfig = z.infer<typeof RiotDashboardConfigSchema>
export type DBItemDetails = z.infer<typeof DBItemDetailsSchema>
export type Tab = z.infer<typeof TabSchema>

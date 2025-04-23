import { z } from 'zod'
import { bulletChartBuilderSchema } from './visualizations/BulletChartBuilderSchema'
import { entityCardSchema } from './visualizations/EntityCardBuilderSchema'
import { tableCardSchema } from './visualizations/TableBuilderSchema'
import { lineChartBuilderSchema } from './visualizations/LineChartBuilderSchema'

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
  })
])

export const DetailsSchema = z.record(z.string(), DBItemDetailsSchema)

export const TabSchema = z.object({
  id: z.number(),
  userIdentifier: z.string(),
  icon: z.string().optional(),
  layout: LayoutsSchema,
  details: DetailsSchema
})

export const RiotDashboardConfigSchema = z.object({
  riot: z.object({
    tabs: z.array(TabSchema)
  })
})

export type DashboardConfig = z.infer<typeof RiotDashboardConfigSchema>
export type DBItemDetails = z.infer<typeof DBItemDetailsSchema>
export type Tab = z.infer<typeof TabSchema>
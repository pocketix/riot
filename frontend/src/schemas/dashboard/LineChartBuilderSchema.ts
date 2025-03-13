import { z } from 'zod'

export const lineChartBuilderSchema = z.object({
  cardTitle: z.string().min(1, { message: 'Card title is required' }),
  toolTip: z.object({
    x: z.string().min(1, { message: 'X-Axis tooltip name is required' }),
    y: z.string().min(1, { message: 'Y-Axis tooltip name is required' })
  }),
  pointSize: z.number().min(1, { message: 'Point size must be at least 1' }),
  timeFrame: z.string().min(1, { message: 'Time frame must be at least 1' }),
  aggregateMinutes: z.number().min(1, { message: 'Aggregate minutes must be at least 1' }),
  decimalPlaces: z.number().min(0, { message: 'Decimal places must be at least 0' }),
  instances: z
    .array(
      z.object({
        uid: z.string().min(1, { message: 'Instance is required' }),
        parameters: z
          .array(
            z.object({
              id: z.number().min(1, { message: 'Parameter ID is required' }),
              denotation: z.string().min(1, { message: 'Parameter denotation is required' })
            })
          )
          .min(1, { message: 'At least one parameter is required' })
      })
    )
    .min(1, { message: 'At least one instance is required' })
})

export type LineChartConfig = z.infer<typeof lineChartBuilderSchema>

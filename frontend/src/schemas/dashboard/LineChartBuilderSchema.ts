import { z } from 'zod'

export const lineChartBuilderSchema = z.object({
  cardTitle: z.string().min(1, { message: 'Card title is required' }),
  toolTip: z.object({
    x: z.string().min(1, { message: 'X-Axis tooltip name is required' }),
    y: z.string().min(1, { message: 'Y-Axis tooltip name is required' }),
    // This property is not used directly in the tooltip, but affects the formatting of its values
    yFormat: z.string().regex(/^>-\.\d+~f$/, { message: 'Invalid format' })
  }),
  pointSize: z.number().min(1, { message: 'Point size must be at least 1' }),
  timeFrame: z.string().min(1, { message: 'Time frame must be at least 1' }),
  aggregateMinutes: z.number().min(1, { message: 'Aggregate minutes must be at least 1' }),
  decimalPlaces: z.number().min(0, { message: 'Decimal places must be at least 0' }),
  margin: z.object({
    top: z.number().optional(),
    right: z.number().optional(),
    bottom: z.number().optional(),
    left: z.number().optional()
  }),
  yScale: z.object({
    type: z
      .enum(['linear', 'log'])
      .nullable()
      .superRefine((data, ctx) => {
        if (data === null) {
          ctx.addIssue({
            code: z.ZodIssueCode.invalid_type,
            expected: 'string',
            received: 'null'
          })
          return z.NEVER
        }
        return data
      }),
    max: z.union([z.number(), z.literal('auto')]).optional(),
    min: z.union([z.number(), z.literal('auto')]).optional(),
    // Format in regex >-.x~f , where x is the number of decimal places
    // ~ symbol eliminates trailing zeros
    // Example: >-.2~f
    format: z.string().regex(/^>-\.\d+~f$/, { message: 'Invalid format' }),
    stacked: z.boolean().optional()
  }),
  axisLeft: z.object({
    legend: z.string().optional(),
    legendOffset: z.number().optional(),
    legendPosition: z.enum(['start', 'middle', 'end']).optional()
  }),
  axisBottom: z.object({
    legend: z.string().optional(),
    legendOffset: z.number().optional(),
    legendPosition: z.enum(['start', 'middle', 'end']).optional(),
    // Determines the amount of ticks
    tickValues: z.union([z.string(), z.number()]).optional(),
    format: z.union([z.literal('%H:%M'), z.literal('%m/%d')]).optional()
  }),
  enableGridX: z.boolean().optional(),
  enableGridY: z.boolean().optional(),
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

export type ChartCardConfig = z.infer<typeof lineChartBuilderSchema>

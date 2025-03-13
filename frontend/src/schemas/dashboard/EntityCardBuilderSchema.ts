import { z } from 'zod'

export const entityCardSchema = z.object({
  _cardID: z.string().length(0, { message: 'Card ID cannot be set' }).optional(),
  title: z.string().min(1, { message: 'Title is required' }),
  rows: z
    .array(
      z.object({
        name: z.string().min(1, { message: 'Row name is required' }),
        instance: z.object({
          uid: z.string().min(1, { message: 'Instance is required' })
        }),
        parameter: z.object({
          id: z.number().min(1, { message: 'Parameter is required' })
        }),
        visualization: z.enum(['sparkline', 'immediate', 'switch'], { message: 'Invalid visualization type' }),
        timeFrame: z.string().optional()
      })
    )
    .min(1, { message: 'At least one row is required' })
})

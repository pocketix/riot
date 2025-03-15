import { z } from 'zod'

const parameterSchema = z
  .object({
    id: z.number().min(1, { message: 'Parameter ID is required' }),
    denotation: z.string().min(1, { message: 'Parameter denotation is required' }),
    name: z.string().optional(),
    function: z.string().min(1, { message: 'Function is required' }),
    timeFrame: z.string().min(1, { message: 'Time frame is required' }).optional(),
    measureSize: z.number().min(0, { message: 'Measure size must be greater than or equal to 0' }).max(1, { message: 'Measure size must be less than or equal to 1' }).optional(),
    ranges: z
      .array(
        z.object({
          min: z.number(),
          max: z.number()
        })
      )
      .optional(),
    markers: z.array(z.number()).min(1, { message: 'At least one marker is required' })
  })
  .refine((input) => input.function === 'last' || input.timeFrame, {
    message: 'Time frame is required if function is not "last"',
    path: ['timeFrame']
  })

export const bulletChartBuilderSchema = z.object({
  cardTitle: z.string().min(1, { message: 'Title is required' }).optional(),
  instances: z
    .array(
      z.object({
        uid: z.string().min(1, { message: 'Instance is required' }),
        parameter: parameterSchema
      })
    )
    .min(1, { message: 'At least one instance is required' })
})

export type BulletChartConfig = z.infer<typeof bulletChartBuilderSchema>

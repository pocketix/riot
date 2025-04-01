import { z } from 'zod'

const configSchema = z
  .object({
    name: z.string().min(1, { message: 'Name is required' }),
    function: z.string().min(1, { message: 'Function is required' }),
    timeFrame: z.string().min(1, { message: 'Time frame is required' }).optional(),
    titleOffsetX: z.number().optional(),
    margin: z.object({
      top: z.number().optional(),
      right: z.number().optional(),
      bottom: z.number().optional(),
      left: z.number().optional()
    }),
    minValue: z.union([z.number(), z.literal('auto')]).optional(),
    maxValue: z.union([z.number(), z.literal('auto')]).optional(),
    colorScheme: z.enum(['greys', 'nivo']).optional(),
    measureSize: z.number().min(0, { message: 'Measure size must be greater than or equal to 0' }).max(1, { message: 'Measure size must be less than or equal to 1' }).optional(),
    ranges: z
      .array(
        z.object({
          min: z.number(),
          max: z.number()
        })
      )
      .optional(),
    markers: z.array(z.number()).min(1, { message: 'At least one target is required' })
  })
  .superRefine((data, ctx) => {
    if (data.function !== 'last' && !data.timeFrame) {
      ctx.addIssue({
        message: 'Time frame is required if function is not "last"',
        path: ['timeFrame'],
        code: z.ZodIssueCode.custom
      })
      return z.NEVER
    }
    return data
  })

export const bulletChartBuilderSchema = z.object({
  cardTitle: z.string().min(1, { message: 'Title is required' }).optional(),
  icon: z.string().optional(),
  rows: z
    .array(
      z.object({
        instance: z.object({
          uid: z.string().min(1, { message: 'Instance is required' }),
          id: z.number().min(0, { message: 'Instance ID is required' }).nullable().superRefine((data, ctx) => {
            if (data === null) {
              ctx.addIssue({
                code: z.ZodIssueCode.invalid_type,
                expected: 'number',
                received: 'null',
                message: 'Instance ID is required'
              })
              return z.NEVER
            }
            return data
          }
          )
        }),
        parameter: z.object({
          denotation: z.string().min(1, { message: 'Parameter denotation is required' }),
          id: z
            .number()
            .min(1, { message: 'Parameter ID is required' })
            .nullable()
            .superRefine((data, ctx) => {
              if (data === null) {
                ctx.addIssue({
                  code: z.ZodIssueCode.invalid_type,
                  expected: 'number',
                  received: 'null',
                  message: 'Parameter is required'
                })
                return z.NEVER
              }
              return data
            })
        }),
        config: configSchema
      })
    )
    .min(1, { message: 'At least one instance is required' })
})

export type BulletCardConfig = z.infer<typeof bulletChartBuilderSchema>

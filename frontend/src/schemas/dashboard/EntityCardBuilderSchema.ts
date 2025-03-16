import { z } from 'zod'

// The nullable() methods are used to present the user with placeholders,
// yet the functionality is kept the same by using superRefine()
export const entityCardSchema = z.object({
  title: z.string().optional(),
  rows: z
    .array(
      z
        .object({
          name: z.string().min(1, { message: 'Row name is required' }),
          instance: z.object({
            uid: z.string().min(1, { message: 'Instance is required' })
          }),
          parameter: z.object({
            id: z
              .number()
              .min(1, { message: 'Parameter is required' })
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
          visualization: z
            .enum(['sparkline', 'immediate', 'switch'], { message: 'Invalid visualization type' })
            .nullable()
            .superRefine((data, ctx) => {
              if (data === null) {
                ctx.addIssue({
                  message: 'Visualization is required',
                  code: z.ZodIssueCode.custom
                })
                return z.NEVER
              }
              return data
            }),
          timeFrame: z.string().optional()
        })
        .superRefine((data, ctx) => {
          if (data.visualization === 'sparkline' && !data.timeFrame) {
            ctx.addIssue({
              message: 'Time frame is required for sparkline visualization',
              path: ['timeFrame'],
              code: z.ZodIssueCode.custom
            })
          }
        })
    )
    .min(1, { message: 'At least one row is required' })
})

export type EntityCardConfig = z.infer<typeof entityCardSchema>

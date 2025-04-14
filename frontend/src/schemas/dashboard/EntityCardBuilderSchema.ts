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
          instance: z
            .object({
              uid: z.string().min(1, { message: 'Instance is required' }),
              id: z
                .number()
                .min(0, { message: 'Instance ID is required' })
                .nullable()
                .superRefine((data, ctx) => {
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
                })
            })
            .superRefine((data, ctx) => {
              if (!data.uid || data.uid.length === 0 || data.id === null) {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: 'Instance is required',
                  path: []
                })
              }
            }),
          decimalPlaces: z.coerce.number().min(0, { message: 'Decimal places must be a positive number' }).optional(),
          valueSymbol: z.string().optional(),
          parameter: z
            .object({
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
                }),
              denotation: z.string().min(1, { message: 'Parameter denotation is required' })
            })
            .superRefine((data, ctx) => {
              if (!data.id || data.id <= 0) {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: 'Parameter is required',
                  path: []
                })
              }
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
            return z.NEVER
          }
          return data
        })
    )
    .min(1, { message: 'At least one row is required' })
})

export type EntityCardConfig = z.infer<typeof entityCardSchema>

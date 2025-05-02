import { z } from 'zod'

export const sequentialStatesBuilderSchema = z.object({
  title: z.string().optional(),
  icon: z.string().optional(),
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
    timeFrame: z.string().min(1, { message: 'Time frame is required' }),
})

export type SequentialStatesCardConfig = z.infer<typeof sequentialStatesBuilderSchema>

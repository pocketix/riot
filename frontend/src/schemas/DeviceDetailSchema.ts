import * as z from 'zod'

export const DeviceDetailSchema = z.object({
  dateTimeRange: z
    .object({
      start: z.date().optional(),
      end: z.date().optional()
    })
    .superRefine((data, ctx) => {
      if (data.start && data.end && data.start > data.end) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Start time must be before end time'
        })
      } else if (!data.start && !data.end) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Start and end time are required'
        })
      }
      return data
    }),
  parameter: z.object({
    id: z
      .number()
      .nullable()
      .superRefine((data, ctx) => {
        if (data === null) {
          ctx.addIssue({
            code: z.ZodIssueCode.invalid_type,
            expected: 'number',
            received: 'null',
            message: 'Parameter ID is required'
          })
          return z.NEVER
        }
        return data
      }),
    denotation: z.string().min(1, { message: 'Parameter denotation is required' })
  }),
  comparison: z
    .object({
      dateTimeRange: z
        .object({
          start: z.date(),
          end: z.date()
        })
        .superRefine((data, ctx) => {
          if (data.start > data.end) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'Start time must be before end time',
              path: []
            })
          }
          return data
        }),
      instanceID: z
        .number()
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
        }),
      parameter: z.object({
        id: z
          .number()
          .nullable()
          .superRefine((data, ctx) => {
            if (data === null) {
              ctx.addIssue({
                code: z.ZodIssueCode.invalid_type,
                expected: 'number',
                received: 'null',
                message: 'Parameter ID is required'
              })
              return z.NEVER
            }
            return data
          }),
        denotation: z.string().min(1, { message: 'Parameter denotation is required' })
      })
    })
    .optional()
})

export type DeviceDetailSchemaType = z.infer<typeof DeviceDetailSchema>

import { z } from 'zod'

export const tableCardSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  tableTitle: z.string().min(1, { message: 'Table title is required' }),
  timeFrame: z.string().min(1, { message: 'Time frame must be at least 1' }),
  decimalPlaces: z.number().min(0, { message: 'Decimal places must be a non-negative number' }),
  columns: z
    .array(
      z.object({
        header: z.string().min(1, { message: 'Column header is required' }),
        function: z.string().min(1, { message: 'Function is required' })
      })
    )
    .min(1, { message: 'At least one column is required' }),
  rows: z
    .array(
      z.object({
        name: z.string().min(1, { message: 'Row name is required' }),
        instance: z.object({
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
                  message: 'Select a parameter'
                })
                return z.NEVER
              }
              return data
            }),
          denotation: z.string().min(1, { message: 'Parameter is required' })
        })
      })
    )
    .min(1, { message: 'At least one row is required' })
})

export type TableCardConfig = z.infer<typeof tableCardSchema>

import { NEVER, z } from 'zod'

export const switchCardSchema = z.object({
  title: z.string().optional(),
  icon: z.string().optional(),
  booleanSettings: z.object({
    instanceID: z.coerce.number().min(0, { message: 'Instance is required' }),
    parameter: z
      .object({
        id: z.coerce.number().min(0),
        denotation: z.string().min(1)
      })
      .superRefine((data, ctx) => {
        if (data.id <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Parameter is required',
            path: []
          })
          return NEVER
        }
        return data
      })
  }),
  percentualSettings: z
    .object({
      instanceID: z.coerce.number(),
      parameter: z.object({
        id: z.coerce.number(),
        denotation: z.string()
      }),
      lowerBound: z.coerce.number(),
      upperBound: z.coerce.number()
    })
    .partial()
    .optional()
    .refine(
      (data) => {
        if (
          !data ||
          data.instanceID === undefined ||
          data.parameter?.id === undefined ||
          data.lowerBound === undefined ||
          data.upperBound === undefined
        ) {
          return true
        }
        return data.upperBound > data.lowerBound
      },
      {
        message: 'Upper bound must be greater than lower bound',
        path: ['upperBound']
      }
    )
})

export type SwitchCardConfig = z.infer<typeof switchCardSchema>

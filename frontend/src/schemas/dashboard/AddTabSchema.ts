import { z } from 'zod'

export const AddTabFormSchema = z.object({
  userIdentifier: z.string().min(1, { message: 'User identifier is required' }),
  icon: z.string().optional(),
})

export type AddTabFormSchemaType = z.infer<typeof AddTabFormSchema>

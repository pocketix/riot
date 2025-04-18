import { z } from 'zod'

export const AddTabFormSchema = z.object({
  userIdentifier: z.string(),
  icon: z.string().optional(),
})

export type AddTabFormSchemaType = z.infer<typeof AddTabFormSchema>

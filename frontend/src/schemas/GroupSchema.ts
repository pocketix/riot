import { z } from 'zod'

export const groupSchema = z.object({
  userIdentifier: z.string().min(1, 'Group name is required'),
  sdInstanceIDs: z.array(z.number()).min(1, 'Select at least one device')
})

export type GroupSchema = z.infer<typeof groupSchema>

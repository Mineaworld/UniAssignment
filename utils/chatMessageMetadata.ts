import { z } from 'zod';

export const chatMessageMetadataSchema = z.object({
  requestedModelKey: z.string().optional(),
  requestedModelId: z.string().optional(),
  resolvedModelId: z.string().optional(),
  responseModelId: z.string().optional(),
  paidFallbackApplied: z.boolean().optional(),
});

export type ChatMessageMetadata = z.infer<typeof chatMessageMetadataSchema>;

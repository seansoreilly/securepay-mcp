import { z } from 'zod';

export const environmentSchema = z.object({
  SECUREPAY_MERCHANT_ID: z.string().min(8),
  SECUREPAY_API_PASSWORD: z.string().min(12),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development')
});

export type Environment = z.infer<typeof environmentSchema>;
export const env = environmentSchema.parse(process.env); 
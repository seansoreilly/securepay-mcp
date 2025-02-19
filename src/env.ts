import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const environmentSchema = z.object({
  SECUREPAY_MERCHANT_ID: z.string().min(7),
  SECUREPAY_API_PASSWORD: z.string().min(6),
  SECUREPAY_SANDBOX_URL: z.string().url(),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development')
});

export type Environment = z.infer<typeof environmentSchema>;
const envResult = environmentSchema.safeParse(process.env);

if (!envResult.success) {
  console.error('❌ Invalid environment variables:', envResult.error.format());
  process.exit(1);
}

export const env = envResult.data;

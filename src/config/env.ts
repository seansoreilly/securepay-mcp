import { z } from "zod";

const envSchema = z.object({
  SECUREPAY_MERCHANT_ID: z.string().min(7),
  SECUREPAY_API_PASSWORD: z.string().min(6),
  SECUREPAY_SANDBOX_URL: z.string().url(),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(["development", "production"]).default("development")
});

export const env = envSchema.parse(process.env); 
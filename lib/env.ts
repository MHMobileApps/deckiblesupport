import { z } from 'zod';

const envSchema = z.object({
  ZENDESK_SUBDOMAIN: z.string().min(1).default('deckible'),
  ZENDESK_EMAIL: z.string().default('agent@example.com'),
  ZENDESK_API_TOKEN: z.string().min(1).default('placeholder'),
  ADMIN_EMAIL: z.string().default('admin@local'),
  ADMIN_PASSWORD_HASH: z.string().min(1).default('placeholder-hash'),
  LLM_PROVIDER: z.string().default('openai'),
  LLM_API_KEY: z.string().min(1).default('placeholder-key'),
  LLM_MODEL: z.string().default('gpt-4.1-mini'),
  APP_BASE_URL: z.string().url().default('http://localhost:3000'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  SESSION_SECRET: z.string().min(16).default('change-this-in-production')
});

export const env = envSchema.parse(process.env);

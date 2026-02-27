import { env } from './env';

const levels = { debug: 10, info: 20, warn: 30, error: 40 } as const;

export function log(level: keyof typeof levels, message: string, meta?: Record<string, unknown>) {
  if (levels[level] < levels[env.LOG_LEVEL]) return;
  const safeMeta = { ...meta };
  delete safeMeta.token;
  delete safeMeta.authorization;
  console.log(JSON.stringify({ level, message, ...safeMeta }));
}

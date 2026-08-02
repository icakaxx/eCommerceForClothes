/**
 * Centralized logging. Debug/info never reach the browser in production.
 * Server operational logs are sanitized (no secrets, tokens, or full user objects).
 */

const IS_DEV = process.env.NODE_ENV === 'development';
const IS_SERVER = typeof window === 'undefined';

const SENSITIVE_KEYS = new Set([
  'password',
  'pass',
  'token',
  'access_token',
  'refresh_token',
  'authorization',
  'cookie',
  'secret',
  'apikey',
  'api_key',
  'service_role',
  'service_role_key',
  'supabase_service_role_key',
  'session',
  'jwt',
  'creditcard',
  'card_number',
  'cvv',
  'ssn',
]);

function isSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase();
  return (
    SENSITIVE_KEYS.has(lower) ||
    lower.includes('password') ||
    lower.includes('token') ||
    lower.includes('secret') ||
    lower.includes('authorization')
  );
}

function redactValue(value: unknown, depth = 0): unknown {
  if (depth > 4) return '[Truncated]';
  if (value == null) return value;
  if (typeof value === 'string') {
    if (value.length > 500) return `${value.slice(0, 500)}…[truncated]`;
    return value;
  }
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item) => redactValue(item, depth + 1));
  }
  if (value instanceof Error) {
    return IS_DEV
      ? { name: value.name, message: value.message }
      : { name: value.name, message: 'Error' };
  }
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (isSensitiveKey(key)) {
      out[key] = '[Redacted]';
    } else {
      out[key] = redactValue(val, depth + 1);
    }
  }
  return out;
}

function formatArgs(args: unknown[]): unknown[] {
  return args.map((arg) => redactValue(arg));
}

export function createRequestId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export const logger = {
  /** Development-only diagnostic output. Never runs in production. */
  debug(...args: unknown[]): void {
    if (!IS_DEV) return;
    console.debug(...formatArgs(args));
  },

  /** Development-only informational output. Never runs in production. */
  info(...args: unknown[]): void {
    if (!IS_DEV) return;
    console.info(...formatArgs(args));
  },

  /** Sanitized warnings — server always; browser only in development. */
  warn(...args: unknown[]): void {
    if (!IS_SERVER && !IS_DEV) return;
    console.warn(...formatArgs(args));
  },

  /** Sanitized errors — server always; browser only in development. */
  error(...args: unknown[]): void {
    if (!IS_SERVER && !IS_DEV) return;
    console.error(...formatArgs(args));
  },
};

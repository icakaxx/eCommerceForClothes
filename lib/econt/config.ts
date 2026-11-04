import 'server-only';

const DEMO_HOST = 'demo.econt.com';
const PROD_HOST = 'ee.econt.com';
const DEFAULT_DEMO_BASE = 'https://demo.econt.com/ee/services';
const DEFAULT_PROD_BASE = 'https://ee.econt.com/services';

export type EcontRuntimeEnv = 'demo' | 'production';

function parseRuntimeEnv(raw: string | undefined): EcontRuntimeEnv {
  const v = (raw ?? 'demo').trim().toLowerCase();
  if (v === 'production' || v === 'prod') return 'production';
  return 'demo';
}

export function getEcontConfig() {
  const env = parseRuntimeEnv(process.env.ECONT_ENV);
  const defaultBase = env === 'production' ? DEFAULT_PROD_BASE : DEFAULT_DEMO_BASE;
  const baseUrl = (process.env.ECONT_API_URL ?? defaultBase).replace(/\/$/, '');
  let parsed: URL;
  try {
    parsed = new URL(baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
  } catch {
    throw new Error('Invalid ECONT_API_URL');
  }

  const allowedHost = env === 'production' ? PROD_HOST : DEMO_HOST;
  if (parsed.hostname !== allowedHost) {
    throw new Error(`ECONT_API_URL must use ${allowedHost} when ECONT_ENV=${env}`);
  }

  const username = process.env.ECONT_USERNAME;
  const password = process.env.ECONT_PASSWORD;
  if (!username || !password) {
    throw new Error('ECONT_USERNAME and ECONT_PASSWORD are required');
  }

  return {
    env,
    baseUrl: baseUrl.replace(/\/$/, ''),
    username,
    password,
  };
}

export function isEcontConfigured(): boolean {
  try {
    getEcontConfig();
    return true;
  } catch {
    return false;
  }
}

export function getEcontRuntimeEnv(): EcontRuntimeEnv {
  return getEcontConfig().env;
}

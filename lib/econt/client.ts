import 'server-only';

import { getEcontConfig } from '@/lib/econt/config';
import { mapEcontHttpError, mapEcontTransportError } from '@/lib/econt/errors';
import type { EcontServiceError } from '@/lib/econt/types';

export async function econtPost<TResponse>(
  servicePath: string,
  body: Record<string, unknown>
): Promise<{ data: TResponse; raw: unknown }> {
  const config = getEcontConfig();
  const url = `${config.baseUrl}/${servicePath.replace(/^\//, '')}`;
  const auth = Buffer.from(`${config.username}:${config.password}`).toString('base64');

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
  } catch (cause) {
    throw mapEcontTransportError(cause);
  }

  const text = await response.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    throw mapEcontHttpError(response.status, 'Invalid JSON from Econt');
  }

  if (!response.ok) {
    throw mapEcontHttpError(response.status, extractEcontMessage(parsed));
  }

  if (parsed && typeof parsed === 'object' && parsed !== null && 'error' in parsed) {
    const err = (parsed as { error?: EcontServiceError }).error;
    if (err?.message) {
      throw mapEcontHttpError(response.status, err.message, err);
    }
  }

  return { data: parsed as TResponse, raw: parsed };
}

function extractEcontMessage(parsed: unknown): string {
  if (!parsed || typeof parsed !== 'object') return 'Unknown Econt response';
  const obj = parsed as Record<string, unknown>;
  if (typeof obj.message === 'string') return obj.message;
  if (obj.error && typeof obj.error === 'object' && obj.error !== null) {
    const e = obj.error as { message?: string };
    if (e.message) return e.message;
  }
  return 'Unknown Econt response';
}

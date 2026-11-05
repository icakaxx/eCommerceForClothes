const hits = new Map<string, number[]>();

export function allowPublicEcontLookup(ip: string, max = 40, windowMs = 60_000): boolean {
  const now = Date.now();
  const key = ip || 'unknown';
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}

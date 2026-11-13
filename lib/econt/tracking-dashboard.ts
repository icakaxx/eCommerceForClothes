/** Date windows, office-wait filter and chart buckets. No Econt calls. */

export type RangePreset = 'all' | 'today' | 'yesterday' | '7d' | '30d' | 'month' | 'custom';

const TZ = 'Europe/Sofia';

export function sofiaDateKey(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function tzOffsetMs(date: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? '0');
  const hour = get('hour') % 24;
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), hour, get('minute'), get('second'));
  return asUtc - date.getTime();
}

export function sofiaMidnight(isoDate: string): Date {
  const utcMidnight = new Date(`${isoDate}T00:00:00.000Z`);
  return new Date(utcMidnight.getTime() - tzOffsetMs(utcMidnight));
}

export function resolveRange(
  preset: RangePreset,
  now: Date,
  customFrom?: string | null,
  customTo?: string | null
): { from: string | null; to: string | null } {
  const today = sofiaDateKey(now);
  if (preset === 'all') return { from: null, to: null };
  if (preset === 'today') return { from: today, to: today };
  if (preset === 'yesterday') {
    const y = sofiaDateKey(new Date(now.getTime() - 24 * 60 * 60 * 1000));
    return { from: y, to: y };
  }
  if (preset === '7d') {
    return { from: sofiaDateKey(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000)), to: today };
  }
  if (preset === '30d') {
    return { from: sofiaDateKey(new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000)), to: today };
  }
  if (preset === 'month') return { from: `${today.slice(0, 8)}01`, to: today };
  return { from: customFrom || null, to: customTo || null };
}

export function inSofiaRange(value: string | null | undefined, from: string | null, to: string | null): boolean {
  if (!from && !to) return true;
  if (!value) return false;
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return false;
  if (from && time < sofiaMidnight(from).getTime()) return false;
  if (to) {
    const end = sofiaMidnight(to).getTime() + 24 * 60 * 60 * 1000;
    if (time >= end) return false;
  }
  return true;
}

export type TrackingEventLite = {
  event_time?: string | null;
  description?: string | null;
  event_type?: string | null;
};

export function latestOfficeArrival(events: TrackingEventLite[]): string | null {
  let latest: string | null = null;
  for (const event of events) {
    const text = `${event.description ?? ''} ${event.event_type ?? ''}`.toLowerCase();
    if (!text.includes('офис') && !text.includes('office')) continue;
    if (text.includes('напуск') || text.includes('depart')) continue;
    if (!event.event_time) continue;
    if (!latest || event.event_time > latest) latest = event.event_time;
  }
  return latest;
}

export function isUncollectedOverDays(params: {
  status: string | null;
  events: TrackingEventLite[];
  now: Date;
  minDays: number;
}): { match: boolean; days: number | null; reason: 'ok' | 'not_waiting' | 'unknown_arrival' } {
  if (params.status !== 'in_office') return { match: false, days: null, reason: 'not_waiting' };
  const arrival = latestOfficeArrival(params.events);
  if (!arrival) return { match: false, days: null, reason: 'unknown_arrival' };
  const days = Math.floor((params.now.getTime() - new Date(arrival).getTime()) / (24 * 60 * 60 * 1000));
  if (days < 0) return { match: false, days: 0, reason: 'ok' };
  return { match: days >= params.minDays, days, reason: 'ok' };
}

export function weekKey(iso: string): string {
  const date = new Date(iso);
  const day = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const weekday = day.getUTCDay() || 7;
  day.setUTCDate(day.getUTCDate() + 4 - weekday);
  const yearStart = new Date(Date.UTC(day.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((day.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${day.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function diffAwbNumbers(econtNumbers: string[], storedNumbers: string[]) {
  const stored = new Set(storedNumbers.filter(Boolean));
  const remote = new Set(econtNumbers.filter(Boolean));
  return {
    missingLocally: [...remote].filter((num) => !stored.has(num)).sort(),
    onlyLocal: [...stored].filter((num) => !remote.has(num)).sort(),
  };
}

/** Date windows, office-wait filter and chart buckets. No Econt calls. */

export type RangePreset =
  | 'all'
  | 'today'
  | 'yesterday'
  | '7d'
  | '30d'
  | 'month'
  | 'custom'
  | 'open'
  | 'h24'
  | 'd7'
  | 'm1'
  | 'm2'
  | 'm3'
  | 'm4'
  | 'm5'
  | 'instructions';

export type AwbKind = 'open' | 'prepared' | 'delivered' | 'returned' | 'instruction' | 'cancelled';

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

export function plainEcontStatus(raw?: string | null): string {
  return String(raw ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function classifyAwbStatus(raw?: string | null): AwbKind {
  const s = plainEcontStatus(raw).toLowerCase();
  if (!s) return 'open';
  if (s.includes('разпореждане')) return 'instruction';
  if (s.includes('анулир') || s.includes('cancel')) return 'cancelled';
  if (s.includes('върнат') || (s.includes('returned') && !s.includes('returning'))) return 'returned';
  if (s.includes('получен') || s.includes('доставен') || (s.includes('deliver') && !s.includes('out'))) return 'delivered';
  if (s.includes('очаква предаване') || s.includes('подготвен') || s.includes('prepar')) return 'prepared';
  return 'open';
}

export function isUnfinishedAwb(kind: AwbKind): boolean {
  return kind === 'open' || kind === 'prepared';
}

function shiftSofiaMonths(isoDate: string, months: number): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const anchor = new Date(Date.UTC(year, month - 1, 1));
  anchor.setUTCMonth(anchor.getUTCMonth() - months);
  const lastDay = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + 1, 0)).getUTCDate();
  const safeDay = Math.min(day, lastDay);
  const y = anchor.getUTCFullYear();
  const m = String(anchor.getUTCMonth() + 1).padStart(2, '0');
  const d = String(safeDay).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function accountWindow(
  preset: RangePreset,
  now: Date,
  customFrom?: string | null,
  customTo?: string | null
): { fromMs: number | null; toMs: number | null } {
  const today = sofiaDateKey(now);
  const end = sofiaMidnight(today).getTime() + 24 * 60 * 60 * 1000;
  if (preset === 'h24') return { fromMs: now.getTime() - 24 * 60 * 60 * 1000, toMs: now.getTime() + 1 };
  if (preset === 'd7' || preset === '7d') return { fromMs: sofiaMidnight(sofiaDateKey(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000))).getTime(), toMs: end };
  if (preset === 'm1' || preset === 'm2' || preset === 'm3' || preset === 'm4' || preset === 'm5' || preset === '30d' || preset === 'month') {
    const months = preset === 'm2' ? 2 : preset === 'm3' ? 3 : preset === 'm4' ? 4 : preset === 'm5' ? 5 : 1;
    return { fromMs: sofiaMidnight(shiftSofiaMonths(today, months)).getTime(), toMs: end };
  }
  if (preset === 'custom') {
    return {
      fromMs: customFrom ? sofiaMidnight(customFrom).getTime() : null,
      toMs: customTo ? sofiaMidnight(customTo).getTime() + 24 * 60 * 60 * 1000 : null,
    };
  }
  return { fromMs: null, toMs: null };
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

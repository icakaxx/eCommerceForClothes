import 'server-only';



import { econtPost } from '@/lib/econt/client';

import type { EcontCity, EcontOffice } from '@/lib/econt/types';
import { officeSearchHaystack } from '@/lib/econt/office-display';



const CACHE_TTL_MS = 1000 * 60 * 60 * 6;

let citiesCache: { at: number; cities: EcontCity[] } | null = null;

const officesCache = new Map<number, { at: number; offices: EcontOffice[] }>();



export async function fetchEcontCities(countryCode = 'BGR'): Promise<EcontCity[]> {

  if (citiesCache && Date.now() - citiesCache.at < CACHE_TTL_MS) {

    return citiesCache.cities;

  }

  const { data } = await econtPost<{ cities?: EcontCity[] }>(

    'Nomenclatures/NomenclaturesService.getCities.json',

    { countryCode }

  );

  const cities = data.cities ?? [];

  citiesCache = { at: Date.now(), cities };

  return cities;

}



export async function searchEcontCities(query: string, limit = 30): Promise<EcontCity[]> {

  const q = query.trim().toLowerCase();

  const cities = await fetchEcontCities();

  if (!q) return cities.slice(0, limit);

  return cities

    .filter((c) => c.name.toLowerCase().includes(q) || (c.nameEn ?? '').toLowerCase().includes(q))

    .slice(0, limit);

}



export async function fetchEcontOffices(cityId: number): Promise<EcontOffice[]> {

  const cached = officesCache.get(cityId);

  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {

    return cached.offices;

  }

  const { data } = await econtPost<{ offices?: EcontOffice[] }>(

    'Nomenclatures/NomenclaturesService.getOffices.json',

    { countryCode: 'BGR', cityID: cityId }

  );

  const offices = data.offices ?? [];

  officesCache.set(cityId, { at: Date.now(), offices });

  return offices;

}



export async function searchEcontOffices(cityId: number, query: string, limit = 50): Promise<EcontOffice[]> {

  const q = query.trim().toLowerCase();

  const offices = await fetchEcontOffices(cityId);

  if (!q) return offices.slice(0, limit);

  return offices

    .filter((o) => officeSearchHaystack(o).includes(q))

    .slice(0, limit);

}



export async function findCityByName(name: string): Promise<EcontCity | null> {

  const normalized = normalizeCityLabel(name);

  const cities = await fetchEcontCities();

  const byBg = cities.filter((c) => normalizeCityLabel(c.name) === normalized);

  if (byBg.length === 1) return byBg[0];

  const byEn = cities.filter((c) => (c.nameEn ?? '').trim().toLowerCase() === normalized);

  if (byEn.length === 1) return byEn[0];

  if (normalized === 'ловеч' || normalized === 'lovech') {

    const lovech = cities.find((c) => (c.nameEn ?? '').toLowerCase() === 'lovech');

    if (lovech) return lovech;

  }

  return null;

}



export async function resolveOfficeInCity(params: {

  cityId: number;

  officeCode?: string | null;

  officeName?: string | null;

}): Promise<{ office: EcontOffice | null; ambiguous: boolean }> {

  const offices = await fetchEcontOffices(params.cityId);

  if (params.officeCode) {

    const byCode = offices.find((o) => o.code === params.officeCode);

    if (byCode) return { office: byCode, ambiguous: false };

  }

  if (params.officeName) {

    const norm = normalizeOfficeName(params.officeName);

    const matches = offices.filter((o) => normalizeOfficeName(o.name) === norm);

    if (matches.length === 1) return { office: matches[0], ambiguous: false };

    if (matches.length > 1) return { office: null, ambiguous: true };

  }

  return { office: null, ambiguous: false };

}



export function normalizeCityLabel(value: string): string {

  return value.replace(/\s*\[\d+\]\s*$/, '').trim().toLowerCase();

}



export function normalizeOfficeName(value: string): string {

  return value.trim().toLowerCase().replace(/\s+/g, ' ');

}



export async function validateEcontAddress(params: {

  cityId: number;

  street: string;

  num: string;

  other?: string;

}) {

  const { data } = await econtPost<{ validationStatus?: string; address?: Record<string, unknown> }>(

    'Nomenclatures/AddressService.validateAddress.json',

    {

      address: {

        city: { id: params.cityId },

        street: params.street,

        num: params.num,

        other: params.other ?? '',

      },

    }

  );

  return data;

}



/** Lovech market office on Econt Demo (code 5503). */

export async function findLovechMarketOffice(): Promise<EcontOffice | null> {

  const city = (await findCityByName('Ловеч')) ?? (await findCityByName('Lovech'));

  if (!city) return null;

  const offices = await fetchEcontOffices(city.id);

  const byCode = offices.find((o) => o.code === '5503');

  if (byCode) return byCode;

  const byName = offices.find((o) => {

    const n = normalizeOfficeName(o.name);

    return n.includes('pazar') || n.includes('пазар');

  });

  return byName ?? offices[0] ?? null;

}



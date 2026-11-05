import type { EcontCity, EcontOffice } from '@/lib/econt/types';

export type PublicEcontCity = {
  id: number;
  name: string;
  nameEn: string;
  postCode: string;
  regionName: string;
  label: string;
};

export type PublicEcontOffice = {
  code: string;
  name: string;
  nameEn: string;
  address: string;
};

function cityRegion(city: EcontCity): string {
  return (city.regionName || city.regionNameEn || '').trim();
}

export function formatEcontCityLabel(city: EcontCity): string {
  const post = (city.postCode || '').trim();
  const region = cityRegion(city);
  const parts = [city.name];
  if (post) parts.push(post);
  if (region) parts.push(region);
  return parts.join(' · ');
}

export function toPublicEcontCity(city: EcontCity): PublicEcontCity {
  return {
    id: city.id,
    name: city.name,
    nameEn: city.nameEn ?? '',
    postCode: city.postCode ?? '',
    regionName: cityRegion(city),
    label: formatEcontCityLabel(city),
  };
}

export function toPublicEcontOffice(office: EcontOffice, address: string): PublicEcontOffice {
  return {
    code: office.code,
    name: office.name,
    nameEn: office.nameEn ?? '',
    address,
  };
}

export function filterEcontCities(cities: EcontCity[], query: string, limit = 30): EcontCity[] {
  const q = query.trim().toLowerCase();
  if (!q) return cities.slice(0, limit);
  return cities
    .filter((c) => {
      const haystack = [c.name, c.nameEn ?? '', c.postCode ?? '', cityRegion(c)]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    })
    .slice(0, limit);
}

export function checkoutCityOfficeClientErrors(input: {
  deliveryType: string;
  econtCityId?: number | null;
  econtOfficeCode?: string | null;
}): { city?: string; office?: string } {
  const errors: { city?: string; office?: string } = {};
  if (!input.econtCityId) {
    errors.city = 'Моля, изберете град от списъка.';
  }
  if (input.deliveryType === 'office' && !input.econtOfficeCode?.trim()) {
    errors.office = 'Моля, изберете офис на Еконт.';
  }
  return errors;
}

export function resetOfficeOnCityChange<T extends {
  econtCityId: number;
  city: string;
  econtOfficeCode?: string;
  econtOfficeName?: string;
  econtOfficeId?: string;
}>(nextCity: T): T {
  return {
    ...nextCity,
    econtOfficeCode: '',
    econtOfficeName: '',
    econtOfficeId: '',
  };
}

export function officeBelongsToCity(offices: Array<{ code: string }>, officeCode: string): boolean {
  return offices.some((office) => office.code === officeCode);
}

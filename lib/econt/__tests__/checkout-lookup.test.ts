import { describe, expect, it } from 'vitest';
import {
  checkoutCityOfficeClientErrors,
  filterEcontCities,
  formatEcontCityLabel,
  officeBelongsToCity,
  resetOfficeOnCityChange,
  toPublicEcontCity,
  toPublicEcontOffice,
} from '@/lib/econt/city-search';
import type { EcontCity } from '@/lib/econt/types';

const cities: EcontCity[] = [
  { id: 1, name: 'Ловеч', nameEn: 'Lovech', postCode: '5500', regionName: 'Ловеч' },
  { id: 2, name: 'Кърджали', nameEn: 'Kardzhali', postCode: '6600', regionName: 'Кърджали' },
  { id: 47, name: 'София', nameEn: 'Sofia', postCode: '1000', regionName: 'София' },
  { id: 80, name: 'София', nameEn: 'Sofia', postCode: '1220', regionName: 'София-област' },
];

describe('Econt city search', () => {
  it('loads and filters Bulgarian city names', () => {
    const found = filterEcontCities(cities, 'ловеч', 10);
    expect(found).toHaveLength(1);
    expect(found[0].id).toBe(1);
  });

  it('distinguishes duplicate city names by postal code and region', () => {
    const found = filterEcontCities(cities, 'софия', 10);
    expect(found).toHaveLength(2);
    expect(formatEcontCityLabel(found[0])).toContain('1000');
    expect(formatEcontCityLabel(found[1])).toContain('1220');
    expect(formatEcontCityLabel(found[1])).toContain('София-област');
  });
});

describe('checkout selection rules', () => {
  it('requires a selected Econt city', () => {
    expect(checkoutCityOfficeClientErrors({ deliveryType: 'address' }).city).toBe(
      'Моля, изберете град от списъка.'
    );
  });

  it('requires an office only for office delivery', () => {
    expect(
      checkoutCityOfficeClientErrors({ deliveryType: 'office', econtCityId: 1 }).office
    ).toBe('Моля, изберете офис на Еконт.');
    expect(
      checkoutCityOfficeClientErrors({ deliveryType: 'address', econtCityId: 1 })
    ).toEqual({});
  });

  it('stores and verifies the official office code for the selected city', () => {
    const offices = [{ code: '5503' }, { code: '1111' }];
    expect(officeBelongsToCity(offices, '5503')).toBe(true);
    expect(officeBelongsToCity(offices, '9999')).toBe(false);
  });

  it('resets office when the city changes', () => {
    const next = resetOfficeOnCityChange({
      econtCityId: 47,
      city: 'София',
      econtOfficeCode: '5503',
      econtOfficeName: 'Пазар',
      econtOfficeId: '5503',
    });
    expect(next.econtCityId).toBe(47);
    expect(next.econtOfficeCode).toBe('');
    expect(next.econtOfficeName).toBe('');
    expect(next.econtOfficeId).toBe('');
  });
});

describe('public lookup payload', () => {
  it('exposes only nomenclature fields, not credentials', () => {
    const city = toPublicEcontCity(cities[0]);
    const office = toPublicEcontOffice(
      { code: '5503', name: 'Еконт Офис Пазар', nameEn: 'Market' },
      'ул. Пазарска 1'
    );
    expect(JSON.stringify(city)).not.toMatch(/password|username|ECONT_/i);
    expect(JSON.stringify(office)).not.toMatch(/password|username|ECONT_/i);
    expect(office.code).toBe('5503');
  });
});

describe('address vs office checkout', () => {
  it('does not require an office for address delivery', () => {
    expect(
      checkoutCityOfficeClientErrors({
        deliveryType: 'address',
        econtCityId: 1,
        econtOfficeCode: null,
      })
    ).toEqual({});
  });
});

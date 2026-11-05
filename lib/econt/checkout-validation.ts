import 'server-only';

import { fetchEcontCities, fetchEcontOffices, findCityById } from '@/lib/econt/nomenclatures';
import { officeBelongsToCity } from '@/lib/econt/city-search';
import type { EcontCity, EcontOffice } from '@/lib/econt/types';

export type CheckoutDeliveryInput = {
  deliveryType: string;
  econtCityId?: number | null;
  econtOfficeCode?: string | null;
};

export async function validateCheckoutDelivery(input: CheckoutDeliveryInput): Promise<
  | { ok: true; city: EcontCity; office: EcontOffice | null }
  | { ok: false; message: string; status: number }
> {
  const cityId = Number(input.econtCityId);
  if (!cityId) {
    return { ok: false, message: 'Моля, изберете град от списъка.', status: 400 };
  }

  let city: EcontCity | null;
  try {
    city = await findCityById(cityId);
    if (!city) {
      const all = await fetchEcontCities();
      city = all.find((item) => item.id === cityId) ?? null;
    }
  } catch {
    return {
      ok: false,
      message: 'В момента не можем да заредим офисите на Еконт. Опитайте отново.',
      status: 503,
    };
  }

  if (!city) {
    return { ok: false, message: 'Моля, изберете град от списъка.', status: 400 };
  }

  if (input.deliveryType !== 'office') {
    return { ok: true, city, office: null };
  }

  const officeCode = String(input.econtOfficeCode ?? '').trim();
  if (!officeCode) {
    return { ok: false, message: 'Моля, изберете офис на Еконт.', status: 400 };
  }

  let offices: EcontOffice[];
  try {
    offices = await fetchEcontOffices(city.id);
  } catch {
    return {
      ok: false,
      message: 'В момента не можем да заредим офисите на Еконт. Опитайте отново.',
      status: 503,
    };
  }

  if (!officeBelongsToCity(offices, officeCode)) {
    return {
      ok: false,
      message: 'Избраният офис не принадлежи на този град. Моля, изберете друг офис.',
      status: 400,
    };
  }

  const office = offices.find((item) => item.code === officeCode) ?? null;
  return { ok: true, city, office };
}

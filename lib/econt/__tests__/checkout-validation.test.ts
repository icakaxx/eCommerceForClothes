import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const findCityById = vi.fn();
const fetchEcontCities = vi.fn();
const fetchEcontOffices = vi.fn();

vi.mock('@/lib/econt/nomenclatures', () => ({
  findCityById: (...args: unknown[]) => findCityById(...args),
  fetchEcontCities: (...args: unknown[]) => fetchEcontCities(...args),
  fetchEcontOffices: (...args: unknown[]) => fetchEcontOffices(...args),
}));

import { validateCheckoutDelivery } from '@/lib/econt/checkout-validation';

const sofia = { id: 47, name: 'София', postCode: '1000' };
const office = { code: '1111', name: 'София Център' };

describe('server checkout delivery validation', () => {
  beforeEach(() => {
    findCityById.mockReset();
    fetchEcontCities.mockReset();
    fetchEcontOffices.mockReset();
  });

  it('rejects a missing city', async () => {
    const result = await validateCheckoutDelivery({ deliveryType: 'office' });
    expect(result).toEqual({
      ok: false,
      message: 'Моля, изберете град от списъка.',
      status: 400,
    });
  });

  it('allows address delivery without an office once a city is official', async () => {
    findCityById.mockResolvedValue(sofia);
    const result = await validateCheckoutDelivery({
      deliveryType: 'address',
      econtCityId: 47,
    });
    expect(result).toEqual({ ok: true, city: sofia, office: null });
    expect(fetchEcontOffices).not.toHaveBeenCalled();
  });

  it('requires an office for office delivery', async () => {
    findCityById.mockResolvedValue(sofia);
    const result = await validateCheckoutDelivery({
      deliveryType: 'office',
      econtCityId: 47,
    });
    expect(result).toEqual({
      ok: false,
      message: 'Моля, изберете офис на Еконт.',
      status: 400,
    });
  });

  it('rejects an office that does not belong to the selected city', async () => {
    findCityById.mockResolvedValue(sofia);
    fetchEcontOffices.mockResolvedValue([office]);
    const result = await validateCheckoutDelivery({
      deliveryType: 'office',
      econtCityId: 47,
      econtOfficeCode: '9999',
    });
    expect(result).toEqual({
      ok: false,
      message: 'Избраният офис не принадлежи на този град. Моля, изберете друг офис.',
      status: 400,
    });
  });

  it('accepts a verified official office code', async () => {
    findCityById.mockResolvedValue(sofia);
    fetchEcontOffices.mockResolvedValue([office]);
    const result = await validateCheckoutDelivery({
      deliveryType: 'office',
      econtCityId: 47,
      econtOfficeCode: '1111',
    });
    expect(result).toEqual({ ok: true, city: sofia, office });
  });

  it('returns the Bulgarian unavailable message when Econt fails', async () => {
    findCityById.mockRejectedValue(new Error('timeout'));
    const result = await validateCheckoutDelivery({
      deliveryType: 'office',
      econtCityId: 47,
      econtOfficeCode: '1111',
    });
    expect(result).toEqual({
      ok: false,
      message: 'В момента не можем да заредим офисите на Еконт. Опитайте отново.',
      status: 503,
    });
  });
});

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { adminAuthHeaders } from '@/lib/admin-auth-headers';
import { formatEcontOfficeAddress } from '@/lib/econt/office-display';
import type { EcontOffice as EcontOfficeApi } from '@/lib/econt/types';

type EcontCity = { id: number; name: string; nameEn?: string };
type EcontOffice = EcontOfficeApi;

export type ReceiverEcontSelection = {
  receiverCityId?: number;
  receiverCityName?: string;
  receiverOfficeCode?: string;
  receiverOfficeName?: string;
  receiverOfficeAddress?: string;
  receiverAddress?: { street?: string; num?: string; other?: string };
};

type Props = {
  deliveryType: string;
  /** UI copy: sender office vs receiver office/address */
  role?: 'sender' | 'receiver';
  initialCityName?: string;
  initialOfficeHint?: string;
  initialAddress?: { street?: string; num?: string; other?: string };
  value: ReceiverEcontSelection;
  onChange: (next: ReceiverEcontSelection) => void;
};

function useDebouncedValue<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export default function EcontReceiverFields({
  deliveryType,
  role = 'receiver',
  initialCityName,
  initialOfficeHint,
  initialAddress,
  value,
  onChange,
}: Props) {
  const isOffice = deliveryType === 'office';
  const isSender = role === 'sender';
  const [cityQuery, setCityQuery] = useState(initialCityName ?? value.receiverCityName ?? '');
  const [officeQuery, setOfficeQuery] = useState(
    value.receiverOfficeName ?? initialOfficeHint ?? value.receiverOfficeCode ?? ''
  );
  const [cityResults, setCityResults] = useState<EcontCity[]>([]);
  const [officeResults, setOfficeResults] = useState<EcontOffice[]>([]);
  const [cityOpen, setCityOpen] = useState(false);
  const [officeOpen, setOfficeOpen] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingOffices, setLoadingOffices] = useState(false);
  const [cityApiError, setCityApiError] = useState<string | null>(null);
  const [officeApiError, setOfficeApiError] = useState<string | null>(null);
  const seededCity = useRef(false);
  const seededOffice = useRef(false);

  const debouncedCityQ = useDebouncedValue(cityQuery.trim(), 350);
  const debouncedOfficeQ = useDebouncedValue(officeQuery.trim(), 350);
  const cityId = value.receiverCityId;

  useEffect(() => {
    if (value.receiverCityName) setCityQuery(value.receiverCityName);
  }, [value.receiverCityId, value.receiverCityName]);

  useEffect(() => {
    if (!value.receiverOfficeCode) return;
    const label = value.receiverOfficeAddress
      ? `${value.receiverOfficeName ?? ''} — ${value.receiverOfficeAddress} (${value.receiverOfficeCode})`
      : `${value.receiverOfficeName ?? 'Офис'} (${value.receiverOfficeCode})`;
    setOfficeQuery(label);
  }, [
    value.receiverOfficeAddress,
    value.receiverOfficeCode,
    value.receiverOfficeName,
  ]);

  const patch = useCallback(
    (partial: Partial<ReceiverEcontSelection>) => onChange({ ...value, ...partial }),
    [onChange, value]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (debouncedCityQ.length < 2) {
        setCityResults([]);
        setCityApiError(null);
        return;
      }
      setLoadingCities(true);
      setCityApiError(null);
      const params = new URLSearchParams({ q: debouncedCityQ });
      const res = await fetch(`/api/admin/econt/cities?${params}`, { headers: await adminAuthHeaders() });
      const data = await res.json();
      if (!cancelled) {
        if (data.success) {
          setCityResults(data.cities ?? []);
        } else {
          setCityResults([]);
          setCityApiError(data.error?.message ?? 'Не успяхме да заредим градове от Econt.');
        }
      }
      if (!cancelled) setLoadingCities(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedCityQ]);

  useEffect(() => {
    if (!isOffice || !cityId) {
      setOfficeResults([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingOffices(true);
      setOfficeApiError(null);
      const params = new URLSearchParams({
        cityId: String(cityId),
        q: debouncedOfficeQ,
      });
      const res = await fetch(`/api/admin/econt/offices?${params}`, { headers: await adminAuthHeaders() });
      const data = await res.json();
      if (!cancelled) {
        if (data.success) {
          setOfficeResults(data.offices ?? []);
        } else {
          setOfficeResults([]);
          setOfficeApiError(data.error?.message ?? 'Не успяхме да заредим офисите.');
        }
      }
      if (!cancelled) setLoadingOffices(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [cityId, debouncedOfficeQ, isOffice]);

  // Auto-select city when search returns a clear match (typing alone is not enough without Econt city id)
  useEffect(() => {
    if (cityId || debouncedCityQ.length < 2 || !cityResults.length) return;
    const q = debouncedCityQ.toLowerCase();
    const exact =
      cityResults.find((c) => c.name.toLowerCase() === q) ??
      cityResults.find((c) => (c.nameEn ?? '').toLowerCase() === q);
    const pick = exact ?? (cityResults.length === 1 ? cityResults[0] : null);
    if (!pick) return;
    patch({
      receiverCityId: pick.id,
      receiverCityName: pick.name,
    });
    setCityQuery(pick.name);
    if (isOffice) setOfficeOpen(true);
  }, [cityId, cityResults, debouncedCityQ, isOffice, patch]);

  // Seed city from order on first open
  useEffect(() => {
    if (seededCity.current || value.receiverCityId) return;
    const seed = (initialCityName ?? '').trim();
    if (seed.length < 2) return;
    seededCity.current = true;
    setCityQuery(seed);
    (async () => {
      const params = new URLSearchParams({ q: seed });
      const res = await fetch(`/api/admin/econt/cities?${params}`, { headers: await adminAuthHeaders() });
      const data = await res.json();
      if (!data.success || !data.cities?.length) return;
      const norm = seed.toLowerCase();
      const match =
        data.cities.find((c: EcontCity) => c.name.toLowerCase() === norm) ??
        data.cities.find((c: EcontCity) => (c.nameEn ?? '').toLowerCase() === norm) ??
        data.cities[0];
      if (match) {
        patch({
          receiverCityId: match.id,
          receiverCityName: match.name,
        });
        setCityQuery(match.name);
      }
    })();
  }, [initialCityName, patch, value.receiverCityId]);

  useEffect(() => {
    if (!isOffice || seededOffice.current || value.receiverOfficeCode || !cityId) return;
    const hint = (initialOfficeHint ?? '').trim();
    if (!hint) return;
    seededOffice.current = true;
    setOfficeQuery(hint);
    (async () => {
      const params = new URLSearchParams({ cityId: String(cityId), q: hint });
      const res = await fetch(`/api/admin/econt/offices?${params}`, { headers: await adminAuthHeaders() });
      const data = await res.json();
      if (!data.success || !data.offices?.length) return;
      const lower = hint.toLowerCase();
      const match =
        data.offices.find((o: EcontOffice) => o.code === hint) ??
        data.offices.find((o: EcontOffice) => o.name.toLowerCase().includes(lower)) ??
        data.offices[0];
      if (match) {
        patch({
          receiverOfficeCode: match.code,
          receiverOfficeName: match.name,
          receiverOfficeAddress: formatEcontOfficeAddress(match) || undefined,
        });
        setOfficeQuery(`${match.name} (${match.code})`);
      }
    })();
  }, [cityId, initialOfficeHint, isOffice, patch, value.receiverOfficeCode]);

  useEffect(() => {
    if (isOffice) return;
    if (value.receiverAddress || !initialAddress) return;
    patch({ receiverAddress: initialAddress });
  }, [initialAddress, isOffice, patch, value.receiverAddress]);

  const cityPicker = (
    <div className="relative">
      <label className="mb-1 block text-xs text-gray-600">Град / населено място (Econt) *</label>
      <input
        className="w-full rounded-lg border px-3 py-2 text-sm"
        placeholder="Започнете да пишете и изберете от списъка..."
        value={cityQuery}
        onChange={(e) => {
          setCityQuery(e.target.value);
          patch({
            receiverCityId: undefined,
            receiverCityName: undefined,
            ...(isOffice
              ? { receiverOfficeCode: undefined, receiverOfficeName: undefined, receiverOfficeAddress: undefined }
              : {}),
          });
          if (isOffice) setOfficeQuery('');
          setCityOpen(true);
        }}
        onFocus={() => setCityOpen(true)}
        onBlur={() => setTimeout(() => setCityOpen(false), 150)}
      />
      {cityApiError && <p className="mt-1 text-xs text-red-600">{cityApiError}</p>}
      {!cityId && !cityApiError && debouncedCityQ.length >= 2 && !loadingCities && cityResults.length === 0 && (
        <p className="mt-1 text-xs text-amber-700">Няма намерени градове — изберете от списъка на Econt.</p>
      )}
      {cityId && <p className="mt-1 text-xs text-green-700">Град: {value.receiverCityName}</p>}
      {cityOpen && (cityResults.length > 0 || loadingCities) && (
        <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border bg-white text-sm shadow-md">
          {loadingCities && <li className="px-3 py-2 text-gray-500">Зареждане...</li>}
          {cityResults.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left hover:bg-gray-100"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  patch({
                    receiverCityId: c.id,
                    receiverCityName: c.name,
                    ...(isOffice
                      ? {
                          receiverOfficeCode: undefined,
                          receiverOfficeName: undefined,
                          receiverOfficeAddress: undefined,
                        }
                      : {}),
                  });
                  setCityQuery(c.name);
                  if (isOffice) {
                    setOfficeQuery('');
                    setOfficeOpen(true);
                  }
                  setCityOpen(false);
                }}
              >
                {c.name}
                {c.nameEn ? ` · ${c.nameEn}` : ''}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  if (!isOffice) {
    const addr = value.receiverAddress ?? initialAddress ?? {};
    return (
      <div className="mb-3 space-y-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
        <p className="text-sm font-medium">Адресна доставка (Econt) *</p>
        <p className="text-xs text-gray-600">Изберете град от Econt и проверете улица/номер от поръчката.</p>
        {cityPicker}
        <input
          className="w-full rounded-lg border px-3 py-2 text-sm"
          placeholder="Улица"
          value={addr.street ?? ''}
          onChange={(e) => patch({ receiverAddress: { ...addr, street: e.target.value } })}
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            className="rounded-lg border px-3 py-2 text-sm"
            placeholder="№"
            value={addr.num ?? ''}
            onChange={(e) => patch({ receiverAddress: { ...addr, num: e.target.value } })}
          />
          <input
            className="rounded-lg border px-3 py-2 text-sm"
            placeholder="Вх./ет./ап."
            value={addr.other ?? ''}
            onChange={(e) => patch({ receiverAddress: { ...addr, other: e.target.value } })}
          />
        </div>
        {!cityId && (
          <p className="text-xs text-amber-700">Изберете град от списъка — Econt изисква официален city id.</p>
        )}
      </div>
    );
  }

  return (
    <div className="mb-3 space-y-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
      <p className="text-sm font-medium">
        {isSender ? 'Офис на подателя (Econt) *' : 'Офис на получателя (Econt) *'}
      </p>
      {cityPicker}

      <div className="relative">
        <label className="mb-1 block text-xs text-gray-600">Офис (име, адрес или код)</label>
        <input
          className="w-full rounded-lg border px-3 py-2 text-sm disabled:bg-gray-100"
          placeholder={cityId ? 'Търсене в офисите на града...' : 'Първо изберете град'}
          disabled={!cityId}
          value={officeQuery}
          onChange={(e) => {
            setOfficeQuery(e.target.value);
            patch({ receiverOfficeCode: undefined, receiverOfficeName: undefined });
            setOfficeOpen(true);
          }}
          onFocus={() => cityId && setOfficeOpen(true)}
          onBlur={() => setTimeout(() => setOfficeOpen(false), 150)}
        />
        {officeApiError && <p className="mt-1 text-xs text-red-600">{officeApiError}</p>}
        {!cityId && (
          <p className="mt-1 text-xs text-gray-500">Офисът се активира след като Econt разпознае града (кликнете град от списъка).</p>
        )}
        {officeOpen && cityId && (officeResults.length > 0 || loadingOffices) && (
          <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border bg-white text-sm shadow-md">
            {loadingOffices && <li className="px-3 py-2 text-gray-500">Зареждане...</li>}
            {officeResults.map((o) => {
              const addr = formatEcontOfficeAddress(o);
              return (
              <li key={o.code}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left hover:bg-gray-100"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    patch({
                      receiverOfficeCode: o.code,
                      receiverOfficeName: o.name,
                      receiverOfficeAddress: addr || undefined,
                    });
                    setOfficeQuery(addr ? `${o.name} — ${addr} (${o.code})` : `${o.name} (${o.code})`);
                    setOfficeOpen(false);
                  }}
                >
                  <span className="font-medium">{o.name}</span>
                  <span className="text-gray-500"> · код {o.code}</span>
                  {addr ? <span className="mt-0.5 block text-xs text-gray-600">{addr}</span> : null}
                </button>
              </li>
            );})}
          </ul>
        )}
      </div>

      {value.receiverOfficeCode ? (
        <p className="text-xs text-green-700">
          Избран: {value.receiverOfficeName} (код {value.receiverOfficeCode})
          {value.receiverOfficeAddress ? (
            <span className="block text-green-800/90">{value.receiverOfficeAddress}</span>
          ) : null}
        </p>
      ) : (
        <p className="text-xs text-amber-700">Изберете офис от списъка — необходимо за валидация.</p>
      )}
    </div>
  );
}

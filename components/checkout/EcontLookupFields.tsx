'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { PublicEcontCity, PublicEcontOffice } from '@/lib/econt/city-search';

type Props = {
  deliveryType: string;
  showCity?: boolean;
  showOffice?: boolean;
  cityId?: number | null;
  cityName: string;
  officeCode?: string;
  officeName?: string;
  cityError?: string;
  officeError?: string;
  onCityChange: (city: { id: number; name: string } | null) => void;
  onOfficeChange: (office: { code: string; name: string } | null) => void;
};

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

const fieldClass =
  'w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7d8461]/25 focus:border-[#7d8461]';

export default function EcontLookupFields({
  deliveryType,
  showCity = true,
  showOffice,
  cityId,
  cityName,
  officeCode,
  officeName,
  cityError,
  officeError,
  onCityChange,
  onOfficeChange,
}: Props) {
  const cityListId = useId();
  const officeListId = useId();
  const cityBoxRef = useRef<HTMLDivElement>(null);
  const officeBoxRef = useRef<HTMLDivElement>(null);
  const [cityQuery, setCityQuery] = useState(cityName);
  const [officeQuery, setOfficeQuery] = useState(officeName || '');
  const [cities, setCities] = useState<PublicEcontCity[]>([]);
  const [offices, setOffices] = useState<PublicEcontOffice[]>([]);
  const [cityOpen, setCityOpen] = useState(false);
  const [officeOpen, setOfficeOpen] = useState(false);
  const [cityIndex, setCityIndex] = useState(0);
  const [officeIndex, setOfficeIndex] = useState(0);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingOffices, setLoadingOffices] = useState(false);
  const [cityApiError, setCityApiError] = useState<string | null>(null);
  const [officeApiError, setOfficeApiError] = useState<string | null>(null);
  const debouncedCity = useDebounced(cityQuery.trim(), 280);
  const debouncedOffice = useDebounced(officeQuery.trim(), 280);
  const isOfficeDelivery = showOffice ?? deliveryType === 'office';

  useEffect(() => {
    setCityQuery(cityName);
  }, [cityName, cityId]);

  useEffect(() => {
    if (officeCode && officeName) setOfficeQuery(officeName);
    if (!officeCode) setOfficeQuery('');
  }, [officeCode, officeName]);

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (cityBoxRef.current && !cityBoxRef.current.contains(target)) setCityOpen(false);
      if (officeBoxRef.current && !officeBoxRef.current.contains(target)) setOfficeOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    if (!showCity) return;
    let cancelled = false;
    if (debouncedCity.length < 2) {
      setCities([]);
      setCityApiError(null);
      return;
    }
    setLoadingCities(true);
    setCityApiError(null);
    fetch(`/api/econt/cities?q=${encodeURIComponent(debouncedCity)}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.success) {
          setCities(data.cities ?? []);
          setCityIndex(0);
        } else {
          setCities([]);
          setCityApiError(data.error ?? 'В момента не можем да заредим офисите на Еконт. Опитайте отново.');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCities([]);
          setCityApiError('В момента не можем да заредим офисите на Еконт. Опитайте отново.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingCities(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedCity, showCity]);

  useEffect(() => {
    if (!isOfficeDelivery || !cityId) {
      setOffices([]);
      return;
    }
    let cancelled = false;
    setLoadingOffices(true);
    setOfficeApiError(null);
    const params = new URLSearchParams({ cityId: String(cityId), q: debouncedOffice });
    fetch(`/api/econt/offices?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.success) {
          setOffices(data.offices ?? []);
          setOfficeIndex(0);
        } else {
          setOffices([]);
          setOfficeApiError(data.error ?? 'В момента не можем да заредим офисите на Еконт. Опитайте отново.');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setOffices([]);
          setOfficeApiError('В момента не можем да заредим офисите на Еконт. Опитайте отново.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingOffices(false);
      });
    return () => {
      cancelled = true;
    };
  }, [cityId, debouncedOffice, isOfficeDelivery]);

  const selectCity = (city: PublicEcontCity) => {
    onCityChange({ id: city.id, name: city.name });
    setCityQuery(city.label);
    setCityOpen(false);
  };

  const selectOffice = (office: PublicEcontOffice) => {
    onOfficeChange({ code: office.code, name: office.name });
    setOfficeQuery(office.name);
    setOfficeOpen(false);
  };

  return (
    <div className="space-y-4">
      {showCity && <div ref={cityBoxRef} className="relative">
        <label className="block text-sm font-medium text-[#1a1a1a] mb-2" htmlFor="checkout-econt-city">
          Град *
        </label>
        <input
          id="checkout-econt-city"
          role="combobox"
          aria-expanded={cityOpen}
          aria-controls={cityListId}
          aria-autocomplete="list"
          autoComplete="off"
          value={cityQuery}
          placeholder="Започнете да пишете и изберете град"
          className={`${fieldClass} ${cityError ? 'border-red-500' : 'border-[#e8e4dc]'}`}
          onChange={(e) => {
            setCityQuery(e.target.value);
            onCityChange(null);
            setCityOpen(true);
          }}
          onFocus={() => setCityOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setCityOpen(true);
              setCityIndex((i) => Math.min(i + 1, Math.max(cities.length - 1, 0)));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setCityIndex((i) => Math.max(i - 1, 0));
            } else if (e.key === 'Enter' && cityOpen && cities[cityIndex]) {
              e.preventDefault();
              selectCity(cities[cityIndex]);
            } else if (e.key === 'Escape') {
              setCityOpen(false);
            }
          }}
        />
        {cityId && !cityError && (
          <p className="text-xs text-[#5f6b45] mt-1">Избран град: {cityName}</p>
        )}
        {(cityError || cityApiError) && (
          <p className="text-red-500 text-xs mt-1" data-checkout-field-error>
            {cityError || cityApiError}
          </p>
        )}
        {cityOpen && (
          <ul
            id={cityListId}
            role="listbox"
            className="absolute z-50 w-full mt-1 bg-white border border-[#e8e4dc] rounded-xl shadow-lg max-h-60 overflow-y-auto"
          >
            {loadingCities && <li className="px-3 py-2 text-sm text-[#6b6b6b]">Зареждане...</li>}
            {!loadingCities && debouncedCity.length < 2 && (
              <li className="px-3 py-2 text-sm text-[#6b6b6b]">Въведете поне 2 букви.</li>
            )}
            {!loadingCities && debouncedCity.length >= 2 && cities.length === 0 && (
              <li className="px-3 py-2 text-sm text-[#6b6b6b]">Няма намерени градове.</li>
            )}
            {cities.map((city, index) => (
              <li key={city.id} role="option" aria-selected={index === cityIndex}>
                <button
                  type="button"
                  className={`w-full text-left px-3 py-2 text-sm ${index === cityIndex ? 'bg-[#f9f7f2]' : ''}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectCity(city)}
                >
                  <span className="font-medium">{city.name}</span>
                  {city.postCode ? <span className="text-[#6b6b6b]"> · {city.postCode}</span> : null}
                  {city.regionName ? <span className="block text-xs text-[#6b6b6b]">{city.regionName}</span> : null}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>}

      {isOfficeDelivery && (
        <div ref={officeBoxRef} className="relative">
          <label className="block text-sm font-medium text-[#1a1a1a] mb-2" htmlFor="checkout-econt-office">
            Офис на Еконт *
          </label>
          <input
            id="checkout-econt-office"
            role="combobox"
            aria-expanded={officeOpen}
            aria-controls={officeListId}
            aria-autocomplete="list"
            autoComplete="off"
            disabled={!cityId}
            value={officeQuery}
            placeholder={cityId ? 'Търсете и изберете офис' : 'Първо изберете град'}
            className={`${fieldClass} disabled:bg-[#f4f1ea] ${officeError ? 'border-red-500' : 'border-[#e8e4dc]'}`}
            onChange={(e) => {
              setOfficeQuery(e.target.value);
              onOfficeChange(null);
              setOfficeOpen(true);
            }}
            onFocus={() => cityId && setOfficeOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setOfficeOpen(true);
                setOfficeIndex((i) => Math.min(i + 1, Math.max(offices.length - 1, 0)));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setOfficeIndex((i) => Math.max(i - 1, 0));
              } else if (e.key === 'Enter' && officeOpen && offices[officeIndex]) {
                e.preventDefault();
                selectOffice(offices[officeIndex]);
              } else if (e.key === 'Escape') {
                setOfficeOpen(false);
              }
            }}
          />
          {officeCode && !officeError && (
            <p className="text-xs text-[#5f6b45] mt-1">
              Избран офис: {officeName} ({officeCode})
            </p>
          )}
          {(officeError || officeApiError) && (
            <p className="text-red-500 text-xs mt-1" data-checkout-field-error>
              {officeError || officeApiError}
            </p>
          )}
          {officeOpen && cityId && (
            <ul
              id={officeListId}
              role="listbox"
              className="absolute z-50 w-full mt-1 bg-white border border-[#e8e4dc] rounded-xl shadow-lg max-h-60 overflow-y-auto"
            >
              {loadingOffices && <li className="px-3 py-2 text-sm text-[#6b6b6b]">Зареждане...</li>}
              {!loadingOffices && offices.length === 0 && (
                <li className="px-3 py-2 text-sm text-[#6b6b6b]">Няма намерени офиси за този град.</li>
              )}
              {offices.map((office, index) => (
                <li key={office.code} role="option" aria-selected={index === officeIndex}>
                  <button
                    type="button"
                    className={`w-full text-left px-3 py-2 text-sm ${index === officeIndex ? 'bg-[#f9f7f2]' : ''}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectOffice(office)}
                  >
                    <span className="font-medium">{office.name}</span>
                    <span className="text-[#6b6b6b]"> · {office.code}</span>
                    {office.address ? <span className="block text-xs text-[#6b6b6b]">{office.address}</span> : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

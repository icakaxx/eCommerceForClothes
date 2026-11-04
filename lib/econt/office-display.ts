import type { EcontOffice } from '@/lib/econt/types';

type EcontOfficeAddress = {
  fullAddress?: string;
  fullAddressEn?: string;
  street?: string;
  num?: string;
  other?: string;
  quarter?: string;
};

/** Human-readable office address from Econt nomenclatures (fullAddress or street/num). */
export function formatEcontOfficeAddress(
  office: Pick<EcontOffice, 'address' | 'name'>,
  preferEn = false
): string {
  const addr = office.address as EcontOfficeAddress | undefined;
  if (!addr) return '';

  const full = preferEn ? addr.fullAddressEn?.trim() : addr.fullAddress?.trim();
  if (full) return full.replace(/^\s+/, '');

  const parts = [addr.quarter, addr.street, addr.num ? `№${addr.num}` : '', addr.other].filter(Boolean);
  return parts.join(' ').trim();
}

export function officeSearchHaystack(office: EcontOffice): string {
  const addr = formatEcontOfficeAddress(office);
  const addrEn = formatEcontOfficeAddress(office, true);
  return [office.name, office.nameEn ?? '', office.code, addr, addrEn].join(' ').toLowerCase();
}

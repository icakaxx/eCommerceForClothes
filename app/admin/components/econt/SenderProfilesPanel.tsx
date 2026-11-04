'use client';

import { useEffect, useState } from 'react';
import { adminAuthHeaders } from '@/lib/admin-auth-headers';
import { formatEur } from '@/lib/econt/money';
import { formatEcontOfficeAddress } from '@/lib/econt/office-display';
import EcontReceiverFields, { type ReceiverEcontSelection } from './EcontReceiverFields';

type Sender = {
  id: string;
  display_name: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string | null;
  city_name: string;
  city_id?: number;
  office_code: string;
  office_name: string;
  is_default: boolean;
  is_active: boolean;
};

type SenderProfilesPanelProps = {
  onSendersChanged?: () => void;
};

const emptyForm = () => ({
  displayName: '',
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  isDefault: true,
});

const emptyEcontSelection = (): ReceiverEcontSelection => ({});

function senderToEcontSelection(s: Sender): ReceiverEcontSelection {
  return {
    receiverCityId: s.city_id,
    receiverCityName: s.city_name,
    receiverOfficeCode: s.office_code,
    receiverOfficeName: s.office_name,
  };
}

function senderToForm(s: Sender) {
  return {
    displayName: s.display_name,
    firstName: s.first_name,
    lastName: s.last_name,
    phone: s.phone,
    email: s.email ?? '',
    isDefault: s.is_default,
  };
}

export default function SenderProfilesPanel({ onSendersChanged }: SenderProfilesPanelProps = {}) {
  const [senders, setSenders] = useState<Sender[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [econtOffice, setEcontOffice] = useState<ReceiverEcontSelection>(emptyEcontSelection);
  const [econtFieldsKey, setEcontFieldsKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/econt/senders', { headers: await adminAuthHeaders() });
    const data = await res.json();
    if (data.success) setSenders(data.senders ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = (opts?: { isDefault?: boolean }) => {
    setEditingId(null);
    setForm({ ...emptyForm(), isDefault: opts?.isDefault ?? true });
    setEcontOffice(emptyEcontSelection());
    setEcontFieldsKey((k) => k + 1);
  };

  const startEdit = (s: Sender) => {
    setError(null);
    setEditingId(s.id);
    setForm(senderToForm(s));
    setEcontOffice(senderToEcontSelection(s));
    setEcontFieldsKey((k) => k + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const applyLovechMarketPreset = async () => {
    setError(null);
    const headers = await adminAuthHeaders();
    const cityRes = await fetch('/api/admin/econt/cities?q=Ловеч', { headers });
    const cityData = await cityRes.json();
    if (!cityData.success || !cityData.cities?.length) {
      setError('Не успяхме да намерим град Ловеч в Econt — изберете град и офис ръчно.');
      return;
    }
    const norm = 'ловеч';
    const city =
      cityData.cities.find((c: { name: string }) => c.name.toLowerCase() === norm) ??
      cityData.cities.find((c: { nameEn?: string }) => (c.nameEn ?? '').toLowerCase() === 'lovech') ??
      cityData.cities[0];
    const officeRes = await fetch(
      `/api/admin/econt/offices?${new URLSearchParams({ cityId: String(city.id), q: 'пазар' })}`,
      { headers }
    );
    const officeData = await officeRes.json();
    const office =
      officeData.success && officeData.offices?.length
        ? officeData.offices.find((o: { code: string }) => o.code === '5503') ??
          officeData.offices.find((o: { name: string }) => o.name.toLowerCase().includes('пазар')) ??
          officeData.offices[0]
        : null;
    if (!office) {
      setEcontOffice({
        receiverCityId: city.id,
        receiverCityName: city.name,
      });
      setError('Градът е попълнен — изберете офис от списъка (напр. „пазар“).');
      return;
    }
    const addr = formatEcontOfficeAddress(office);
    setEcontOffice({
      receiverCityId: city.id,
      receiverCityName: city.name,
      receiverOfficeCode: office.code,
      receiverOfficeName: office.name,
      receiverOfficeAddress: addr || undefined,
    });
  };

  const buildPayload = () => ({
    displayName: form.displayName.trim(),
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    phone: form.phone.trim(),
    email: form.email.trim() || null,
    cityId: econtOffice.receiverCityId,
    cityName: econtOffice.receiverCityName ?? '',
    officeCode: econtOffice.receiverOfficeCode,
    officeName: econtOffice.receiverOfficeName ?? econtOffice.receiverOfficeCode,
    isDefault: form.isDefault,
  });

  const save = async () => {
    setError(null);
    if (!form.displayName.trim() || !form.firstName.trim() || !form.lastName.trim() || !form.phone.trim()) {
      setError('Попълнете показвано име, име, фамилия и телефон.');
      return;
    }
    if (!econtOffice.receiverCityId || !econtOffice.receiverOfficeCode) {
      setError('Изберете град и офис от Econt (както при получателя).');
      return;
    }
    setSaving(true);
    const payload = buildPayload();
    const url = editingId ? `/api/admin/econt/senders/${editingId}` : '/api/admin/econt/senders';
    const res = await fetch(url, {
      method: editingId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json', ...(await adminAuthHeaders()) },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (!data.success) {
      const err = data.error;
      setError(
        typeof err === 'object' && err?.message
          ? `${err.title ? `${err.title}: ` : ''}${err.message}${err.suggestion ? ` — ${err.suggestion}` : ''}`
          : String(data.error ?? 'Грешка')
      );
      return;
    }
    resetForm({ isDefault: false });
    await load();
    onSendersChanged?.();
  };

  const remove = async (s: Sender) => {
    if (
      !window.confirm(
        `Деактивиране на подател „${s.display_name}"?\n\nПрофилът няма да се показва в списъците, но старите товарителници запазват snapshot.`
      )
    ) {
      return;
    }
    setError(null);
    setDeletingId(s.id);
    const res = await fetch(`/api/admin/econt/senders/${s.id}`, {
      method: 'DELETE',
      headers: await adminAuthHeaders(),
    });
    const data = await res.json();
    setDeletingId(null);
    if (!data.success) {
      setError('Не успяхме да изтрием профила.');
      return;
    }
    if (editingId === s.id) resetForm();
    await load();
    onSendersChanged?.();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Управление на податели</h2>
      {editingId && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Редактирате профил — промените се записват с „Запази промените“.
          <button type="button" className="ml-2 underline" onClick={() => resetForm()}>
            Отказ
          </button>
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <input
          className="border rounded-lg px-3 py-2 text-sm"
          placeholder="Показвано име"
          value={form.displayName}
          onChange={(e) => setForm({ ...form, displayName: e.target.value })}
        />
        <input
          className="border rounded-lg px-3 py-2 text-sm"
          placeholder="Име"
          value={form.firstName}
          onChange={(e) => setForm({ ...form, firstName: e.target.value })}
        />
        <input
          className="border rounded-lg px-3 py-2 text-sm"
          placeholder="Фамилия"
          value={form.lastName}
          onChange={(e) => setForm({ ...form, lastName: e.target.value })}
        />
        <input
          className="border rounded-lg px-3 py-2 text-sm"
          placeholder="Телефон"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <input
          className="border rounded-lg px-3 py-2 text-sm md:col-span-2"
          placeholder="Имейл (по избор)"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </div>

      <EcontReceiverFields
        key={econtFieldsKey}
        role="sender"
        deliveryType="office"
        value={econtOffice}
        onChange={setEcontOffice}
      />

      <div className="flex flex-wrap items-center gap-4 text-sm">
        <button
          type="button"
          className="rounded-lg border px-3 py-1.5 hover:bg-gray-50"
          onClick={() => void applyLovechMarketPreset()}
        >
          Бърз избор: Ловеч — офис пазар
        </button>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.isDefault}
            onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
          />
          Подател по подразбиране
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="rounded-lg bg-black px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          {saving ? 'Запис...' : editingId ? 'Запази промените' : 'Добави подател'}
        </button>
        {editingId && (
          <button type="button" onClick={() => resetForm()} className="rounded-lg border px-4 py-2 text-sm">
            Отказ
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Зареждане...</p>
      ) : (
        <ul className="divide-y rounded-xl border">
          {senders.filter((s) => s.is_active).map((s) => (
            <li key={s.id} className="flex flex-wrap items-start justify-between gap-2 px-4 py-3 text-sm">
              <div>
                <div className="font-medium">
                  {s.display_name} {s.is_default ? '(по подразбиране)' : ''}
                </div>
                <div>
                  {s.first_name} {s.last_name} · {s.phone}
                </div>
                <div>
                  {s.city_name} · {s.office_name} ({s.office_code})
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  className="rounded-lg border px-3 py-1 text-xs hover:bg-gray-50"
                  onClick={() => startEdit(s)}
                >
                  Редактирай
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-red-200 px-3 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
                  disabled={deletingId === s.id}
                  onClick={() => void remove(s)}
                >
                  {deletingId === s.id ? '...' : 'Изтрий'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function useSenderOptions() {
  const [senders, setSenders] = useState<Sender[]>([]);
  const [loading, setLoading] = useState(true);

  const reloadSenders = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/econt/senders', { headers: await adminAuthHeaders() });
    const data = await res.json();
    if (data.success) {
      setSenders((data.senders ?? []).filter((s: Sender) => s.is_active));
    }
    setLoading(false);
  };

  useEffect(() => {
    reloadSenders();
  }, []);

  return { senders, reloadSenders, loadingSenders: loading };
}

export { formatEur };

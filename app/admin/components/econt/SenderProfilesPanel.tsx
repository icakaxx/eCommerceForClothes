'use client';

import { useEffect, useState } from 'react';
import { adminAuthHeaders } from '@/lib/admin-auth-headers';
import { formatEur } from '@/lib/econt/money';

type Sender = {
  id: string;
  display_name: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
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

export default function SenderProfilesPanel({ onSendersChanged }: SenderProfilesPanelProps = {}) {
  const [senders, setSenders] = useState<Sender[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    displayName: '',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    useLovechDefault: true,
    isDefault: true,
  });
  const [error, setError] = useState<string | null>(null);

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

  const save = async () => {
    setError(null);
    const res = await fetch('/api/admin/econt/senders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await adminAuthHeaders()) },
      body: JSON.stringify({
        displayName: form.displayName,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        email: form.email || null,
        useLovechDefault: form.useLovechDefault,
        isDefault: form.isDefault,
      }),
    });
    const data = await res.json();
    if (!data.success) {
      const err = data.error;
      setError(
        typeof err === 'object' && err?.message
          ? `${err.title ? `${err.title}: ` : ''}${err.message}${err.suggestion ? ` — ${err.suggestion}` : ''}`
          : String(data.error ?? 'Грешка')
      );
      return;
    }
    setForm({ displayName: '', firstName: '', lastName: '', phone: '', email: '', useLovechDefault: true, isDefault: false });
    await load();
    onSendersChanged?.();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Управление на податели</h2>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Показвано име" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
        <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Име" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
        <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Фамилия" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
        <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Телефон" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Имейл (по избор)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.useLovechDefault} onChange={(e) => setForm({ ...form, useLovechDefault: e.target.checked })} />
        Автоматично офис „Ловеч Пазара“ (Econt Demo lookup)
      </label>
      <button type="button" onClick={save} className="rounded-lg bg-black px-4 py-2 text-sm text-white">
        Добави подател
      </button>
      {loading ? (
        <p className="text-sm text-gray-500">Зареждане...</p>
      ) : (
        <ul className="divide-y rounded-xl border">
          {senders.filter((s) => s.is_active).map((s) => (
            <li key={s.id} className="px-4 py-3 text-sm">
              <div className="font-medium">{s.display_name} {s.is_default ? '(по подразбиране)' : ''}</div>
              <div>{s.first_name} {s.last_name} · {s.phone}</div>
              <div>{s.city_name} · {s.office_name} ({s.office_code})</div>
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

'use client';

import { useEffect, useState } from 'react';
import { adminAuthHeaders } from '@/lib/admin-auth-headers';

export default function EcontDemoBanner() {
  const [state, setState] = useState<'loading' | 'missing' | 'demo' | 'production'>('loading');

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/admin/econt/status', { headers: await adminAuthHeaders() });
      const data = await res.json();
      if (!data.configured) {
        setState('missing');
        return;
      }
      setState(data.environment === 'production' ? 'production' : 'demo');
    })();
  }, []);

  if (state === 'loading') return null;

  if (state === 'missing') {
    return (
      <div className="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-900">
        Econt не е конфигуриран — проверете ECONT_* и рестартирайте npm run dev.
      </div>
    );
  }

  if (state === 'production') {
    return (
      <div className="mb-4 rounded-xl border border-red-400 bg-red-50 px-4 py-2 text-sm font-semibold text-red-900">
        ECONT PRODUCTION — реални пратки и таксуване (ee.econt.com)
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900">
      ECONT DEMO — тестова среда (demo.econt.com)
    </div>
  );
}

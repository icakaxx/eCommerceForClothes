'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminPanel from '@/components/AdminPanel';

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    localStorage.setItem('isAdmin', 'true');
  }, []);

  return <AdminPanel />;
}


'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminPanel from './components/AdminPanel';

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = () => {
      if (typeof window !== 'undefined') {
        const isLoggedIn = localStorage.getItem('admin_authenticated') === 'true';
        if (!isLoggedIn) {
          router.push('/admin/login');
        } else {
          setIsAuthenticated(true);
          localStorage.setItem('isAdmin', 'true');
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <AdminPanel />;
}


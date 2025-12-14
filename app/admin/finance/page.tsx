'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../components/AdminLayout';
import { getAdminSession } from '@/lib/auth';

interface FinancialData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  monthlyRevenue: number;
  pendingPayments: number;
}

export default function FinancePage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [financeData, setFinanceData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await getAdminSession();
        if (!session) {
          router.push('/admin/login');
          return;
        }
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/admin/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadFinanceData();
    }
  }, [isAuthenticated]);

  const loadFinanceData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/finance');
      const result = await response.json();
      if (result.success) {
        setFinanceData(result.data);
      }
    } catch (error) {
      console.error('Failed to load finance data:', error);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <AdminLayout currentPath="/admin/finance">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Finance</h1>
          <p className="text-gray-600 mt-2">Financial overview and revenue tracking</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading financial data...</p>
          </div>
        ) : financeData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900">Total Revenue</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">
                ${financeData.totalRevenue.toFixed(2)}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900">Total Orders</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {financeData.totalOrders}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900">Average Order Value</h3>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                ${financeData.averageOrderValue.toFixed(2)}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900">Monthly Revenue</h3>
              <p className="text-3xl font-bold text-orange-600 mt-2">
                ${financeData.monthlyRevenue.toFixed(2)}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900">Pending Payments</h3>
              <p className="text-3xl font-bold text-yellow-600 mt-2">
                ${financeData.pendingPayments.toFixed(2)}
              </p>
              <p className="text-sm text-gray-500 mt-1">Awaiting payment processing</p>
            </div>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <p className="text-gray-500">Unable to load financial data</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
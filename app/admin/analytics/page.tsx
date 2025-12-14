'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../components/AdminLayout';
import { getAdminSession } from '@/lib/auth';

interface AnalyticsData {
  totalOrders?: number;
  totalRevenue?: number;
  totalCustomers?: number;
  averageOrderValue?: number;
  salesByDay?: any[];
  topProducts?: any[];
  salesByStatus?: any[];
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

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
      loadAnalytics();
    }
  }, [isAuthenticated]);

  const loadAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/analytics');
      const result = await response.json();
      if (result.success) {
        setAnalyticsData(result.data);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
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
    <AdminLayout currentPath="/admin/analytics">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-gray-600 mt-2">View your store's performance metrics</p>
        </div>

        {analyticsData ? (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900">Общо поръчки</h3>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {analyticsData.totalOrders || 0}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900">Общо приходи</h3>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  ${(analyticsData.totalRevenue || 0).toFixed(2)}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900">Общо клиенти</h3>
                <p className="text-3xl font-bold text-purple-600 mt-2">
                  {analyticsData.totalCustomers || 0}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900">Средна стойност на поръчка</h3>
                <p className="text-3xl font-bold text-orange-600 mt-2">
                  ${(analyticsData.averageOrderValue || 0).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Sales by Status */}
            {analyticsData.salesByStatus && analyticsData.salesByStatus.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Sales by Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analyticsData.salesByStatus.map((status, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <h4 className="font-medium text-gray-900 capitalize">{status.status}</h4>
                      <p className="text-2xl font-bold text-blue-600">{status.count}</p>
                      <p className="text-sm text-gray-500">{status.revenue.toFixed(2)} лв</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Products */}
            {analyticsData.topProducts && analyticsData.topProducts.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Топ продукти</h3>
                <div className="space-y-3">
                  {analyticsData.topProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500">{product.quantity} продадени</p>
                      </div>
                      <p className="font-semibold text-green-600">{product.revenue.toFixed(2)} лв</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sales by Day (last 30 days) */}
            {analyticsData.salesByDay && analyticsData.salesByDay.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Последни продажби</h3>
                <div className="space-y-2">
                  {analyticsData.salesByDay.slice(-7).map((day, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border-b last:border-b-0">
                      <span className="text-sm text-gray-600">{new Date(day.date).toLocaleDateString()}</span>
                      <div className="text-right">
                        <span className="text-sm font-medium">{day.orders} поръчки</span>
                        <span className="text-sm text-gray-500 ml-4">{day.sales.toFixed(2)} лв</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <p className="text-gray-500">Зареждане на аналитични данни...</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
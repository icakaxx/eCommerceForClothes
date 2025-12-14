'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Package, DollarSign, Users, Calendar } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';
import AdminLayout from '../components/AdminLayout';

interface AnalyticsData {
  total_sales: number;
  total_orders: number;
  total_customers: number;
  average_order_value: number;
  sales_by_day: Array<{ date: string; sales: number; orders: number }>;
  top_products: Array<{ name: string; quantity: number; revenue: number }>;
  sales_by_status: Array<{ status: string; count: number; revenue: number }>;
}

export default function AnalyticsPage() {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const t = translations[language];
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'year' | 'all'>('month');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/admin/analytics?period=${period}`);
      const result = await response.json();

      if (result.success) {
        setAnalytics(result.analytics);
      } else {
        console.error('Failed to fetch analytics:', result.error);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'bg' ? 'bg-BG' : 'en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getMaxValue = (data: number[]) => {
    return Math.max(...data, 1);
  };

  if (loading) {
    return (
      <AdminLayout currentPath="/admin/analytics">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!analytics) {
    return (
      <AdminLayout currentPath="/admin/analytics">
        <div className="flex items-center justify-center min-h-screen">
          <p style={{ color: theme.colors.textSecondary }}>{t.noAnalyticsData}</p>
        </div>
      </AdminLayout>
    );
  }

  const salesValues = analytics.sales_by_day.map(d => d.sales);
  const maxSales = getMaxValue(salesValues);

  return (
    <AdminLayout currentPath="/admin/analytics">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1
                className="text-2xl sm:text-3xl font-semibold transition-colors duration-300"
                style={{ color: theme.colors.text }}
              >
                {t.analytics}
              </h1>
              <p
                className="text-sm sm:text-base transition-colors duration-300 mt-1"
                style={{ color: theme.colors.textSecondary }}
              >
                {t.salesAnalytics}
              </p>
            </div>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="px-4 py-2 rounded-lg text-sm border transition-colors duration-300"
              style={{
                backgroundColor: theme.colors.cardBg,
                borderColor: theme.colors.border,
                color: theme.colors.text
              }}
            >
              <option value="week">{t.lastWeek}</option>
              <option value="month">{t.lastMonth}</option>
              <option value="year">{t.lastYear}</option>
              <option value="all">{t.allTime}</option>
            </select>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div
              className="rounded-lg shadow-sm p-4 sm:p-6 transition-colors duration-300"
              style={{
                backgroundColor: theme.colors.surface,
                boxShadow: theme.effects.shadow
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-sm font-medium"
                  style={{ color: theme.colors.textSecondary }}
                >
{t.totalSales}
                </span>
                <DollarSign size={20} style={{ color: theme.colors.primary }} />
              </div>
              <div
                className="text-2xl sm:text-3xl font-bold"
                style={{ color: theme.colors.text }}
              >
                €{analytics.total_sales.toFixed(2)}
              </div>
            </div>

            <div
              className="rounded-lg shadow-sm p-4 sm:p-6 transition-colors duration-300"
              style={{
                backgroundColor: theme.colors.surface,
                boxShadow: theme.effects.shadow
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-sm font-medium"
                  style={{ color: theme.colors.textSecondary }}
                >
{t.totalOrders}
                </span>
                <Package size={20} style={{ color: theme.colors.primary }} />
              </div>
              <div
                className="text-2xl sm:text-3xl font-bold"
                style={{ color: theme.colors.text }}
              >
                {analytics.total_orders}
              </div>
            </div>

            <div
              className="rounded-lg shadow-sm p-4 sm:p-6 transition-colors duration-300"
              style={{
                backgroundColor: theme.colors.surface,
                boxShadow: theme.effects.shadow
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-sm font-medium"
                  style={{ color: theme.colors.textSecondary }}
                >
{t.customers}
                </span>
                <Users size={20} style={{ color: theme.colors.primary }} />
              </div>
              <div
                className="text-2xl sm:text-3xl font-bold"
                style={{ color: theme.colors.text }}
              >
                {analytics.total_customers}
              </div>
            </div>

            <div
              className="rounded-lg shadow-sm p-4 sm:p-6 transition-colors duration-300"
              style={{
                backgroundColor: theme.colors.surface,
                boxShadow: theme.effects.shadow
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-sm font-medium"
                  style={{ color: theme.colors.textSecondary }}
                >
{t.avgOrderValue}
                </span>
                <TrendingUp size={20} style={{ color: theme.colors.primary }} />
              </div>
              <div
                className="text-2xl sm:text-3xl font-bold"
                style={{ color: theme.colors.text }}
              >
                €{analytics.average_order_value.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Sales Chart */}
          <div
            className="rounded-lg shadow-sm p-4 sm:p-6 mb-6 transition-colors duration-300"
            style={{
              backgroundColor: theme.colors.surface,
              boxShadow: theme.effects.shadow
            }}
          >
            <h2
              className="text-lg font-semibold mb-4"
              style={{ color: theme.colors.text }}
            >
{t.salesOverTime}
            </h2>
            <div className="space-y-3">
              {analytics.sales_by_day.map((day, index) => {
                const height = (day.sales / maxSales) * 100;
                return (
                  <div key={index} className="flex items-end gap-2">
                    <div className="w-16 sm:w-24 text-xs" style={{ color: theme.colors.textSecondary }}>
                      {formatDate(day.date)}
                    </div>
                    <div className="flex-1 flex items-end gap-1">
                      <div className="flex-1 relative">
                        <div
                          className="rounded-t transition-all duration-300"
                          style={{
                            height: `${Math.max(height, 5)}px`,
                            backgroundColor: theme.colors.primary,
                            minHeight: '4px'
                          }}
                        />
                      </div>
                      <div className="w-16 sm:w-20 text-xs text-right" style={{ color: theme.colors.text }}>
                        €{day.sales.toFixed(0)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales by Status */}
            <div
              className="rounded-lg shadow-sm p-4 sm:p-6 transition-colors duration-300"
              style={{
                backgroundColor: theme.colors.surface,
                boxShadow: theme.effects.shadow
              }}
            >
              <h2
                className="text-lg font-semibold mb-4"
                style={{ color: theme.colors.text }}
              >
{t.salesByStatus}
              </h2>
              <div className="space-y-3">
                {analytics.sales_by_status.map((status, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm capitalize" style={{ color: theme.colors.text }}>
                        {status.status}
                      </span>
                      <span className="text-sm font-medium" style={{ color: theme.colors.text }}>
                        {status.count} {t.ordersText} • €{status.revenue.toFixed(2)}
                      </span>
                    </div>
                    <div
                      className="h-2 rounded-full overflow-hidden"
                      style={{ backgroundColor: theme.colors.secondary }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${(status.count / analytics.total_orders) * 100}%`,
                          backgroundColor: theme.colors.primary
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Products */}
            <div
              className="rounded-lg shadow-sm p-4 sm:p-6 transition-colors duration-300"
              style={{
                backgroundColor: theme.colors.surface,
                boxShadow: theme.effects.shadow
              }}
            >
              <h2
                className="text-lg font-semibold mb-4"
                style={{ color: theme.colors.text }}
              >
{t.topProducts}
              </h2>
              <div className="space-y-3">
                {analytics.top_products.length > 0 ? (
                  analytics.top_products.map((product, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg"
                      style={{ backgroundColor: theme.colors.cardBg }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm mb-1" style={{ color: theme.colors.text }}>
                          {product.name}
                        </div>
                        <div className="text-xs" style={{ color: theme.colors.textSecondary }}>
                          {product.quantity} {t.sold}
                        </div>
                      </div>
                      <div className="text-sm font-semibold" style={{ color: theme.colors.text }}>
                        €{product.revenue.toFixed(2)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Package
                      size={32}
                      className="mx-auto mb-2"
                      style={{ color: theme.colors.textSecondary }}
                    />
                    <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
{t.noProductData}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}


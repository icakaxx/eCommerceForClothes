'use client';

import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Calendar, Package, CreditCard, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';
import AdminLayout from '../components/AdminLayout';

interface FinanceSummary {
  total_revenue: number;
  total_orders: number;
  average_order_value: number;
  total_delivery_cost: number;
  net_revenue: number;
  revenue_change: number;
  orders_change: number;
}

interface Transaction {
  orderid: string;
  date: string;
  customer: string;
  amount: number;
  status: string;
  type: 'order' | 'refund';
}

export default function FinancePage() {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const t = translations[language];
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('month');

  useEffect(() => {
    fetchFinanceData();
  }, [period]);

  const fetchFinanceData = async () => {
    try {
      const response = await fetch(`/api/admin/finance?period=${period}`);
      const result = await response.json();

      if (result.success) {
        setSummary(result.summary);
        setTransactions(result.transactions || []);
      } else {
        console.error('Failed to fetch finance data:', result.error);
      }
    } catch (error) {
      console.error('Error fetching finance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'bg' ? 'bg-BG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <AdminLayout currentPath="/admin/finance">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentPath="/admin/finance">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1
                className="text-2xl sm:text-3xl font-semibold transition-colors duration-300"
                style={{ color: theme.colors.text }}
              >
                {t.finance}
              </h1>
              <p
                className="text-sm sm:text-base transition-colors duration-300 mt-1"
                style={{ color: theme.colors.textSecondary }}
              >
                {t.financialOverview}
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
              <option value="today">{t.today}</option>
              <option value="week">{t.thisWeek}</option>
              <option value="month">{t.thisMonth}</option>
              <option value="year">{t.thisYear}</option>
              <option value="all">{t.allTime}</option>
            </select>
          </div>

          {/* Summary Cards */}
          {summary && (
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
                    {t.totalRevenue}
                  </span>
                  <DollarSign size={20} style={{ color: theme.colors.primary }} />
                </div>
                <div
                  className="text-2xl sm:text-3xl font-bold mb-1"
                  style={{ color: theme.colors.text }}
                >
                  €{summary.total_revenue.toFixed(2)}
                </div>
                <div className="flex items-center gap-1 text-xs">
                  {summary.revenue_change >= 0 ? (
                    <>
                      <TrendingUp size={14} className="text-green-600" />
                      <span className="text-green-600">
                        +{summary.revenue_change.toFixed(1)}%
                      </span>
                    </>
                  ) : (
                    <>
                      <TrendingDown size={14} className="text-red-600" />
                      <span className="text-red-600">
                        {summary.revenue_change.toFixed(1)}%
                      </span>
                    </>
                  )}
                  <span style={{ color: theme.colors.textSecondary }}>{t.vsPreviousPeriod}</span>
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
                    {t.netRevenue}
                  </span>
                  <TrendingUp size={20} style={{ color: theme.colors.primary }} />
                </div>
                <div
                  className="text-2xl sm:text-3xl font-bold mb-1"
                  style={{ color: theme.colors.text }}
                >
                  €{summary.net_revenue.toFixed(2)}
                </div>
                  <div
                    className="text-xs"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    {t.afterDeliveryCosts}
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
                  className="text-2xl sm:text-3xl font-bold mb-1"
                  style={{ color: theme.colors.text }}
                >
                  {summary.total_orders}
                </div>
                <div className="flex items-center gap-1 text-xs">
                  {summary.orders_change >= 0 ? (
                    <>
                      <TrendingUp size={14} className="text-green-600" />
                      <span className="text-green-600">
                        +{summary.orders_change.toFixed(1)}%
                      </span>
                    </>
                  ) : (
                    <>
                      <TrendingDown size={14} className="text-red-600" />
                      <span className="text-red-600">
                        {summary.orders_change.toFixed(1)}%
                      </span>
                    </>
                  )}
                  <span style={{ color: theme.colors.textSecondary }}>{t.vsPreviousPeriod}</span>
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
                  <CreditCard size={20} style={{ color: theme.colors.primary }} />
                </div>
                <div
                  className="text-2xl sm:text-3xl font-bold mb-1"
                  style={{ color: theme.colors.text }}
                >
                  €{summary.average_order_value.toFixed(2)}
                </div>
                  <div
                    className="text-xs"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    {t.perOrder}
                  </div>
              </div>
            </div>
          )}

          {/* Transactions */}
          <div
            className="rounded-lg shadow-sm overflow-hidden transition-colors duration-300"
            style={{
              backgroundColor: theme.colors.surface,
              boxShadow: theme.effects.shadow
            }}
          >
            <div className="p-4 sm:p-6 border-b" style={{ borderColor: theme.colors.border }}>
              <h2
                className="text-lg font-semibold"
                style={{ color: theme.colors.text }}
              >
                {t.recentTransactions}
              </h2>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden">
              <div className="divide-y" style={{ borderColor: theme.colors.border }}>
                {transactions.slice(0, 10).map((transaction) => (
                  <div
                    key={transaction.orderid}
                    className="p-4 transition-colors duration-300"
                    style={{
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border
                    }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {transaction.type === 'order' ? (
                            <ArrowUpRight size={16} className="text-green-600" />
                          ) : (
                            <ArrowDownRight size={16} className="text-red-600" />
                          )}
                          <span
                            className="font-medium text-sm"
                            style={{ color: theme.colors.text }}
                          >
                            {transaction.orderid}
                          </span>
                        </div>
                        <div className="text-xs mb-1" style={{ color: theme.colors.textSecondary }}>
                          {transaction.customer}
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <Calendar size={12} style={{ color: theme.colors.textSecondary }} />
                          <span style={{ color: theme.colors.textSecondary }}>
                            {formatDate(transaction.date)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-sm font-semibold ${
                            transaction.type === 'order' ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {transaction.type === 'order' ? '+' : '-'}€{transaction.amount.toFixed(2)}
                        </div>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: theme.colors.secondary,
                            color: theme.colors.textSecondary
                          }}
                        >
                          {transaction.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead
                  className="border-b transition-colors duration-300"
                  style={{
                    backgroundColor: theme.colors.secondary,
                    borderColor: theme.colors.border
                  }}
                >
                  <tr>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase transition-colors duration-300" style={{ color: theme.colors.textSecondary }}>
                      {t.date}
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase transition-colors duration-300" style={{ color: theme.colors.textSecondary }}>
                      {t.orderId}
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase transition-colors duration-300" style={{ color: theme.colors.textSecondary }}>
                      {t.customer}
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase transition-colors duration-300" style={{ color: theme.colors.textSecondary }}>
                      {t.type}
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase transition-colors duration-300" style={{ color: theme.colors.textSecondary }}>
                      {t.amount}
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase transition-colors duration-300" style={{ color: theme.colors.textSecondary }}>
                      {t.status}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: theme.colors.border }}>
                  {transactions.slice(0, 20).map((transaction) => (
                    <tr
                      key={transaction.orderid}
                      className="transition-colors duration-300"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = theme.colors.secondary;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <td className="px-4 lg:px-6 py-4 text-sm" style={{ color: theme.colors.text }}>
                        {formatDate(transaction.date)}
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <span className="font-medium text-sm" style={{ color: theme.colors.text }}>
                          {transaction.orderid}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-sm" style={{ color: theme.colors.text }}>
                        {transaction.customer}
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="flex items-center gap-1">
                          {transaction.type === 'order' ? (
                            <>
                              <ArrowUpRight size={14} className="text-green-600" />
                              <span className="text-sm capitalize" style={{ color: theme.colors.text }}>
                                {transaction.type}
                              </span>
                            </>
                          ) : (
                            <>
                              <ArrowDownRight size={14} className="text-red-600" />
                              <span className="text-sm capitalize" style={{ color: theme.colors.text }}>
                                {transaction.type}
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div
                          className={`text-sm font-semibold ${
                            transaction.type === 'order' ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {transaction.type === 'order' ? '+' : '-'}€{transaction.amount.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <span
                          className="px-2 py-1 rounded-full text-xs font-medium capitalize"
                          style={{
                            backgroundColor: theme.colors.secondary,
                            color: theme.colors.textSecondary
                          }}
                        >
                          {transaction.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {transactions.length === 0 && (
              <div className="text-center py-12 px-4">
                <CreditCard
                  size={48}
                  className="mx-auto mb-4"
                  style={{ color: theme.colors.textSecondary }}
                />
                <p
                  className="text-sm sm:text-base transition-colors duration-300"
                  style={{ color: theme.colors.textSecondary }}
                >
{t.noTransactionsFound}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}


'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../components/AdminLayout';
import { getAdminSession } from '@/lib/auth';

interface Transaction {
  orderid: string;
  date: string;
  customer: string;
  amount: number;
  status: string;
  type: string;
}

interface FinancialData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  monthlyRevenue: number;
  pendingPayments: number;
  totalDeliveryCost: number;
  netRevenue: number;
  revenueChange: number;
  ordersChange: number;
  transactions: Transaction[];
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
          <div className="space-y-6">
            {/* Key Financial Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900">Total Revenue</h3>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  ${financeData.totalRevenue.toFixed(2)}
                </p>
                {financeData.revenueChange !== 0 && (
                  <p className={`text-sm mt-1 ${financeData.revenueChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {financeData.revenueChange > 0 ? '+' : ''}{financeData.revenueChange.toFixed(1)}% from last period
                  </p>
                )}
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900">Net Revenue</h3>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  ${financeData.netRevenue.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  After ${financeData.totalDeliveryCost.toFixed(2)} delivery costs
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900">Total Orders</h3>
                <p className="text-3xl font-bold text-purple-600 mt-2">
                  {financeData.totalOrders}
                </p>
                {financeData.ordersChange !== 0 && (
                  <p className={`text-sm mt-1 ${financeData.ordersChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {financeData.ordersChange > 0 ? '+' : ''}{financeData.ordersChange.toFixed(1)}% from last period
                  </p>
                )}
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900">Average Order Value</h3>
                <p className="text-3xl font-bold text-orange-600 mt-2">
                  ${financeData.averageOrderValue.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500 mt-1">Per order</p>
              </div>
            </div>

            {/* Recent Transactions */}
            {financeData.transactions && financeData.transactions.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Transactions</h3>
                <div className="space-y-3">
                  {financeData.transactions.slice(0, 10).map((transaction, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">
                            {transaction.customer.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{transaction.customer}</p>
                          <p className="text-sm text-gray-500">
                            Order #{transaction.orderid} • {new Date(transaction.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">${transaction.amount.toFixed(2)}</p>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          transaction.status === 'delivered'
                            ? 'bg-green-100 text-green-800'
                            : transaction.status === 'shipped'
                            ? 'bg-blue-100 text-blue-800'
                            : transaction.status === 'confirmed'
                            ? 'bg-purple-100 text-purple-800'
                            : transaction.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {transaction.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {financeData.transactions.length > 10 && (
                  <p className="text-center text-sm text-gray-500 mt-4">
                    Showing 10 of {financeData.transactions.length} transactions
                  </p>
                )}
              </div>
            )}

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <h3 className="text-lg font-semibold text-gray-900">Delivery Costs</h3>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  ${financeData.totalDeliveryCost.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500 mt-1">Total shipping expenses</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <h3 className="text-lg font-semibold text-gray-900">Pending Payments</h3>
                <p className="text-3xl font-bold text-yellow-600 mt-2">
                  ${financeData.pendingPayments.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500 mt-1">Awaiting processing</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <h3 className="text-lg font-semibold text-gray-900">Profit Margin</h3>
                <p className="text-3xl font-bold text-indigo-600 mt-2">
                  {financeData.totalRevenue > 0
                    ? ((financeData.netRevenue / financeData.totalRevenue) * 100).toFixed(1)
                    : 0}%
                </p>
                <p className="text-sm text-gray-500 mt-1">Revenue after costs</p>
              </div>
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
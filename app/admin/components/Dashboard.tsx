'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, Package, ShoppingCart, Users, DollarSign, Eye, Star, EuroIcon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';

// Mock data for the dashboard
const mockData = {
  totalSales: 45678.90,
  totalOrders: 1247,
  totalProducts: 89,
  totalCustomers: 3421,
  salesGrowth: 12.5,
  ordersGrowth: 8.3,
  productsGrowth: 15.7,
  customersGrowth: -2.1,
  recentOrders: [
    { id: '#12345', customer: 'John Doe', amount: 299.99, status: 'completed', date: '2024-12-07' },
    { id: '#12344', customer: 'Jane Smith', amount: 149.50, status: 'processing', date: '2024-12-07' },
    { id: '#12343', customer: 'Mike Johnson', amount: 89.99, status: 'shipped', date: '2024-12-06' },
    { id: '#12342', customer: 'Sarah Wilson', amount: 199.99, status: 'completed', date: '2024-12-06' },
  ],
  topProducts: [
    { name: 'Premium Cotton T-Shirt', sales: 145, revenue: 4350.00, growth: 23.5 },
    { name: 'Designer Jeans', sales: 98, revenue: 11760.00, growth: 18.2 },
    { name: 'Running Shoes', sales: 76, revenue: 9120.00, growth: 12.8 },
    { name: 'Leather Jacket', sales: 54, revenue: 12960.00, growth: 8.9 },
    { name: 'Winter Coat', sales: 43, revenue: 7740.00, growth: -5.2 },
  ],
  weeklySales: [
    { day: 'Mon', sales: 1200 },
    { day: 'Tue', sales: 1450 },
    { day: 'Wed', sales: 1100 },
    { day: 'Thu', sales: 1800 },
    { day: 'Fri', sales: 2200 },
    { day: 'Sat', sales: 2800 },
    { day: 'Sun', sales: 1900 },
  ],
  categoryPerformance: [
    { category: 'Clothes', percentage: 45, color: 'bg-blue-500' },
    { category: 'Shoes', percentage: 30, color: 'bg-green-500' },
    { category: 'Accessories', percentage: 25, color: 'bg-yellow-500' },
  ]
};

export default function Dashboard() {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const t = translations[language];

  const MetricCard = ({ title, value, growth, icon: Icon, prefix = '', suffix = '' }: {
    title: string;
    value: number | string;
    growth: number;
    icon: any;
    prefix?: string;
    suffix?: string;
  }) => (
    <div
      className="p-6 rounded-lg shadow-sm border"
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        color: theme.colors.text
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p
            className="text-sm font-medium opacity-75"
            style={{ color: theme.colors.textSecondary }}
          >
            {title}
          </p>
          <p className="text-2xl font-bold mt-2">
            {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
          </p>
        </div>
        <div
          className="p-3 rounded-full"
          style={{ backgroundColor: theme.colors.secondary }}
        >
          <Icon size={24} style={{ color: theme.colors.primary }} />
        </div>
      </div>
      <div className="flex items-center mt-4">
        {growth >= 0 ? (
          <TrendingUp size={16} className="text-green-500 mr-1" />
        ) : (
          <TrendingDown size={16} className="text-red-500 mr-1" />
        )}
        <span
          className={`text-sm font-medium ${growth >= 0 ? 'text-green-500' : 'text-red-500'}`}
        >
          {growth >= 0 ? '+' : ''}{growth}%
        </span>
        <span
          className="text-sm opacity-75 ml-2"
          style={{ color: theme.colors.textSecondary }}
        >
          {language === 'bg' ? 'от миналия месец' : 'from last month'}
        </span>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-3xl font-bold"
          style={{ color: theme.colors.text }}
        >
          {language === 'bg' ? 'Табло за управление' : 'Dashboard'}
        </h1>
        <p
          className="mt-2"
          style={{ color: theme.colors.textSecondary }}
        >
          {language === 'bg' ? 'Добре дошли в административния панел' : 'Welcome to your admin dashboard'}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title={language === 'bg' ? 'Общи продажби' : 'Total Sales'}
          value={mockData.totalSales}
          growth={mockData.salesGrowth}
          icon={EuroIcon}
          suffix="€"
        />
        <MetricCard
          title={language === 'bg' ? 'Общо поръчки' : 'Total Orders'}
          value={mockData.totalOrders}
          growth={mockData.ordersGrowth}
          icon={ShoppingCart}
        />
        <MetricCard
          title={language === 'bg' ? 'Продукти' : 'Products'}
          value={mockData.totalProducts}
          growth={mockData.productsGrowth}
          icon={Package}
        />
        <MetricCard
          title={language === 'bg' ? 'Клиенти' : 'Customers'}
          value={mockData.totalCustomers}
          growth={mockData.customersGrowth}
          icon={Users}
        />
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <div
          className="p-6 rounded-lg shadow-sm border"
          style={{
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            color: theme.colors.text
          }}
        >
          <h3 className="text-lg font-semibold mb-4">
            {language === 'bg' ? 'Продажби за седмицата' : 'Weekly Sales'}
          </h3>
          <div className="h-64 flex items-end justify-between space-x-2">
            {mockData.weeklySales.map((day, index) => (
              <div key={day.day} className="flex flex-col items-center flex-1">
                <div
                  className="w-full bg-blue-500 rounded-t mb-2 transition-all hover:bg-blue-600"
                  style={{
                    height: `€{(day.sales / 3000) * 100}%`,
                    minHeight: '20px'
                  }}
                ></div>
                <span
                  className="text-xs"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {day.day}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Performance */}
        <div
          className="p-6 rounded-lg shadow-sm border"
          style={{
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            color: theme.colors.text
          }}
        >
          <h3 className="text-lg font-semibold mb-4">
            {language === 'bg' ? 'Продажби по категории' : 'Sales by Category'}
          </h3>
          <div className="space-y-4">
            {mockData.categoryPerformance.map((category) => (
              <div key={category.category}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">{category.category}</span>
                  <span className="text-sm">{category.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${category.color}`}
                    style={{ width: `${category.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders and Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div
          className="p-6 rounded-lg shadow-sm border"
          style={{
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            color: theme.colors.text
          }}
        >
          <h3 className="text-lg font-semibold mb-4">
            {language === 'bg' ? 'Последни поръчки' : 'Recent Orders'}
          </h3>
          <div className="space-y-3">
            {mockData.recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-3 rounded border"
                style={{
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border
                }}
              >
                <div>
                  <p className="font-medium">{order.id}</p>
                  <p
                    className="text-sm"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    {order.customer}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">€{order.amount}</p>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      order.status === 'completed' ? 'bg-green-100 text-green-800' :
                      order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div
          className="p-6 rounded-lg shadow-sm border"
          style={{
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            color: theme.colors.text
          }}
        >
          <h3 className="text-lg font-semibold mb-4">
            {language === 'bg' ? 'Топ продукти' : 'Top Products'}
          </h3>
          <div className="space-y-3">
            {mockData.topProducts.map((product, index) => (
              <div
                key={product.name}
                className="flex items-center justify-between p-3 rounded border"
                style={{
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border
                }}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ backgroundColor: theme.colors.secondary }}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{product.name}</p>
                    <p
                      className="text-xs"
                      style={{ color: theme.colors.textSecondary }}
                    >
                      {product.sales} {language === 'bg' ? 'продажби' : 'sales'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">${product.revenue.toLocaleString()}</p>
                  <div className="flex items-center">
                    {product.growth >= 0 ? (
                      <TrendingUp size={12} className="text-green-500 mr-1" />
                    ) : (
                      <TrendingDown size={12} className="text-red-500 mr-1" />
                    )}
                    <span
                      className={`text-xs ${product.growth >= 0 ? 'text-green-500' : 'text-red-500'}`}
                    >
                      {product.growth >= 0 ? '+' : ''}{product.growth}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}




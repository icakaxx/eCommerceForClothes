'use client';

import { useState, useEffect } from 'react';
import { Search, User, Mail, Phone, MapPin, Calendar, Package, DollarSign } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';
import AdminLayout from '../components/AdminLayout';

interface Customer {
  customeremail: string;
  customerfirstname: string;
  customerlastname: string;
  customertelephone: string;
  customercountry: string;
  customercity: string;
  total_orders: number;
  total_spent: number;
  last_order_date: string;
}

export default function CustomersPage() {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const t = translations[language];
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/admin/customers');
      const result = await response.json();

      if (result.success) {
        setCustomers(result.customers);
      } else {
        console.error('Failed to fetch customers:', result.error);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      customer.customeremail.toLowerCase().includes(search) ||
      customer.customerfirstname.toLowerCase().includes(search) ||
      customer.customerlastname.toLowerCase().includes(search) ||
      customer.customertelephone.includes(search) ||
      customer.customercity.toLowerCase().includes(search) ||
      customer.customercountry.toLowerCase().includes(search)
    );
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString(language === 'bg' ? 'bg-BG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <AdminLayout currentPath="/admin/customers">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentPath="/admin/customers">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="mb-2">
            <h1
              className="text-2xl sm:text-3xl font-semibold transition-colors duration-300"
              style={{ color: theme.colors.text }}
            >
              {t.customers}
            </h1>
            <p
              className="text-sm sm:text-base transition-colors duration-300 mt-1"
              style={{ color: theme.colors.textSecondary }}
            >
              {t.viewAndManageCustomers}
            </p>
          </div>

          <div
            className="rounded-lg shadow-sm p-3 sm:p-4 mb-4 sm:mb-6 transition-colors duration-300"
            style={{
              backgroundColor: theme.colors.surface,
              boxShadow: theme.effects.shadow
            }}
          >
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300"
                size={18}
                style={{ color: theme.colors.textSecondary }}
              />
              <input
                type="text"
                placeholder={t.searchCustomers}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:border-transparent transition-colors duration-300"
                style={{
                  backgroundColor: theme.colors.cardBg,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.primary;
                  e.currentTarget.style.boxShadow = `0 0 0 2px ${theme.colors.primary}33`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.border;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          <div
            className="rounded-lg shadow-sm overflow-hidden transition-colors duration-300"
            style={{
              backgroundColor: theme.colors.surface,
              boxShadow: theme.effects.shadow
            }}
          >
            {/* Mobile Card View */}
            <div className="md:hidden">
              <div className="divide-y" style={{ borderColor: theme.colors.border }}>
                {filteredCustomers.map((customer, index) => (
                  <div
                    key={customer.customeremail + index}
                    className="p-4 transition-colors duration-300"
                    style={{
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border
                    }}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: theme.colors.secondary }}
                      >
                        <User size={24} style={{ color: theme.colors.primary }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className="font-medium text-base mb-1"
                          style={{ color: theme.colors.text }}
                        >
                          {customer.customerfirstname} {customer.customerlastname}
                        </div>
                        <div className="flex items-center gap-2 text-xs mb-1">
                          <Mail size={12} style={{ color: theme.colors.textSecondary }} />
                          <span style={{ color: theme.colors.textSecondary }} className="truncate">
                            {customer.customeremail}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <Phone size={12} style={{ color: theme.colors.textSecondary }} />
                          <span style={{ color: theme.colors.textSecondary }}>
                            {customer.customertelephone}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                      <div className="flex items-center gap-1">
                        <MapPin size={12} style={{ color: theme.colors.textSecondary }} />
                        <span style={{ color: theme.colors.textSecondary }}>{t.location}: </span>
                        <span style={{ color: theme.colors.text }}>
                          {customer.customercity}, {customer.customercountry}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={12} style={{ color: theme.colors.textSecondary }} />
                        <span style={{ color: theme.colors.textSecondary }}>{t.lastOrder}: </span>
                        <span style={{ color: theme.colors.text }}>
                          {formatDate(customer.last_order_date)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-3 border-t" style={{ borderColor: theme.colors.border }}>
                      <div>
                        <span style={{ color: theme.colors.textSecondary }}>{t.orders}: </span>
                        <span style={{ color: theme.colors.text }} className="font-semibold">
                          {customer.total_orders}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: theme.colors.textSecondary }}>{t.totalSpent}: </span>
                        <span style={{ color: theme.colors.text }} className="font-semibold">
                          €{customer.total_spent.toFixed(2)}
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
                      {t.customer}
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase transition-colors duration-300" style={{ color: theme.colors.textSecondary }}>
                      {t.contact}
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase transition-colors duration-300" style={{ color: theme.colors.textSecondary }}>
                      {t.location}
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase transition-colors duration-300" style={{ color: theme.colors.textSecondary }}>
                      {t.orders}
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase transition-colors duration-300" style={{ color: theme.colors.textSecondary }}>
                      {t.totalSpent}
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase transition-colors duration-300" style={{ color: theme.colors.textSecondary }}>
                      {t.lastOrder}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: theme.colors.border }}>
                  {filteredCustomers.map((customer, index) => (
                    <tr
                      key={customer.customeremail + index}
                      className="transition-colors duration-300"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = theme.colors.secondary;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <td className="px-4 lg:px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: theme.colors.secondary }}
                          >
                            <User size={18} style={{ color: theme.colors.primary }} />
                          </div>
                          <div>
                            <div className="font-medium text-sm" style={{ color: theme.colors.text }}>
                              {customer.customerfirstname} {customer.customerlastname}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="text-sm" style={{ color: theme.colors.text }}>
                          {customer.customeremail}
                        </div>
                        <div className="text-xs flex items-center gap-1 mt-1" style={{ color: theme.colors.textSecondary }}>
                          <Phone size={12} />
                          {customer.customertelephone}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="text-sm flex items-center gap-1" style={{ color: theme.colors.text }}>
                          <MapPin size={14} />
                          {customer.customercity}, {customer.customercountry}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="flex items-center gap-1 text-sm" style={{ color: theme.colors.text }}>
                          <Package size={14} />
                          {customer.total_orders}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="text-sm font-medium flex items-center gap-1" style={{ color: theme.colors.text }}>
                          <DollarSign size={14} />
                          €{customer.total_spent.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-sm" style={{ color: theme.colors.text }}>
                        {formatDate(customer.last_order_date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredCustomers.length === 0 && (
              <div className="text-center py-12 px-4">
                <User
                  size={48}
                  className="mx-auto mb-4"
                  style={{ color: theme.colors.textSecondary }}
                />
                <p
                  className="text-sm sm:text-base transition-colors duration-300"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {filteredCustomers.length === customers.length ? t.noCustomersFound : t.noCustomersMatchSearch}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}


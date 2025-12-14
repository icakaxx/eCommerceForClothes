'use client';

import { useState, useEffect } from 'react';
import { Search, Ticket, Plus, Edit, Trash2, Calendar, Percent, DollarSign } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';
import AdminLayout from '../components/AdminLayout';

interface Discount {
  discountid: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  min_purchase?: number;
  max_discount?: number;
  valid_from: string;
  valid_until: string;
  usage_limit?: number;
  used_count: number;
  is_active: boolean;
}

export default function DiscountsPage() {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const t = translations[language];
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    try {
      const response = await fetch('/api/admin/discounts');
      const result = await response.json();

      if (result.success) {
        setDiscounts(result.discounts || []);
      } else {
        console.error('Failed to fetch discounts:', result.error);
      }
    } catch (error) {
      console.error('Error fetching discounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDiscounts = discounts.filter(discount => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return discount.code.toLowerCase().includes(search);
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'bg' ? 'bg-BG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date();
  };

  const isActive = (discount: Discount) => {
    if (!discount.is_active) return false;
    if (isExpired(discount.valid_until)) return false;
    if (discount.usage_limit && discount.used_count >= discount.usage_limit) return false;
    return true;
  };

  if (loading) {
    return (
      <AdminLayout currentPath="/admin/discounts">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentPath="/admin/discounts">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1
                className="text-2xl sm:text-3xl font-semibold transition-colors duration-300"
                style={{ color: theme.colors.text }}
              >
                {t.discounts}
              </h1>
              <p
                className="text-sm sm:text-base transition-colors duration-300 mt-1"
                style={{ color: theme.colors.textSecondary }}
              >
                {t.manageDiscountCodes}
              </p>
            </div>
            <button
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-300 flex items-center gap-2"
              style={{
                backgroundColor: theme.colors.primary,
                color: '#ffffff'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              <Plus size={18} />
              {t.createDiscount}
            </button>
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
                placeholder={t.searchDiscountCodes}
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
                {filteredDiscounts.map((discount) => (
                  <div
                    key={discount.discountid}
                    className="p-4 transition-colors duration-300"
                    style={{
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border
                    }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Ticket size={16} style={{ color: theme.colors.primary }} />
                          <span
                            className="font-medium text-base"
                            style={{ color: theme.colors.text }}
                          >
                            {discount.code}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              isActive(discount)
                                ? 'text-green-600 bg-green-50 dark:bg-green-900/20'
                                : 'text-gray-600 bg-gray-50 dark:bg-gray-900/20'
                            }`}
                          >
                            {isActive(discount) ? t.active : t.inactive}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm mb-1">
                          {discount.type === 'percentage' ? (
                            <>
                              <Percent size={14} style={{ color: theme.colors.textSecondary }} />
                              <span style={{ color: theme.colors.text }}>
                                {discount.value}{t.percentOff}
                              </span>
                            </>
                          ) : (
                            <>
                              <DollarSign size={14} style={{ color: theme.colors.textSecondary }} />
                              <span style={{ color: theme.colors.text }}>
                                €{discount.value} {t.amountOff}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                      <div>
                        <span style={{ color: theme.colors.textSecondary }}>{t.validFrom}: </span>
                        <span style={{ color: theme.colors.text }}>
                          {formatDate(discount.valid_from)}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: theme.colors.textSecondary }}>{t.validUntil}: </span>
                        <span style={{ color: theme.colors.text }}>
                          {formatDate(discount.valid_until)}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: theme.colors.textSecondary }}>{t.used}: </span>
                        <span style={{ color: theme.colors.text }}>
                          {discount.used_count}
                          {discount.usage_limit ? ` / ${discount.usage_limit}` : ''}
                        </span>
                      </div>
                      {discount.min_purchase && (
                        <div>
                          <span style={{ color: theme.colors.textSecondary }}>{t.minPurchase}: </span>
                          <span style={{ color: theme.colors.text }}>
                            €{discount.min_purchase}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-3 border-t" style={{ borderColor: theme.colors.border }}>
                      <button
                        className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-300 flex items-center justify-center gap-2"
                        style={{
                          backgroundColor: theme.colors.secondary,
                          color: theme.colors.text
                        }}
                      >
                        <Edit size={14} />
                        {t.edit}
                      </button>
                      <button
                        className="px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-300 flex items-center justify-center gap-2"
                        style={{
                          backgroundColor: theme.colors.secondary,
                          color: theme.colors.text
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
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
                      {t.code}
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase transition-colors duration-300" style={{ color: theme.colors.textSecondary }}>
                      {t.type}
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase transition-colors duration-300" style={{ color: theme.colors.textSecondary }}>
                      {t.value}
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase transition-colors duration-300" style={{ color: theme.colors.textSecondary }}>
                      {t.validPeriod}
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase transition-colors duration-300" style={{ color: theme.colors.textSecondary }}>
                      {t.usage}
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase transition-colors duration-300" style={{ color: theme.colors.textSecondary }}>
                      {t.status}
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase transition-colors duration-300" style={{ color: theme.colors.textSecondary }}>
                      {t.actions}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: theme.colors.border }}>
                  {filteredDiscounts.map((discount) => (
                    <tr
                      key={discount.discountid}
                      className="transition-colors duration-300"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = theme.colors.secondary;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <td className="px-4 lg:px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Ticket size={16} style={{ color: theme.colors.primary }} />
                          <span className="font-medium text-sm" style={{ color: theme.colors.text }}>
                            {discount.code}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-sm capitalize" style={{ color: theme.colors.text }}>
                        {discount.type}
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="text-sm font-medium" style={{ color: theme.colors.text }}>
                          {discount.type === 'percentage' ? `${discount.value}%` : `€${discount.value}`}
                        </div>
                        {discount.min_purchase && (
                          <div className="text-xs" style={{ color: theme.colors.textSecondary }}>
                            {t.minimum}: €{discount.min_purchase}
                          </div>
                        )}
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="text-sm" style={{ color: theme.colors.text }}>
                          {formatDate(discount.valid_from)}
                        </div>
                        <div className="text-xs" style={{ color: theme.colors.textSecondary }}>
                          {t.to} {formatDate(discount.valid_until)}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-sm" style={{ color: theme.colors.text }}>
                        {discount.used_count}
                        {discount.usage_limit ? ` / ${discount.usage_limit}` : ` / ${t.unlimited}`}
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            isActive(discount)
                              ? 'text-green-600 bg-green-50 dark:bg-green-900/20'
                              : 'text-gray-600 bg-gray-50 dark:bg-gray-900/20'
                          }`}
                        >
                          {isActive(discount) ? t.active : t.inactive}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            className="p-2 rounded-lg transition-colors duration-300"
                            style={{
                              backgroundColor: theme.colors.secondary,
                              color: theme.colors.text
                            }}
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            className="p-2 rounded-lg transition-colors duration-300"
                            style={{
                              backgroundColor: theme.colors.secondary,
                              color: theme.colors.text
                            }}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredDiscounts.length === 0 && (
              <div className="text-center py-12 px-4">
                <Ticket
                  size={48}
                  className="mx-auto mb-4"
                  style={{ color: theme.colors.textSecondary }}
                />
                <p
                  className="text-sm sm:text-base transition-colors duration-300"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {filteredDiscounts.length === discounts.length ? t.noDiscountsFound : t.noDiscountsMatchSearch}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}


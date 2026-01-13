'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Edit2, ChevronDown, ChevronUp, Package } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { getAdminSession } from '@/lib/auth';
import type { EcontOfficesData, EcontOffice } from '@/types/econt';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';
import { Badge } from '../components/layout';
import { getOrderStatusVariant } from '@/lib/admin-status-utils';

interface OrderItem {
  OrderItemID: string;
  quantity: number;
  price: number;
  createdat: string;
  productvariantid?: string;
  product: {
    name: string;
    brand?: string;
    model?: string;
    color?: string;
    size?: string;
    images?: string[];
    allProperties?: Record<string, string>;
  };
}

interface Order {
  orderid: string;
  customeremail?: string;
  total: number;
  status: string;
  createdat: string;
  deliverytype?: string;
  econtoffice?: string;
  deliverystreet?: string | null;
  deliverystreetnumber?: string | null;
  deliveryentrance?: string | null;
  deliveryfloor?: string | null;
  deliveryapartment?: string | null;
  order_items?: OrderItem[];
}

export default function SalesPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = translations[language];
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [econtOffices, setEcontOffices] = useState<EcontOfficesData | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['pending', 'confirmed', 'shipped']);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const getStatusTranslation = (status: string): string => {
    switch (status) {
      case 'pending':
        return t.pending;
      case 'confirmed':
        return t.confirmed;
      case 'shipped':
        return t.shipped;
      case 'delivered':
        return t.delivered;
      case 'cancelled':
        return t.cancelled;
      default:
        return status;
    }
  };

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
      loadOrders();
      loadEcontOffices();
    }
  }, [isAuthenticated]);

  const loadEcontOffices = async () => {
    try {
      const response = await fetch('/data/econt-offices.json');
      const data: EcontOfficesData = await response.json();
      setEcontOffices(data);
    } catch (error) {
      console.error('Failed to load Econt offices:', error);
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/orders');
      const result = await response.json();
      if (result.success) {
        setOrders(result.orders || []);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingStatus(orderId);
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      const result = await response.json();
      if (result.success) {
        // Update the order status in the local state
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order.orderid === orderId
              ? { ...order, status: newStatus }
              : order
          )
        );
      } else {
        alert('Failed to update order status: ' + result.error);
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
      alert('Failed to update order status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getEcontOffice = (officeId: string): EcontOffice | null => {
    if (!econtOffices || !officeId) return null;
    
    // Search through all cities and their offices
    for (const city in econtOffices.officesByCity) {
      const offices = econtOffices.officesByCity[city];
      const office = offices.find((o: EcontOffice) => o.id === officeId);
      if (office) {
        return office;
      }
    }
    
    // If not found, return null
    return null;
  };

  const getEcontOfficeName = (officeId: string): string => {
    const office = getEcontOffice(officeId);
    return office ? office.name : officeId;
  };

  // Handle status filter change
  const handleStatusFilterChange = (status: string, checked: boolean) => {
    if (checked) {
      setSelectedStatuses([...selectedStatuses, status]);
    } else {
      setSelectedStatuses(selectedStatuses.filter(s => s !== status));
    }
    setCurrentPage(1); // Reset to first page when filter changes
  };

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStatuses]);

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

  // Filter orders by selected statuses
  const filteredOrders = orders.filter(order => selectedStatuses.includes(order.status));

  // Pagination calculations
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  // Calculate stats based on filtered orders
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0);
  const totalOrders = filteredOrders.length;
  const pendingOrders = filteredOrders.filter(order => order.status === 'pending').length;

  return (
    <AdminLayout currentPath="/admin/sales">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-6">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Продажби</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Управление и преглед на вашите поръчки</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">Общо поръчки</h3>
            <p className="text-2xl sm:text-3xl font-bold text-blue-600 mt-1 sm:mt-2">{totalOrders}</p>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">Общо приходи</h3>
            <p className="text-2xl sm:text-3xl font-bold text-green-600 mt-1 sm:mt-2">€{totalRevenue.toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow sm:col-span-2 lg:col-span-1">
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">Поръчки в очакване</h3>
            <p className="text-2xl sm:text-3xl font-bold text-orange-600 mt-1 sm:mt-2">{pendingOrders}</p>
          </div>
        </div>

        {/* Status Filters */}
        <div className="bg-white rounded-lg shadow p-3 sm:p-4 mb-4 sm:mb-6">
          <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">{language === 'bg' ? 'Филтрирай по статус' : 'Filter by Status'}</h3>
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3">
            {['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map((status) => (
              <label key={status} className="flex items-center gap-2 cursor-pointer py-1">
                <input
                  type="checkbox"
                  checked={selectedStatuses.includes(status)}
                  onChange={(e) => handleStatusFilterChange(status, e.target.checked)}
                  className="w-4 h-4 sm:w-4 sm:h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-xs sm:text-sm text-gray-700">{getStatusTranslation(status)}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Orders Table - Desktop */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="text-center py-8 sm:py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-sm sm:text-base text-gray-500">Зареждане на поръчки...</p>
            </div>
          ) : (
            <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID на поръчка
                    </th>
                    <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Продукти
                    </th>
                    <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Покупател
                    </th>
                    <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Сума
                    </th>
                    <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Статус
                    </th>
                    <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Дата
                    </th>
                    <th className="px-4 xl:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedOrders.map((order) => {
                    const isExpanded = expandedOrders.has(order.orderid);
                    const itemCount = order.order_items?.length || 0;

                    return (
                      <React.Fragment key={order.orderid}>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <span className="font-mono text-xs">{order.orderid}</span>
                          </td>
                          <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button
                              onClick={() => toggleOrderExpansion(order.orderid)}
                              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              <Package className="w-4 h-4" />
                              <span>{itemCount} {itemCount !== 1 ? t.items : t.item}</span>
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                          <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className="truncate block max-w-xs">{order.customeremail || 'N/A'}</span>
                          </td>
                          <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            €{order.total?.toFixed(2) || '0.00'}
                          </td>
                          <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                            <Badge variant={getOrderStatusVariant(order.status)}>
                              {getStatusTranslation(order.status)}
                            </Badge>
                          </td>
                          <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(order.createdat).toLocaleDateString()}
                          </td>
                          <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <select
                              value={order.status}
                              onChange={(e) => updateOrderStatus(order.orderid, e.target.value)}
                              disabled={updatingStatus === order.orderid}
                              className="text-xs sm:text-sm border border-gray-300 rounded px-2 py-1 disabled:opacity-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="pending">{t.pending}</option>
                              <option value="confirmed">{t.confirmed}</option>
                              <option value="shipped">{t.shipped}</option>
                              <option value="delivered">{t.delivered}</option>
                              <option value="cancelled">{t.cancelled}</option>
                            </select>
                            {updatingStatus === order.orderid && (
                              <span className="ml-2 text-xs text-gray-500">Обновяване...</span>
                            )}
                          </td>
                        </tr>

                        {/* Expanded order items - Desktop */}
                        {isExpanded && order.order_items && order.order_items.length > 0 && (
                          <tr>
                            <td colSpan={7} className="px-4 xl:px-6 py-4 bg-gray-50">
                              <div className="border rounded-lg bg-white p-3 sm:p-4">
                                {/* Delivery Information */}
                                {order.deliverytype === 'address' && (order.deliverystreet || order.deliverystreetnumber) && (
                                  <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <h4 className="text-xs sm:text-sm font-medium text-green-900 mb-1">
                                      {language === 'bg' ? 'Адрес за доставка' : 'Delivery Address'}
                                    </h4>
                                    <p className="text-xs sm:text-sm text-green-700 font-medium">
                                      {order.deliverystreet || ''} {order.deliverystreetnumber || ''}
                                      {order.deliveryentrance ? `, ${language === 'bg' ? 'вх.' : 'Entrance'} ${order.deliveryentrance}` : ''}
                                      {order.deliveryfloor ? `, ${language === 'bg' ? 'ет.' : 'Floor'} ${order.deliveryfloor}` : ''}
                                      {order.deliveryapartment ? `, ${language === 'bg' ? 'ап.' : 'Apt'} ${order.deliveryapartment}` : ''}
                                    </p>
                                  </div>
                                )}
                                {order.deliverytype === 'office' && order.econtoffice && (() => {
                                  const office = getEcontOffice(order.econtoffice);
                                  return office ? (
                                    <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                      <h4 className="text-xs sm:text-sm font-medium text-blue-900 mb-1">
                                        {language === 'bg' ? 'Офис на Еконт' : 'Econt Office Delivery'}
                                      </h4>
                                      <p className="text-xs sm:text-sm text-blue-700 font-medium">{office.name}</p>
                                      <p className="text-xs sm:text-sm text-blue-600 mt-1">{office.address}</p>
                                    </div>
                                  ) : (
                                    <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                      <h4 className="text-xs sm:text-sm font-medium text-blue-900 mb-1">
                                        {language === 'bg' ? 'Офис на Еконт' : 'Econt Office Delivery'}
                                      </h4>
                                      <p className="text-xs sm:text-sm text-blue-700">
                                        {language === 'bg' ? 'ID на офис' : 'Office ID'}: {order.econtoffice}
                                      </p>
                                    </div>
                                  );
                                })()}
                                
                                <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-2 sm:mb-3">Order Items</h4>
                                <div className="space-y-2 sm:space-y-3">
                                  {order.order_items.map((item, index) => (
                                    <div key={item.OrderItemID || index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 sm:p-3 bg-gray-50 rounded-lg gap-2 sm:gap-0">
                                      <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                        {item.product.images && item.product.images.length > 0 ? (
                                          <img
                                            src={item.product.images[0]}
                                            alt={item.product.name}
                                            className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-lg border flex-shrink-0"
                                            onError={(e) => {
                                              e.currentTarget.style.display = 'none';
                                            }}
                                          />
                                        ) : (
                                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Package className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                                          </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                          <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                                            {item.product.name}
                                          </p>
                                          <div className="text-xs text-gray-500 space-y-0.5 sm:space-y-1 mt-1">
                                            {item.product.name === 'Unknown Product' ? (
                                              <p className="text-red-500">⚠️ Product data missing</p>
                                            ) : (
                                              <>
                                                {/* Display all properties */}
                                                {item.product.allProperties && Object.keys(item.product.allProperties).length > 0 ? (
                                                  Object.entries(item.product.allProperties).map(([propName, propValue]) => (
                                                    <p key={propName} className="truncate">
                                                      <span className="font-medium">{propName}:</span> {propValue}
                                                    </p>
                                                  ))
                                                ) : (
                                                  <>
                                                    {/* Fallback to legacy fields if allProperties not available */}
                                                    {item.product.brand && (
                                                      <p className="truncate"><span className="font-medium">Brand:</span> {item.product.brand}</p>
                                                    )}
                                                    {item.product.model && (
                                                      <p className="truncate"><span className="font-medium">Model:</span> {item.product.model}</p>
                                                    )}
                                                    <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                                                      {item.product.color && (
                                                        <span><span className="font-medium">Color:</span> {item.product.color}</span>
                                                      )}
                                                      {item.product.size && (
                                                        <span><span className="font-medium">Size:</span> {item.product.size}</span>
                                                      )}
                                                    </div>
                                                  </>
                                                )}
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="text-left sm:text-right flex-shrink-0 sm:ml-4">
                                        <p className="text-xs sm:text-sm font-medium text-gray-900">
                                          €{item.price?.toFixed(2) || '0.00'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          Qty: {item.quantity}
                                        </p>
                                        <p className="text-xs text-gray-500 font-medium">
                                          Subtotal: €{(item.price * item.quantity)?.toFixed(2) || '0.00'}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile/Tablet Card View */}
            <div className="lg:hidden">
              <div className="divide-y divide-gray-200">
                {paginatedOrders.map((order) => {
                  const isExpanded = expandedOrders.has(order.orderid);
                  const itemCount = order.order_items?.length || 0;

                  return (
                    <div key={order.orderid} className="p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                      {/* Order Header Card */}
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-mono text-gray-500 mb-1 truncate">{order.orderid}</p>
                            <p className="text-sm font-medium text-gray-900 truncate">{order.customeremail || 'N/A'}</p>
                          </div>
                          <Badge variant={getOrderStatusVariant(order.status)} className="flex-shrink-0">
                            {getStatusTranslation(order.status)}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <div className="flex items-center gap-4 text-sm">
                            <div>
                              <p className="text-xs text-gray-500">Сума</p>
                              <p className="text-sm font-semibold text-gray-900">€{order.total?.toFixed(2) || '0.00'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Дата</p>
                              <p className="text-sm text-gray-700">{new Date(order.createdat).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-2">
                          <button
                            onClick={() => toggleOrderExpansion(order.orderid)}
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors text-sm"
                          >
                            <Package className="w-4 h-4" />
                            <span>{itemCount} {itemCount !== 1 ? t.items : t.item}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>

                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.orderid, e.target.value)}
                            disabled={updatingStatus === order.orderid}
                            className="text-xs sm:text-sm border border-gray-300 rounded px-2 py-1.5 disabled:opacity-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="pending">{t.pending}</option>
                            <option value="confirmed">{t.confirmed}</option>
                            <option value="shipped">{t.shipped}</option>
                            <option value="delivered">{t.delivered}</option>
                            <option value="cancelled">{t.cancelled}</option>
                          </select>
                        </div>
                        {updatingStatus === order.orderid && (
                          <p className="text-xs text-gray-500 text-center">Обновяване...</p>
                        )}
                      </div>

                      {/* Expanded order items - Mobile */}
                      {isExpanded && order.order_items && order.order_items.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          {/* Delivery Information */}
                          {order.deliverytype === 'address' && (order.deliverystreet || order.deliverystreetnumber) && (
                            <div className="mb-3 p-2 sm:p-3 bg-green-50 border border-green-200 rounded-lg">
                              <h4 className="text-xs sm:text-sm font-medium text-green-900 mb-1">
                                {language === 'bg' ? 'Адрес за доставка' : 'Delivery Address'}
                              </h4>
                              <p className="text-xs sm:text-sm text-green-700 font-medium">
                                {order.deliverystreet || ''} {order.deliverystreetnumber || ''}
                                {order.deliveryentrance ? `, ${language === 'bg' ? 'вх.' : 'Entrance'} ${order.deliveryentrance}` : ''}
                                {order.deliveryfloor ? `, ${language === 'bg' ? 'ет.' : 'Floor'} ${order.deliveryfloor}` : ''}
                                {order.deliveryapartment ? `, ${language === 'bg' ? 'ап.' : 'Apt'} ${order.deliveryapartment}` : ''}
                              </p>
                            </div>
                          )}
                          {order.deliverytype === 'office' && order.econtoffice && (() => {
                            const office = getEcontOffice(order.econtoffice);
                            return office ? (
                              <div className="mb-3 p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <h4 className="text-xs sm:text-sm font-medium text-blue-900 mb-1">
                                  {language === 'bg' ? 'Офис на Еконт' : 'Econt Office Delivery'}
                                </h4>
                                <p className="text-xs sm:text-sm text-blue-700 font-medium">{office.name}</p>
                                <p className="text-xs sm:text-sm text-blue-600 mt-1">{office.address}</p>
                              </div>
                            ) : (
                              <div className="mb-3 p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <h4 className="text-xs sm:text-sm font-medium text-blue-900 mb-1">
                                  {language === 'bg' ? 'Офис на Еконт' : 'Econt Office Delivery'}
                                </h4>
                                <p className="text-xs sm:text-sm text-blue-700">
                                  {language === 'bg' ? 'ID на офис' : 'Office ID'}: {order.econtoffice}
                                </p>
                              </div>
                            );
                          })()}
                          
                          <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-2">Order Items</h4>
                          <div className="space-y-2">
                            {order.order_items.map((item, index) => (
                              <div key={item.OrderItemID || index} className="p-2 sm:p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-start gap-2 sm:gap-3">
                                  {item.product.images && item.product.images.length > 0 ? (
                                    <img
                                      src={item.product.images[0]}
                                      alt={item.product.name}
                                      className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg border flex-shrink-0"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                      <Package className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs sm:text-sm font-medium text-gray-900 mb-1">
                                      {item.product.name}
                                    </p>
                                    <div className="text-xs text-gray-500 space-y-0.5 mb-2">
                                      {item.product.name === 'Unknown Product' ? (
                                        <p className="text-red-500">⚠️ Product data missing</p>
                                      ) : (
                                        <>
                                          {/* Display all properties */}
                                          {item.product.allProperties && Object.keys(item.product.allProperties).length > 0 ? (
                                            Object.entries(item.product.allProperties).map(([propName, propValue]) => (
                                              <p key={propName}>
                                                <span className="font-medium">{propName}:</span> {propValue}
                                              </p>
                                            ))
                                          ) : (
                                            <>
                                              {/* Fallback to legacy fields if allProperties not available */}
                                              {item.product.brand && (
                                                <p><span className="font-medium">Brand:</span> {item.product.brand}</p>
                                              )}
                                              {item.product.model && (
                                                <p><span className="font-medium">Model:</span> {item.product.model}</p>
                                              )}
                                              <div className="flex flex-wrap gap-x-2">
                                                {item.product.color && (
                                                  <span><span className="font-medium">Color:</span> {item.product.color}</span>
                                                )}
                                                {item.product.size && (
                                                  <span><span className="font-medium">Size:</span> {item.product.size}</span>
                                                )}
                                              </div>
                                            </>
                                          )}
                                        </>
                                      )}
                                    </div>
                                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
                                      <div>
                                        <p className="text-xs text-gray-500">Price</p>
                                        <p className="text-sm font-medium text-gray-900">€{item.price?.toFixed(2) || '0.00'}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-500">Qty</p>
                                        <p className="text-sm font-medium text-gray-900">{item.quantity}</p>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-xs text-gray-500">Subtotal</p>
                                        <p className="text-sm font-semibold text-gray-900">€{(item.price * item.quantity)?.toFixed(2) || '0.00'}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-3 sm:px-4 lg:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-200">
                {/* Mobile: Simple Prev/Next */}
                <div className="flex-1 flex justify-between sm:hidden w-full">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center justify-center px-4 py-2.5 min-w-[100px] border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
                  >
                    {t.previous || 'Previous'}
                  </button>
                  <div className="flex items-center px-4">
                    <span className="text-sm text-gray-700">
                      <span className="font-medium">{currentPage}</span> / <span className="font-medium">{totalPages}</span>
                    </span>
                  </div>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center justify-center px-4 py-2.5 min-w-[100px] border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
                  >
                    {t.next || 'Next'}
                  </button>
                </div>

                {/* Tablet/Desktop: Full Pagination */}
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between w-full">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-700">
                      {t.showingTransactions || 'Showing'} <span className="font-medium">{startIndex + 1}</span> {language === 'bg' ? 'до' : 'to'} <span className="font-medium">{Math.min(endIndex, filteredOrders.length)}</span> {language === 'bg' ? 'от' : 'of'} <span className="font-medium">{filteredOrders.length}</span> {language === 'bg' ? 'поръчки' : 'orders'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 sm:px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
                      >
                        <span className="sr-only">{t.previous || 'Previous'}</span>
                        <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 rotate-90" />
                      </button>
                      <div className="hidden md:flex">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                          // Show first page, last page, current page, and pages around current
                          if (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          ) {
                            return (
                              <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`relative inline-flex items-center px-3 sm:px-4 py-2 border text-sm font-medium transition-colors touch-manipulation ${
                                  currentPage === page
                                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 active:bg-gray-100'
                                }`}
                              >
                                {page}
                              </button>
                            );
                          } else if (page === currentPage - 2 || page === currentPage + 2) {
                            return <span key={page} className="relative inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>;
                          }
                          return null;
                        })}
                      </div>
                      <div className="md:hidden flex items-center px-3 border-t border-b border-gray-300 bg-white">
                        <span className="text-sm text-gray-700">
                          <span className="font-medium">{currentPage}</span> / <span className="font-medium">{totalPages}</span>
                        </span>
                      </div>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 sm:px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
                      >
                        <span className="sr-only">{t.next || 'Next'}</span>
                        <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 -rotate-90" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
            </>
          )}

          {filteredOrders.length === 0 && !loading && (
            <div className="text-center py-8 sm:py-12 px-4">
              <p className="text-sm sm:text-base text-gray-500">
                {t.noOrdersFound || 'No orders found'}
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
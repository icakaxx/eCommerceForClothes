'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Edit2, ChevronDown, ChevronUp, Package } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { getAdminSession } from '@/lib/auth';

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
  };
}

interface Order {
  orderid: string;
  customeremail?: string;
  total: number;
  status: string;
  createdat: string;
  order_items?: OrderItem[];
}

export default function SalesPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

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
    }
  }, [isAuthenticated]);

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

  const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(order => order.status === 'pending').length;

  return (
    <AdminLayout currentPath="/admin/sales">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Продажби</h1>
          <p className="text-gray-600 mt-2">Управление и преглед на вашите поръчки</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Общо поръчки</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">{totalOrders}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Общо приходи</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">${totalRevenue.toFixed(2)}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Поръчки в очакване</h3>
            <p className="text-3xl font-bold text-orange-600 mt-2">{pendingOrders}</p>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-500">Зареждане на поръчки...</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID на поръчка
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Продукти
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Покупател
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Сума
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Дата
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => {
                  const isExpanded = expandedOrders.has(order.orderid);
                  const itemCount = order.order_items?.length || 0;

                  return (
                    <React.Fragment key={order.orderid}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {order.orderid}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => toggleOrderExpansion(order.orderid)}
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <Package className="w-4 h-4" />
                            <span>{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.customeremail || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${order.total?.toFixed(2) || '0.00'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            order.status === 'delivered'
                              ? 'bg-green-100 text-green-800'
                              : order.status === 'shipped'
                              ? 'bg-blue-100 text-blue-800'
                              : order.status === 'confirmed'
                              ? 'bg-purple-100 text-purple-800'
                              : order.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : order.status === 'cancelled'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.createdat).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.orderid, e.target.value)}
                            disabled={updatingStatus === order.orderid}
                            className="text-sm border border-gray-300 rounded px-2 py-1 disabled:opacity-50"
                          >
                            <option value="pending">В очакване</option>
                            <option value="confirmed">Потвърдена</option>
                            <option value="shipped">Изпратена</option>
                            <option value="delivered">Доставена</option>
                            <option value="cancelled">Отказана</option>
                          </select>
                          {updatingStatus === order.orderid && (
                            <span className="ml-2 text-xs text-gray-500">Обновяване...</span>
                          )}
                        </td>
                      </tr>

                      {/* Expanded order items */}
                      {isExpanded && order.order_items && order.order_items.length > 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 bg-gray-50">
                            <div className="border rounded-lg bg-white p-4">
                              <h4 className="text-sm font-medium text-gray-900 mb-3">Order Items</h4>
                              <div className="space-y-3">
                                {order.order_items.map((item, index) => (
                                  <div key={item.OrderItemID || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                      {item.product.images && item.product.images.length > 0 ? (
                                        <img
                                          src={item.product.images[0]}
                                          alt={item.product.name}
                                          className="w-12 h-12 object-cover rounded-lg border"
                                          onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                          }}
                                        />
                                      ) : (
                                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                          <Package className="w-6 h-6 text-gray-400" />
                                        </div>
                                      )}
                                      <div>
                                        <p className="text-sm font-medium text-gray-900">
                                          {item.product.name}
                                        </p>
                                        <div className="text-xs text-gray-500 space-y-1">
                                          {item.product.name === 'Unknown Product' ? (
                                            <p className="text-red-500">⚠️ Product data missing from order</p>
                                          ) : (
                                            <>
                                              {item.product.brand && (
                                                <p>Brand: {item.product.brand}</p>
                                              )}
                                              {item.product.model && (
                                                <p>Model: {item.product.model}</p>
                                              )}
                                              <div className="flex gap-2">
                                                {item.product.color && (
                                                  <span>Color: {item.product.color}</span>
                                                )}
                                                {item.product.size && (
                                                  <span>Size: {item.product.size}</span>
                                                )}
                                              </div>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm font-medium text-gray-900">
                                        ${item.price?.toFixed(2) || '0.00'}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        Qty: {item.quantity}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        Subtotal: ${(item.price * item.quantity)?.toFixed(2) || '0.00'}
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
          )}

          {orders.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-500">
              No orders found
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
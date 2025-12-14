'use client';

import { useState, useEffect } from 'react';
import { Search, Package, DollarSign, Calendar, User, Phone, MapPin, Edit, X } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';
import AdminLayout from '../components/AdminLayout';

interface OrderItem {
  OrderItemID: string;
  quantity: number;
  price: number;
  createdat: string;
  product?: {
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
  customerfirstname: string;
  customerlastname: string;
  customeremail: string;
  customertelephone: string;
  customercountry: string;
  customercity: string;
  deliverytype: string;
  deliverynotes: string | null;
  subtotal: number;
  deliverycost: number;
  total: number;
  status: string;
  createdat: string;
  updatedat: string;
  order_items: OrderItem[];
}

export default function SalesPage() {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const t = translations[language];
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/admin/orders');
      const result = await response.json();

      if (result.success) {
        setOrders(result.orders);
      } else {
        console.error('Failed to fetch orders:', result.error);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = !searchTerm ||
      order.orderid.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${order.customerfirstname} ${order.customerlastname}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customeremail.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'bg' ? 'bg-BG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'confirmed':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      case 'shipped':
        return 'text-purple-600 bg-purple-50 dark:bg-purple-900/20';
      case 'delivered':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'cancelled':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getTotalItems = (order: Order) => {
    return order.order_items.reduce((total, item) => total + item.quantity, 0);
  };

  const handleUpdateOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!selectedOrder) return;

    setUpdatingStatus(true);
    try {
      const response = await fetch(`/api/admin/orders/${selectedOrder.orderid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      const result = await response.json();

      if (result.success) {
        // Update the order in the local state
        setOrders(orders.map(order => 
          order.orderid === selectedOrder.orderid 
            ? { ...order, status: newStatus.toLowerCase() }
            : order
        ));
        handleCloseModal();
      } else {
        console.error('Failed to update order:', result.error);
        alert(language === 'bg' ? 'Грешка при обновяване на поръчката' : 'Error updating order');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      alert(language === 'bg' ? 'Грешка при обновяване на поръчката' : 'Error updating order');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout currentPath="/admin/sales">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentPath="/admin/sales">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="mb-2">
            <h1
              className="text-2xl sm:text-3xl font-semibold transition-colors duration-300"
              style={{ color: theme.colors.text }}
            >
              {t.sales}
            </h1>
            <p
              className="text-sm sm:text-base transition-colors duration-300 mt-1"
              style={{ color: theme.colors.textSecondary }}
            >
              {t.viewAndManageOrders}
            </p>
          </div>

          <div
            className="rounded-lg shadow-sm p-3 sm:p-4 mb-4 sm:mb-6 transition-colors duration-300"
            style={{
              backgroundColor: theme.colors.surface,
              boxShadow: theme.effects.shadow
            }}
          >
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300"
                    size={18}
                    style={{ color: theme.colors.textSecondary }}
                  />
                  <input
                    type="text"
                    placeholder={t.searchOrders}
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

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 sm:px-4 py-2.5 sm:py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:border-transparent transition-colors duration-300 touch-manipulation min-h-[44px] sm:min-h-[auto]"
                style={{
                  backgroundColor: theme.colors.cardBg,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
              >
                <option value="all">{t.allStatuses}</option>
                <option value="pending">{t.pending}</option>
                <option value="confirmed">{t.confirmed}</option>
                <option value="shipped">{t.shipped}</option>
                <option value="delivered">{t.delivered}</option>
                <option value="cancelled">{t.cancelled}</option>
              </select>
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
                {filteredOrders.map(order => (
                  <div
                    key={order.orderid}
                    className="p-4 transition-colors duration-300"
                    style={{
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border
                    }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Package size={16} style={{ color: theme.colors.textSecondary }} />
                          <span
                            className="font-medium text-sm"
                            style={{ color: theme.colors.text }}
                          >
                            {order.orderid}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs mb-2">
                          <User size={14} style={{ color: theme.colors.textSecondary }} />
                          <span style={{ color: theme.colors.text }}>
                            {order.customerfirstname} {order.customerlastname}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs mb-2">
                          <Calendar size={14} style={{ color: theme.colors.textSecondary }} />
                          <span style={{ color: theme.colors.textSecondary }}>
                            {formatDate(order.createdat)}
                          </span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span style={{ color: theme.colors.textSecondary }}>Items: </span>
                        <span style={{ color: theme.colors.text }}>{getTotalItems(order)}</span>
                      </div>
                      <div>
                        <span style={{ color: theme.colors.textSecondary }}>{t.total}: </span>
                        <span style={{ color: theme.colors.text }} className="font-semibold">€{order.total.toFixed(2)}</span>
                      </div>
                      <div>
                        <span style={{ color: theme.colors.textSecondary }}>{t.delivery}: </span>
                        <span style={{ color: theme.colors.text }}>{order.deliverytype}</span>
                      </div>
                      <div>
                        <span style={{ color: theme.colors.textSecondary }}>{t.country}: </span>
                        <span style={{ color: theme.colors.text }}>{order.customercountry}</span>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="mt-3 pt-3 border-t" style={{ borderColor: theme.colors.border }}>
                      <div className="space-y-2">
                        {order.order_items.slice(0, 2).map((item, index) => (
                          <div key={item.OrderItemID} className="flex items-center justify-between text-xs">
                            <div className="flex-1 min-w-0">
                              <span style={{ color: theme.colors.text }}>
                                {item.product?.name || t.unknownProduct}
                              </span>
                              {item.product?.color && (
                                <span style={{ color: theme.colors.textSecondary }}>
                                  {' '}• {item.product.color}
                                </span>
                              )}
                              {item.product?.size && (
                                <span style={{ color: theme.colors.textSecondary }}>
                                  {' '}• {item.product.size}
                                </span>
                              )}
                            </div>
                            <div className="text-right">
                              <span style={{ color: theme.colors.text }}>
                                {item.quantity}x €{item.price.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))}
                        {order.order_items.length > 2 && (
                          <div className="text-xs" style={{ color: theme.colors.textSecondary }}>
                            +{order.order_items.length - 2} {t.moreItems}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Update Button */}
                    <div className="mt-3 pt-3 border-t" style={{ borderColor: theme.colors.border }}>
                      <button
                        onClick={() => handleUpdateOrder(order)}
                        className="w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-300 flex items-center justify-center gap-2"
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
                        <Edit size={16} />
                        {t.updateOrder}
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
                      Order ID
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase transition-colors duration-300" style={{ color: theme.colors.textSecondary }}>
                      Customer
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase transition-colors duration-300" style={{ color: theme.colors.textSecondary }}>
                      Date
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase transition-colors duration-300" style={{ color: theme.colors.textSecondary }}>
                      Items
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase transition-colors duration-300" style={{ color: theme.colors.textSecondary }}>
                      Total
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase transition-colors duration-300" style={{ color: theme.colors.textSecondary }}>
                      Status
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase transition-colors duration-300" style={{ color: theme.colors.textSecondary }}>
                      Delivery
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase transition-colors duration-300" style={{ color: theme.colors.textSecondary }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: theme.colors.border }}>
                  {filteredOrders.map(order => (
                    <tr
                      key={order.orderid}
                      className="transition-colors duration-300"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = theme.colors.secondary;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <td className="px-4 lg:px-6 py-4">
                        <div className="font-medium text-sm" style={{ color: theme.colors.text }}>
                          {order.orderid}
                        </div>
                        <div className="text-xs mt-1" style={{ color: theme.colors.textSecondary }}>
                          {order.order_items.length} item{order.order_items.length !== 1 ? 's' : ''}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="text-sm font-medium" style={{ color: theme.colors.text }}>
                          {order.customerfirstname} {order.customerlastname}
                        </div>
                        <div className="text-xs" style={{ color: theme.colors.textSecondary }}>
                          {order.customeremail}
                        </div>
                        <div className="text-xs flex items-center gap-1 mt-1" style={{ color: theme.colors.textSecondary }}>
                          <Phone size={12} />
                          {order.customertelephone}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-sm" style={{ color: theme.colors.text }}>
                        {formatDate(order.createdat)}
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="text-sm" style={{ color: theme.colors.text }}>
                          {getTotalItems(order)} items
                        </div>
                        <div className="text-xs mt-1 space-y-1 max-w-xs">
                          {order.order_items.slice(0, 2).map((item, index) => (
                            <div key={item.OrderItemID} className="truncate">
                              <span style={{ color: theme.colors.text }}>
                                {item.quantity}x {item.product?.name || 'Unknown Product'}
                              </span>
                              {item.product?.color && (
                                <span style={{ color: theme.colors.textSecondary }}>
                                  {' '}({item.product.color}
                                  {item.product?.size ? `, ${item.product.size}` : ''})
                                </span>
                              )}
                            </div>
                          ))}
                          {order.order_items.length > 2 && (
                            <div style={{ color: theme.colors.textSecondary }}>
                              +{order.order_items.length - 2} more...
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="text-sm font-medium" style={{ color: theme.colors.text }}>
                          €{order.total.toFixed(2)}
                        </div>
                        <div className="text-xs" style={{ color: theme.colors.textSecondary }}>
                          +€{order.deliverycost.toFixed(2)} delivery
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="text-sm" style={{ color: theme.colors.text }}>
                          {order.deliverytype}
                        </div>
                        <div className="text-xs flex items-center gap-1 mt-1" style={{ color: theme.colors.textSecondary }}>
                          <MapPin size={12} />
                          {order.customercountry}, {order.customercity}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <button
                          onClick={() => handleUpdateOrder(order)}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-300 flex items-center gap-2"
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
                          <Edit size={14} />
                          {t.update}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredOrders.length === 0 && (
              <div className="text-center py-12 px-4">
                <DollarSign
                  size={48}
                  className="mx-auto mb-4"
                  style={{ color: theme.colors.textSecondary }}
                />
                <p
                  className="text-sm sm:text-base transition-colors duration-300"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {filteredOrders.length === orders.length ? t.noOrdersFound : t.noOrdersMatchSearch}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Update Order Modal */}
      {isModalOpen && selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={handleCloseModal}
        >
          <div
            className="rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            style={{
              backgroundColor: theme.colors.surface,
              boxShadow: theme.effects.shadow
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className="px-4 sm:px-6 py-4 border-b flex items-center justify-between"
              style={{ borderColor: theme.colors.border }}
            >
              <h2
                className="text-xl sm:text-2xl font-semibold"
                style={{ color: theme.colors.text }}
              >
                {t.updateOrderTitle} {selectedOrder.orderid}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 rounded-lg transition-colors duration-300"
                style={{
                  color: theme.colors.textSecondary,
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.secondary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
              {/* Order Details */}
              <div className="mb-6">
                <h3
                  className="text-lg font-medium mb-4"
                  style={{ color: theme.colors.text }}
                >
                  {t.orderDetails}
                </h3>
                <div
                  className="rounded-lg p-4 space-y-3"
                  style={{
                    backgroundColor: theme.colors.cardBg,
                    borderColor: theme.colors.border,
                    borderWidth: '1px'
                  }}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span style={{ color: theme.colors.textSecondary }}>Customer: </span>
                      <span style={{ color: theme.colors.text }}>
                        {selectedOrder.customerfirstname} {selectedOrder.customerlastname}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: theme.colors.textSecondary }}>Email: </span>
                      <span style={{ color: theme.colors.text }}>{selectedOrder.customeremail}</span>
                    </div>
                    <div>
                      <span style={{ color: theme.colors.textSecondary }}>Phone: </span>
                      <span style={{ color: theme.colors.text }}>{selectedOrder.customertelephone}</span>
                    </div>
                    <div>
                      <span style={{ color: theme.colors.textSecondary }}>Location: </span>
                      <span style={{ color: theme.colors.text }}>
                        {selectedOrder.customercity}, {selectedOrder.customercountry}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: theme.colors.textSecondary }}>Delivery Type: </span>
                      <span style={{ color: theme.colors.text }}>{selectedOrder.deliverytype}</span>
                    </div>
                    <div>
                      <span style={{ color: theme.colors.textSecondary }}>Date: </span>
                      <span style={{ color: theme.colors.text }}>{formatDate(selectedOrder.createdat)}</span>
                    </div>
                    <div>
                      <span style={{ color: theme.colors.textSecondary }}>Subtotal: </span>
                      <span style={{ color: theme.colors.text }}>€{selectedOrder.subtotal.toFixed(2)}</span>
                    </div>
                    <div>
                      <span style={{ color: theme.colors.textSecondary }}>Delivery Cost: </span>
                      <span style={{ color: theme.colors.text }}>€{selectedOrder.deliverycost.toFixed(2)}</span>
                    </div>
                    <div className="sm:col-span-2">
                      <span style={{ color: theme.colors.textSecondary }}>Total: </span>
                      <span
                        className="text-lg font-semibold"
                        style={{ color: theme.colors.text }}
                      >
                        €{selectedOrder.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-6">
                <h3
                  className="text-lg font-medium mb-4"
                  style={{ color: theme.colors.text }}
                >
                  {t.orderItems} ({selectedOrder.order_items.length})
                </h3>
                <div
                  className="rounded-lg overflow-hidden"
                  style={{
                    backgroundColor: theme.colors.cardBg,
                    borderColor: theme.colors.border,
                    borderWidth: '1px'
                  }}
                >
                  <div className="divide-y" style={{ borderColor: theme.colors.border }}>
                    {selectedOrder.order_items.map((item) => (
                      <div
                        key={item.OrderItemID}
                        className="p-4 flex items-start justify-between gap-4"
                      >
                        <div className="flex-1 min-w-0">
                          <div
                            className="font-medium text-sm mb-1"
                            style={{ color: theme.colors.text }}
                          >
                            {item.product?.name || 'Unknown Product'}
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs" style={{ color: theme.colors.textSecondary }}>
                            {item.product?.brand && (
                              <span>Brand: {item.product.brand}</span>
                            )}
                            {item.product?.model && (
                              <span>Model: {item.product.model}</span>
                            )}
                            {item.product?.color && (
                              <span>Color: {item.product.color}</span>
                            )}
                            {item.product?.size && (
                              <span>Size: {item.product.size}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className="font-medium text-sm"
                            style={{ color: theme.colors.text }}
                          >
                            {item.quantity} × €{item.price.toFixed(2)}
                          </div>
                          <div
                            className="text-sm font-semibold mt-1"
                            style={{ color: theme.colors.text }}
                          >
                            €{(item.quantity * item.price).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Status Update */}
              <div>
                <h3
                  className="text-lg font-medium mb-4"
                  style={{ color: theme.colors.text }}
                >
                  {t.updateStatus}
                </h3>
                <div
                  className="rounded-lg p-4"
                  style={{
                    backgroundColor: theme.colors.cardBg,
                    borderColor: theme.colors.border,
                    borderWidth: '1px'
                  }}
                >
                  <div className="mb-3">
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: theme.colors.text }}
                    >
                      {t.currentStatus}
                    </label>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(selectedOrder.status)}`}>
                      {selectedOrder.status}
                    </span>
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: theme.colors.text }}
                    >
                      {t.newStatus}
                    </label>
                    <select
                      id="status-select"
                      className="w-full px-4 py-2.5 text-sm border rounded-lg focus:ring-2 focus:border-transparent transition-colors duration-300"
                      style={{
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border,
                        color: theme.colors.text
                      }}
                      defaultValue={selectedOrder.status}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              className="px-4 sm:px-6 py-4 border-t flex items-center justify-end gap-3"
              style={{ borderColor: theme.colors.border }}
            >
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-300"
                style={{
                  backgroundColor: theme.colors.secondary,
                  color: theme.colors.text
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
                disabled={updatingStatus}
              >
                {t.cancel}
              </button>
              <button
                onClick={() => {
                  const select = document.getElementById('status-select') as HTMLSelectElement;
                  if (select) {
                    handleStatusUpdate(select.value);
                  }
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-300 flex items-center gap-2"
                style={{
                  backgroundColor: theme.colors.primary,
                  color: '#ffffff'
                }}
                onMouseEnter={(e) => {
                  if (!updatingStatus) {
                    e.currentTarget.style.opacity = '0.9';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
                disabled={updatingStatus}
              >
                {updatingStatus ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {t.updating}
                  </>
                ) : (
                  t.saveChanges
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

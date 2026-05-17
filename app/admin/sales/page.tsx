'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, Package, Eye, Save, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase-browser';
import AdminModal from '../components/AdminModal';
import OrderEditModal from '../components/OrderEditModal';
import AdminLayout from '../components/AdminLayout';
import { getAdminSession } from '@/lib/auth';
import type { EcontOfficesData, EcontOffice } from '@/types/econt';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';
import { Badge } from '../components/layout';
import { getOrderStatusVariant } from '@/lib/admin-status-utils';
import { normalizeOrderStatus } from '@/lib/admin-order-status';

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
  customerfirstname?: string;
  customerlastname?: string;
  customertelephone?: string;
  customercountry?: string;
  customercity?: string;
  total: number;
  subtotal?: number;
  deliverycost?: number;
  discountcode?: string | null;
  discounttype?: string | null;
  discountvalue?: number | null;
  discountamount?: number | null;
  status: string;
  createdat: string;
  deliverytype?: string;
  econtoffice?: string;
  deliverynotes?: string | null;
  deliverystreet?: string | null;
  deliverystreetnumber?: string | null;
  deliveryentrance?: string | null;
  deliveryfloor?: string | null;
  deliveryapartment?: string | null;
  order_items?: OrderItem[];
  updatedat?: string;
  internal_note?: string | null;
  customer_order_note?: string | null;
  delivery_region?: string | null;
  return_stock_applied?: boolean;
}

const ALL_STATUS_KEYS = [
  'pending',
  'confirmed',
  'shipped',
  'delivered',
  'cancelled',
  'new',
  'prepared',
  'sent',
  'picked_up',
  'returned',
  'waiting_for_stock',
] as const;

export default function SalesPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = translations[language];
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    document.title = t.sales || (language === 'bg' ? 'Продажби' : 'Sales');
  }, [language, t]);
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [econtOffices, setEcontOffices] = useState<EcontOfficesData | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([
    'pending',
    'confirmed',
    'shipped',
    'delivered',
    'new',
    'prepared',
    'sent',
    'picked_up',
    'waiting_for_stock',
  ]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showOrderEditModal, setShowOrderEditModal] = useState(false);
  const [orderBeingEdited, setOrderBeingEdited] = useState<Order | null>(null);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortKey, setSortKey] = useState<'newest' | 'oldest' | 'total' | 'status' | 'updated'>('newest');
  const [savedViews, setSavedViews] = useState<Array<{ id: string; name: string; filters: unknown }>>([]);
  const [viewNameInput, setViewNameInput] = useState('');
  const [showDeleteOrderModal, setShowDeleteOrderModal] = useState(false);
  const [orderPendingDelete, setOrderPendingDelete] = useState<Order | null>(null);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [clearAllConfirmInput, setClearAllConfirmInput] = useState('');
  const [clearingAll, setClearingAll] = useState(false);

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
      case 'new':
        return language === 'bg' ? 'Нова' : 'New';
      case 'prepared':
        return language === 'bg' ? 'Подготвена' : 'Prepared';
      case 'sent':
        return language === 'bg' ? 'Изпратена' : 'Sent';
      case 'picked_up':
        return language === 'bg' ? 'Взета' : 'Picked up';
      case 'returned':
        return language === 'bg' ? 'Върната' : 'Returned';
      case 'waiting_for_stock':
        return language === 'bg' ? 'Чака стока' : 'Waiting for stock';
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
    (async () => {
      const { data } = await supabase.auth.getSession();
      setAdminUserId(data.session?.user?.id ?? null);
    })();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadOrders();
      loadEcontOffices();
    }
  }, [isAuthenticated]);

  const loadSavedViews = async () => {
    if (!adminUserId) return;
    const res = await fetch(`/api/admin/order-tracking-views?userId=${encodeURIComponent(adminUserId)}`);
    const data = await res.json();
    if (data.success && Array.isArray(data.views)) {
      setSavedViews(data.views.map((v: { id: string; name: string; filters: unknown }) => ({ id: v.id, name: v.name, filters: v.filters })));
    }
  };

  useEffect(() => {
    if (isAuthenticated && adminUserId) loadSavedViews();
  }, [isAuthenticated, adminUserId]);

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

  const updateOrderStatus = async (orderId: string, newStatus: string, note?: string | null) => {
    try {
      setUpdatingStatus(orderId);
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          note: note?.trim() || undefined,
          changedBy: adminUserId || undefined,
        }),
      });

      const result = await response.json();
      if (result.success) {
        const normalized = normalizeOrderStatus(newStatus);
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.orderid === orderId
              ? { ...order, status: normalized, updatedat: new Date().toISOString() }
              : order
          )
        );
        setSelectedOrder((prev) =>
          prev?.orderid === orderId ? { ...prev, status: normalized, updatedat: new Date().toISOString() } : prev
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

  const statusOptionsForOrder = (order: Order): string[] => {
    const current = normalizeOrderStatus(order.status || '');
    const keys = [...ALL_STATUS_KEYS];
    if (current && !keys.includes(current as (typeof ALL_STATUS_KEYS)[number])) {
      return [current, ...keys];
    }
    return keys;
  };

  const handleStatusSelectChange = (order: Order, newStatus: string) => {
    if (normalizeOrderStatus(newStatus) === normalizeOrderStatus(order.status || '')) return;
    void updateOrderStatus(order.orderid, newStatus);
  };

  const saveCurrentView = async () => {
    if (!adminUserId || !viewNameInput.trim()) {
      alert(language === 'bg' ? 'Въведи име на изглед' : 'Enter a view name');
      return;
    }
    const filters = { selectedStatuses, searchQuery, dateFrom, dateTo, sortKey };
    const res = await fetch('/api/admin/order-tracking-views', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: adminUserId,
        name: viewNameInput.trim(),
        visible_columns: [],
        filters,
        sorting: { sortKey },
      }),
    });
    const data = await res.json();
    if (data.success) {
      setViewNameInput('');
      loadSavedViews();
    } else {
      alert(data.error || 'Save failed');
    }
  };

  const applyView = (raw: unknown) => {
    const f = raw as {
      selectedStatuses?: string[];
      searchQuery?: string;
      dateFrom?: string;
      dateTo?: string;
      sortKey?: typeof sortKey;
    };
    if (f.selectedStatuses?.length) setSelectedStatuses(f.selectedStatuses);
    if (f.searchQuery !== undefined) setSearchQuery(f.searchQuery);
    if (f.dateFrom !== undefined) setDateFrom(f.dateFrom);
    if (f.dateTo !== undefined) setDateTo(f.dateTo);
    if (f.sortKey) setSortKey(f.sortKey);
  };

  const openDeleteOrderModal = (order: Order) => {
    setOrderPendingDelete(order);
    setShowDeleteOrderModal(true);
  };

  const closeDeleteOrderModal = () => {
    setOrderPendingDelete(null);
    setShowDeleteOrderModal(false);
  };

  const confirmDeleteOrder = async () => {
    if (!orderPendingDelete) return;
    setDeletingOrderId(orderPendingDelete.orderid);
    try {
      const res = await fetch(
        `/api/admin/orders/${encodeURIComponent(orderPendingDelete.orderid)}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (data.success) {
        setOrders((prev) => prev.filter((o) => o.orderid !== orderPendingDelete.orderid));
        closeDeleteOrderModal();
        if (selectedOrder?.orderid === orderPendingDelete.orderid) {
          closeOrderModal();
        }
      } else {
        alert(data.error || (language === 'bg' ? 'Грешка при изтриване' : 'Delete failed'));
      }
    } catch {
      alert(language === 'bg' ? 'Мрежова грешка' : 'Network error');
    } finally {
      setDeletingOrderId(null);
    }
  };

  const confirmClearAllOrders = async () => {
    if (clearAllConfirmInput !== 'DELETE_ALL_ORDERS') {
      alert(
        language === 'bg'
          ? 'Напиши точно: DELETE_ALL_ORDERS'
          : 'Type exactly: DELETE_ALL_ORDERS'
      );
      return;
    }
    setClearingAll(true);
    try {
      const res = await fetch('/api/admin/orders/clear-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'DELETE_ALL_ORDERS' }),
      });
      const data = await res.json();
      setShowClearAllModal(false);
      setClearAllConfirmInput('');
      await loadOrders();
      if (!res.ok) {
        alert(data.error || (language === 'bg' ? 'Грешка' : 'Error'));
        return;
      }
      const msg =
        language === 'bg'
          ? `Изтрити: ${data.deleted ?? 0} от ${data.attempted ?? 0}.`
          : `Deleted: ${data.deleted ?? 0} of ${data.attempted ?? 0}.`;
      if (data.errors?.length) {
        alert(`${msg}\n${language === 'bg' ? 'Проблеми:' : 'Issues:'}\n${data.errors.slice(0, 5).join('\n')}`);
      } else {
        alert(msg);
      }
    } catch {
      alert(language === 'bg' ? 'Мрежова грешка' : 'Network error');
    } finally {
      setClearingAll(false);
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

  const getDeliveryTypeLabel = (type?: string): string => {
    if (!type) return '-';
    switch (type) {
      case 'office':
        return language === 'bg' ? 'Офис на Еконт' : 'Econt Office';
      case 'address':
        return language === 'bg' ? 'Адрес' : 'Address';
      case 'econtomat':
        return language === 'bg' ? 'Еконтомат' : 'Econtomat';
      default:
        return type;
    }
  };

  const getCustomerFullName = (order: Order) => {
    const s = `${order.customerfirstname || ''} ${order.customerlastname || ''}`.trim();
    return s || '—';
  };

  const getInternalNote = (order: Order) => {
    const raw = order.internal_note;
    return typeof raw === 'string' ? raw.trim() : '';
  };

  const getOrderItemsNamesSummary = (order: Order) => {
    const chunks = (order.order_items || [])
      .map((item) => {
        const base =
          item.product?.name && item.product.name !== 'Unknown Product' ? item.product.name : '';
        if (!base) return '';
        return item.quantity > 1 ? `${base} ×${item.quantity}` : base;
      })
      .filter(Boolean);
    return chunks.length ? chunks.join(', ') : '—';
  };

  const getEcontOfficeCell = (order: Order) => {
    if (order.deliverytype === 'office' && order.econtoffice) {
      return getEcontOfficeName(order.econtoffice);
    }
    if (order.econtoffice) return getEcontOfficeName(order.econtoffice);
    return '—';
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

  const openOrderModal = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const closeOrderModal = () => {
    setShowOrderModal(false);
    setSelectedOrder(null);
  };

  const openOrderEditModal = (order: Order) => {
    setOrderBeingEdited(order);
    setShowOrderEditModal(true);
  };

  const closeOrderEditModal = () => {
    setShowOrderEditModal(false);
    setOrderBeingEdited(null);
  };

  const handleOrderEditSaved = async (orderId: string) => {
    try {
      const response = await fetch('/api/admin/orders');
      const result = await response.json();
      if (result.success) {
        const list: Order[] = result.orders || [];
        setOrders(list);
        if (selectedOrder?.orderid === orderId) {
          const updated = list.find((o) => o.orderid === orderId);
          if (updated) setSelectedOrder(updated);
        }
      }
    } catch (error) {
      console.error('Failed to refresh orders after edit:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'bg' ? 'bg-BG' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStatuses, searchQuery, dateFrom, dateTo, sortKey]);

  const filteredOrders = useMemo(() => {
    let list = orders.filter((order) => selectedStatuses.includes(order.status));

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((order) => {
        const name = `${order.customerfirstname || ''} ${order.customerlastname || ''}`.toLowerCase();
        const mail = (order.customeremail || '').toLowerCase();
        const phone = (order.customertelephone || '').toLowerCase();
        const city = (order.customercity || '').toLowerCase();
        const id = order.orderid.toLowerCase();
        const internal = getInternalNote(order).toLowerCase();
        const custNote = (order.customer_order_note || '').toLowerCase();
        const itemsLine = getOrderItemsNamesSummary(order).toLowerCase();
        const econt = getEcontOfficeCell(order).toLowerCase();
        return (
          name.includes(q) ||
          mail.includes(q) ||
          phone.includes(q) ||
          city.includes(q) ||
          id.includes(q) ||
          internal.includes(q) ||
          custNote.includes(q) ||
          itemsLine.includes(q) ||
          econt.includes(q)
        );
      });
    }

    if (dateFrom) {
      const from = new Date(dateFrom).getTime();
      list = list.filter((o) => new Date(o.createdat).getTime() >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      list = list.filter((o) => new Date(o.createdat).getTime() <= to.getTime());
    }

    const sorted = [...list];
    if (sortKey === 'newest') {
      sorted.sort((a, b) => new Date(b.createdat).getTime() - new Date(a.createdat).getTime());
    } else if (sortKey === 'oldest') {
      sorted.sort((a, b) => new Date(a.createdat).getTime() - new Date(b.createdat).getTime());
    } else if (sortKey === 'total') {
      sorted.sort((a, b) => (b.total || 0) - (a.total || 0));
    } else if (sortKey === 'status') {
      sorted.sort((a, b) => a.status.localeCompare(b.status));
    } else if (sortKey === 'updated') {
      sorted.sort(
        (a, b) =>
          new Date(b.updatedat || b.createdat).getTime() - new Date(a.updatedat || a.createdat).getTime()
      );
    }

    return sorted;
  }, [orders, selectedStatuses, searchQuery, dateFrom, dateTo, sortKey]);

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

  // Pagination calculations
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  // Calculate stats based on filtered orders (respect active filters)
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0);
  const totalOrders = filteredOrders.length;
  const pendingOrders = filteredOrders.filter((order) => order.status === 'pending').length;
  const pickedUpTotal = filteredOrders
    .filter((o) => o.status === 'picked_up' || o.status === 'delivered')
    .reduce((s, o) => s + (o.total || 0), 0);
  const returnedTotal = filteredOrders.filter((o) => o.status === 'returned').reduce((s, o) => s + (o.total || 0), 0);
  const sentCount = filteredOrders.filter((o) => o.status === 'shipped' || o.status === 'sent').length;
  const pickedUpCount = filteredOrders.filter((o) => o.status === 'picked_up' || o.status === 'delivered').length;
  const returnedCount = filteredOrders.filter((o) => o.status === 'returned').length;
  const waitingStockCount = filteredOrders.filter((o) => o.status === 'waiting_for_stock').length;
  const soldItemsCount = filteredOrders.reduce((s, o) => s + (o.order_items?.reduce((a, i) => a + (i.quantity || 0), 0) || 0), 0);

  return (
    <AdminLayout currentPath="/admin/sales">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-6">
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{t.sales || (language === 'bg' ? 'Продажби' : 'Sales')}</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Управление и преглед на вашите поръчки</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setClearAllConfirmInput('');
              setShowClearAllModal(true);
            }}
            className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-red-300 bg-red-50 text-red-800 text-sm font-semibold hover:bg-red-100 min-h-[44px] touch-manipulation"
          >
            <Trash2 className="w-4 h-4" />
            {language === 'bg' ? 'Изтрий всички поръчки' : 'Delete all orders'}
          </button>
        </div>

        <AdminModal
          isOpen={showDeleteOrderModal}
          onClose={closeDeleteOrderModal}
          title={language === 'bg' ? 'Изтриване на поръчка' : 'Delete order'}
          subheader={orderPendingDelete?.orderid}
          maxWidth="max-w-md"
          minWidth={280}
          minHeight={180}
        >
          {orderPendingDelete && (
            <div className="space-y-4">
              <p className="text-sm text-gray-700">
                {language === 'bg'
                  ? 'Поръчката ще бъде премахната завинаги. Наличностите се коригират автоматично (освен при върната поръчка с върната стока).'
                  : 'This order will be permanently removed. Stock is adjusted automatically (except fully returned orders where stock was already restored).'}
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg border text-sm min-h-[44px]"
                  onClick={closeDeleteOrderModal}
                >
                  {language === 'bg' ? 'Отказ' : 'Cancel'}
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm min-h-[44px] disabled:opacity-50"
                  disabled={deletingOrderId === orderPendingDelete.orderid}
                  onClick={() => confirmDeleteOrder()}
                >
                  {deletingOrderId === orderPendingDelete.orderid
                    ? language === 'bg'
                      ? 'Изтриване…'
                      : 'Deleting…'
                    : language === 'bg'
                      ? 'Изтрий'
                      : 'Delete'}
                </button>
              </div>
            </div>
          )}
        </AdminModal>

        <AdminModal
          isOpen={showClearAllModal}
          onClose={() => {
            setShowClearAllModal(false);
            setClearAllConfirmInput('');
          }}
          title={language === 'bg' ? 'Изтриване на всички поръчки' : 'Delete all orders'}
          subheader={language === 'bg' ? 'Необратимо действие' : 'Irreversible'}
          maxWidth="max-w-md"
          minWidth={280}
          minHeight={220}
        >
          <div className="space-y-4">
            <p className="text-sm text-red-800 font-medium">
              {language === 'bg'
                ? 'Всички поръчки в базата ще бъдат изтрити. Клиентските записи остават.'
                : 'Every order in the database will be removed. Customer records are kept.'}
            </p>
            <p className="text-xs text-gray-600">
              {language === 'bg'
                ? 'За потвърждение напиши точно: DELETE_ALL_ORDERS'
                : 'To confirm, type exactly: DELETE_ALL_ORDERS'}
            </p>
            <input
              className="w-full border rounded-lg px-3 py-2.5 text-sm font-mono min-h-[44px]"
              value={clearAllConfirmInput}
              onChange={(e) => setClearAllConfirmInput(e.target.value)}
              placeholder="DELETE_ALL_ORDERS"
              autoComplete="off"
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                className="px-4 py-2 rounded-lg border text-sm min-h-[44px]"
                onClick={() => {
                  setShowClearAllModal(false);
                  setClearAllConfirmInput('');
                }}
              >
                {language === 'bg' ? 'Отказ' : 'Cancel'}
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm min-h-[44px] disabled:opacity-50"
                disabled={clearingAll}
                onClick={() => confirmClearAllOrders()}
              >
                {clearingAll ? (language === 'bg' ? 'Изтриване…' : 'Deleting…') : language === 'bg' ? 'Изтрий всички' : 'Delete all'}
              </button>
            </div>
          </div>
        </AdminModal>

        <AdminModal
          isOpen={showOrderModal}
          onClose={closeOrderModal}
          title={language === 'bg' ? 'Детайли за поръчката' : 'Order details'}
          subheader={selectedOrder ? `${language === 'bg' ? 'Поръчка' : 'Order'} #${selectedOrder.orderid}` : undefined}
          maxWidth="max-w-4xl"
          minWidth={320}
          minHeight={400}
        >
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">{language === 'bg' ? 'Статус' : 'Status'}</p>
                  <Badge variant={getOrderStatusVariant(selectedOrder.status)}>
                    {getStatusTranslation(selectedOrder.status)}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-3">{language === 'bg' ? 'Дата' : 'Date'}</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(selectedOrder.createdat)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">{language === 'bg' ? 'Клиент' : 'Customer'}</p>
                  <p className="text-sm font-medium text-gray-900">
                    {`${selectedOrder.customerfirstname || ''} ${selectedOrder.customerlastname || ''}`.trim() || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">{language === 'bg' ? 'Имейл' : 'Email'}</p>
                  <p className="text-sm text-gray-900">{selectedOrder.customeremail || 'N/A'}</p>
                  <p className="text-xs text-gray-500 mt-2">{language === 'bg' ? 'Телефон' : 'Phone'}</p>
                  <p className="text-sm text-gray-900">{selectedOrder.customertelephone || 'N/A'}</p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  {language === 'bg' ? 'Доставка' : 'Delivery'}
                </h4>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">{language === 'bg' ? 'Тип:' : 'Type:'}</span>{' '}
                  {getDeliveryTypeLabel(selectedOrder.deliverytype)}
                </p>
                {selectedOrder.deliverytype === 'address' && (selectedOrder.deliverystreet || selectedOrder.deliverystreetnumber) && (
                  <p className="text-sm text-gray-700 mt-2">
                    <span className="font-medium">{language === 'bg' ? 'Адрес:' : 'Address:'}</span>{' '}
                    {selectedOrder.deliverystreet || ''} {selectedOrder.deliverystreetnumber || ''}
                    {selectedOrder.deliveryentrance ? `, ${language === 'bg' ? 'вх.' : 'Entrance'} ${selectedOrder.deliveryentrance}` : ''}
                    {selectedOrder.deliveryfloor ? `, ${language === 'bg' ? 'ет.' : 'Floor'} ${selectedOrder.deliveryfloor}` : ''}
                    {selectedOrder.deliveryapartment ? `, ${language === 'bg' ? 'ап.' : 'Apt'} ${selectedOrder.deliveryapartment}` : ''}
                  </p>
                )}
                {selectedOrder.deliverytype === 'office' && selectedOrder.econtoffice && (
                  <div className="text-sm text-gray-700 mt-2">
                    <p>
                      <span className="font-medium">{language === 'bg' ? 'Офис:' : 'Office:'}</span>{' '}
                      {getEcontOfficeName(selectedOrder.econtoffice)}
                    </p>
                    {getEcontOffice(selectedOrder.econtoffice)?.address && (
                      <p className="text-xs text-gray-500 mt-1">{getEcontOffice(selectedOrder.econtoffice)?.address}</p>
                    )}
                  </div>
                )}
                {(selectedOrder.deliverynotes || '').trim() && (
                  <p className="text-sm text-gray-700 mt-3">
                    <span className="font-medium">{language === 'bg' ? 'Бележки:' : 'Notes:'}</span>{' '}
                    {selectedOrder.deliverynotes}
                  </p>
                )}
                {(selectedOrder.customercity || selectedOrder.customercountry) && (
                  <p className="text-xs text-gray-500 mt-2">
                    {selectedOrder.customercity || ''}{selectedOrder.customercountry ? `, ${selectedOrder.customercountry}` : ''}
                  </p>
                )}
              </div>

              {(getInternalNote(selectedOrder) || (selectedOrder.customer_order_note || '').trim()) && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
                  <h4 className="text-sm font-semibold text-amber-950">
                    {language === 'bg' ? 'Бележки' : 'Notes'}
                  </h4>
                  {getInternalNote(selectedOrder) ? (
                    <p className="text-sm text-amber-950">
                      <span className="font-medium">{language === 'bg' ? 'Вътрешна:' : 'Internal:'}</span>{' '}
                      {getInternalNote(selectedOrder)}
                    </p>
                  ) : null}
                  {(selectedOrder.customer_order_note || '').trim() ? (
                    <p className="text-sm text-amber-950">
                      <span className="font-medium">{language === 'bg' ? 'Към клиента:' : 'Customer note:'}</span>{' '}
                      {selectedOrder.customer_order_note}
                    </p>
                  ) : null}
                </div>
              )}

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  {language === 'bg' ? 'Артикули' : 'Items'}
                </h4>
                <div className="space-y-3">
                  {(selectedOrder.order_items || []).map((item, index) => (
                    <div key={item.OrderItemID || index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gray-50 rounded-lg p-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.product.name}</p>
                        {item.product.allProperties && Object.keys(item.product.allProperties).length > 0 && (
                          <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                            {Object.entries(item.product.allProperties).map(([propName, propValue]) => (
                              <p key={propName} className="truncate">
                                <span className="font-medium">{propName}:</span> {propValue}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-gray-700">
                        <p>{language === 'bg' ? 'Кол.' : 'Qty'}: {item.quantity}</p>
                        <p>€{item.price?.toFixed(2) || '0.00'}</p>
                        <p className="font-medium">€{(item.price * item.quantity)?.toFixed(2) || '0.00'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between text-sm text-gray-700">
                  <span>{language === 'bg' ? 'Междинна сума' : 'Subtotal'}</span>
                  <span>€{selectedOrder.subtotal?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-700 mt-2">
                  <span>{language === 'bg' ? 'Доставка' : 'Delivery'}</span>
                  <span>€{selectedOrder.deliverycost?.toFixed(2) || '0.00'}</span>
                </div>
                {selectedOrder.discountamount && selectedOrder.discountamount > 0 && (
                  <div className="flex items-center justify-between text-sm text-green-700 mt-2">
                    <span>{language === 'bg' ? 'Отстъпка' : 'Discount'} {selectedOrder.discountcode ? `(${selectedOrder.discountcode})` : ''}</span>
                    <span>-€{selectedOrder.discountamount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-base font-semibold text-gray-900 mt-3">
                  <span>{language === 'bg' ? 'Общо' : 'Total'}</span>
                  <span>€{selectedOrder.total?.toFixed(2) || '0.00'}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-red-200">
                <button
                  type="button"
                  onClick={() => {
                    const o = selectedOrder;
                    if (!o) return;
                    setShowOrderModal(false);
                    setSelectedOrder(null);
                    setOrderPendingDelete(o);
                    setShowDeleteOrderModal(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 min-h-[44px] touch-manipulation"
                >
                  <Trash2 className="w-4 h-4" />
                  {language === 'bg' ? 'Изтрий тази поръчка' : 'Delete this order'}
                </button>
              </div>
            </div>
          )}
        </AdminModal>

        <OrderEditModal
          isOpen={showOrderEditModal}
          order={orderBeingEdited}
          language={language}
          adminUserId={adminUserId}
          onClose={closeOrderEditModal}
          onSaved={handleOrderEditSaved}
        />

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

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-xs font-semibold text-gray-700">Изпратени (бр.)</h3>
            <p className="text-xl font-bold text-indigo-600 mt-1">{sentCount}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-xs font-semibold text-gray-700">Взети (бр.)</h3>
            <p className="text-xl font-bold text-green-600 mt-1">{pickedUpCount}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-xs font-semibold text-gray-700">Върнати (бр.)</h3>
            <p className="text-xl font-bold text-red-600 mt-1">{returnedCount}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-xs font-semibold text-gray-700">Чака стока</h3>
            <p className="text-xl font-bold text-amber-600 mt-1">{waitingStockCount}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow col-span-2 sm:col-span-1">
            <h3 className="text-xs font-semibold text-gray-700">Сума взети / доставени</h3>
            <p className="text-lg font-bold text-gray-900 mt-1">€{pickedUpTotal.toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow col-span-2 sm:col-span-1">
            <h3 className="text-xs font-semibold text-gray-700">Сума върнати</h3>
            <p className="text-lg font-bold text-gray-900 mt-1">€{returnedTotal.toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow col-span-2 lg:col-span-2">
            <h3 className="text-xs font-semibold text-gray-700">Общо продадени бройки (артикули)</h3>
            <p className="text-xl font-bold text-blue-700 mt-1">{soldItemsCount}</p>
          </div>
        </div>

        {/* Status Filters */}
        <div className="bg-white rounded-lg shadow p-3 sm:p-4 mb-4 sm:mb-6">
          <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">{language === 'bg' ? 'Филтрирай по статус' : 'Filter by Status'}</h3>
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3">
            {ALL_STATUS_KEYS.map((status) => (
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

        <div className="bg-white rounded-lg shadow p-3 sm:p-4 mb-4 sm:mb-6 space-y-3">
          <h3 className="text-xs sm:text-sm font-medium text-gray-700">
            {language === 'bg' ? 'Търсене и сортиране' : 'Search and sort'}
          </h3>
          <div className="flex flex-col lg:flex-row gap-3 flex-wrap">
            <input
              className="flex-1 min-w-[200px] border rounded-lg px-3 py-2.5 text-sm min-h-[44px]"
              placeholder={language === 'bg' ? 'Клиент, имейл, телефон, град, № поръчка…' : 'Customer, email, phone, city, order #…'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <input
              type="date"
              className="border rounded-lg px-3 py-2.5 text-sm min-h-[44px]"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              aria-label="from"
            />
            <input
              type="date"
              className="border rounded-lg px-3 py-2.5 text-sm min-h-[44px]"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              aria-label="to"
            />
            <select
              className="border rounded-lg px-3 py-2.5 text-sm min-h-[44px]"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as typeof sortKey)}
            >
              <option value="newest">{language === 'bg' ? 'Най-нови първо' : 'Newest first'}</option>
              <option value="oldest">{language === 'bg' ? 'Най-стари първо' : 'Oldest first'}</option>
              <option value="total">{language === 'bg' ? 'По сума' : 'By total'}</option>
              <option value="status">{language === 'bg' ? 'По статус' : 'By status'}</option>
              <option value="updated">{language === 'bg' ? 'Последна промяна' : 'Last updated'}</option>
            </select>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center flex-wrap">
            <span className="text-xs text-gray-500">{language === 'bg' ? 'Запазени изгледи:' : 'Saved views:'}</span>
            <select
              className="border rounded-lg px-2 py-2 text-sm min-h-[40px] max-w-xs"
              defaultValue=""
              onChange={(e) => {
                const id = e.target.value;
                const v = savedViews.find((x) => x.id === id);
                if (v?.filters) applyView(v.filters);
                e.target.value = '';
              }}
            >
              <option value="">{language === 'bg' ? '— зареди изглед —' : '— load view —'}</option>
              {savedViews.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
            <input
              className="border rounded-lg px-2 py-2 text-sm flex-1 min-w-[120px] max-w-xs min-h-[40px]"
              placeholder={language === 'bg' ? 'Име на изглед' : 'View name'}
              value={viewNameInput}
              onChange={(e) => setViewNameInput(e.target.value)}
            />
            <button
              type="button"
              onClick={() => saveCurrentView()}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-900 text-white text-sm min-h-[40px]"
            >
              <Save className="w-4 h-4" />
              {language === 'bg' ? 'Запази изглед' : 'Save view'}
            </button>
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
            <p className="text-xs text-gray-500 mb-2 px-1">
              {language === 'bg'
                ? 'Двоен клик върху ред за редакция на поръчката.'
                : 'Double-click a row to edit the order.'}
            </p>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 xl:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[11rem]">
                      ID
                    </th>
                    <th className="px-3 xl:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                      Пълно име
                    </th>
                    <th className="px-3 xl:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Телефон
                    </th>
                    <th className="px-3 xl:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Град
                    </th>
                    <th className="px-3 xl:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]">
                      Офис Еконт
                    </th>
                    <th className="px-3 xl:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                      Вътрешна бележка
                    </th>
                    <th className="px-3 xl:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[180px]">
                      Артикули
                    </th>
                    <th className="px-3 xl:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Сума
                    </th>
                    <th className="px-3 xl:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Статус
                    </th>
                    <th className="px-3 xl:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Дата
                    </th>
                    <th className="px-3 xl:px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedOrders.map((order) => {
                    const isExpanded = expandedOrders.has(order.orderid);

                    const namesSummary = getOrderItemsNamesSummary(order);
                    const internalNote = getInternalNote(order);

                    return (
                      <React.Fragment key={order.orderid}>
                        <tr
                          className="hover:bg-gray-50 cursor-pointer"
                          onDoubleClick={() => openOrderEditModal(order)}
                        >
                          <td className="px-3 xl:px-4 py-3 align-top text-xs font-mono text-gray-800 whitespace-nowrap min-w-[11rem]">
                            <span title={order.orderid}>{order.orderid}</span>
                          </td>
                          <td className="px-3 xl:px-4 py-3 align-top text-sm text-gray-900 max-w-[160px]">
                            <span className="line-clamp-2" title={getCustomerFullName(order)}>
                              {getCustomerFullName(order)}
                            </span>
                          </td>
                          <td className="px-3 xl:px-4 py-3 align-top text-sm text-gray-700 whitespace-nowrap">
                            {order.customertelephone || '—'}
                          </td>
                          <td className="px-3 xl:px-4 py-3 align-top text-sm text-gray-700 max-w-[100px]">
                            <span className="truncate block" title={order.customercity || ''}>
                              {order.customercity || '—'}
                            </span>
                          </td>
                          <td className="px-3 xl:px-4 py-3 align-top text-sm text-gray-700 max-w-[200px]">
                            <span className="line-clamp-2" title={getEcontOfficeCell(order)}>
                              {getEcontOfficeCell(order)}
                            </span>
                          </td>
                          <td className="px-3 xl:px-4 py-3 align-top text-sm text-gray-600 max-w-[200px]">
                            {internalNote ? (
                              <span className="line-clamp-2" title={internalNote}>
                                {internalNote}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-3 xl:px-4 py-3 align-top text-sm text-gray-800 max-w-[260px]">
                            <div className="flex items-start gap-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleOrderExpansion(order.orderid);
                                }}
                                className="flex-shrink-0 mt-0.5 p-0.5 text-blue-600 hover:text-blue-800"
                                title={language === 'bg' ? 'Детайли' : 'Details'}
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                              <span className="line-clamp-2 min-w-0" title={namesSummary}>
                                {namesSummary}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 xl:px-4 py-3 align-top whitespace-nowrap text-sm font-medium text-gray-900">
                            €{order.total?.toFixed(2) || '0.00'}
                          </td>
                          <td
                            className="px-3 xl:px-4 py-3 align-top whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                            onDoubleClick={(e) => e.stopPropagation()}
                          >
                            <select
                              className="text-xs sm:text-sm border border-gray-300 rounded px-2 py-1.5 min-h-[36px] max-w-[11rem] bg-white hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                              value={normalizeOrderStatus(order.status || 'pending')}
                              disabled={updatingStatus === order.orderid}
                              onChange={(e) => handleStatusSelectChange(order, e.target.value)}
                              title={language === 'bg' ? 'Статус' : 'Status'}
                              aria-label={language === 'bg' ? 'Статус' : 'Status'}
                            >
                              {statusOptionsForOrder(order).map((s) => (
                                <option key={s} value={s}>
                                  {getStatusTranslation(s)}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 xl:px-4 py-3 align-top whitespace-nowrap text-sm text-gray-500">
                            {new Date(order.createdat).toLocaleDateString()}
                          </td>
                          <td
                            className="px-3 xl:px-4 py-3 align-top text-right text-sm font-medium"
                            onClick={(e) => e.stopPropagation()}
                            onDoubleClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => openOrderModal(order)}
                                className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors"
                                title={language === 'bg' ? 'Преглед' : 'View'}
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => openDeleteOrderModal(order)}
                                disabled={deletingOrderId === order.orderid}
                                className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                                title={language === 'bg' ? 'Изтрий' : 'Delete'}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              {updatingStatus === order.orderid && (
                                <span className="ml-2 text-xs text-gray-500">
                                  {language === 'bg' ? 'Обновяване...' : 'Updating...'}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Expanded order items - Desktop */}
                        {isExpanded && order.order_items && order.order_items.length > 0 && (
                          <tr>
                            <td colSpan={11} className="px-4 xl:px-6 py-4 bg-gray-50">
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
                                              <p className="text-red-500">a️ Product data missing</p>
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
              <p className="text-xs text-gray-500 mb-2 px-1 lg:hidden">
                {language === 'bg'
                  ? 'Двоен клик върху картата за редакция.'
                  : 'Double-click a card to edit.'}
              </p>
              <div className="divide-y divide-gray-200">
                {paginatedOrders.map((order) => {
                  const isExpanded = expandedOrders.has(order.orderid);
                  const itemCount = order.order_items?.length || 0;
                  const mNames = getOrderItemsNamesSummary(order);
                  const mNote = getInternalNote(order);

                  return (
                    <div
                      key={order.orderid}
                      className="p-3 sm:p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      onDoubleClick={() => openOrderEditModal(order)}
                    >
                      {/* Order Header Card */}
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-mono text-gray-500 mb-1 truncate">{order.orderid}</p>
                            <p className="text-sm font-semibold text-gray-900">{getCustomerFullName(order)}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              <span className="font-medium">{language === 'bg' ? 'Тел.:' : 'Phone:'}</span>{' '}
                              {order.customertelephone || '—'}
                            </p>
                            <p className="text-xs text-gray-600">
                              <span className="font-medium">{language === 'bg' ? 'Град:' : 'City:'}</span>{' '}
                              {order.customercity || '—'}
                            </p>
                            <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">
                              <span className="font-medium">{language === 'bg' ? 'Еконт:' : 'Econt:'}</span>{' '}
                              {getEcontOfficeCell(order)}
                            </p>
                            {mNote ? (
                              <p className="text-xs text-amber-900 bg-amber-50 border border-amber-100 rounded px-2 py-1 mt-2 line-clamp-3">
                                <span className="font-medium">{language === 'bg' ? 'Вътр. бел.:' : 'Internal:'}</span> {mNote}
                              </p>
                            ) : null}
                            <p className="text-xs text-gray-700 mt-2 line-clamp-3" title={mNames}>
                              <span className="font-medium">{language === 'bg' ? 'Артикули:' : 'Items:'}</span> {mNames}
                            </p>
                            {order.customeremail ? (
                              <p className="text-xs text-gray-500 mt-1 truncate">{order.customeremail}</p>
                            ) : null}
                          </div>
                          <select
                            className="flex-shrink-0 text-xs border border-gray-300 rounded px-2 py-1.5 min-h-[36px] max-w-[10rem] bg-white disabled:opacity-50 cursor-pointer"
                            value={normalizeOrderStatus(order.status || 'pending')}
                            disabled={updatingStatus === order.orderid}
                            onClick={(e) => e.stopPropagation()}
                            onDoubleClick={(e) => e.stopPropagation()}
                            onChange={(e) => handleStatusSelectChange(order, e.target.value)}
                            title={language === 'bg' ? 'Статус' : 'Status'}
                            aria-label={language === 'bg' ? 'Статус' : 'Status'}
                          >
                            {statusOptionsForOrder(order).map((s) => (
                              <option key={s} value={s}>
                                {getStatusTranslation(s)}
                              </option>
                            ))}
                          </select>
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
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openOrderModal(order);
                            }}
                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors"
                            title={language === 'bg' ? 'Преглед' : 'View'}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>

                        <div
                          className="flex items-center justify-between gap-2 pt-2"
                          onClick={(e) => e.stopPropagation()}
                          onDoubleClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
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

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openDeleteOrderModal(order)}
                              disabled={deletingOrderId === order.orderid}
                              className="p-2 min-h-[44px] min-w-[44px] text-red-600 hover:bg-red-50 rounded border border-red-200 disabled:opacity-50"
                              title={language === 'bg' ? 'Изтрий' : 'Delete'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
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
                                        <p className="text-red-500">a️ Product data missing</p>
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

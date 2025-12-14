'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useStoreSettings } from '@/context/StoreSettingsContext';
import { translations } from '@/lib/translations';
import { CheckCircle, Mail, Clock, Package, Truck, MapPin } from 'lucide-react';

interface OrderItem {
  orderitemid: string;
  quantity: number;
  price: number;
  product?: {
    name: string;
    brand?: string;
    model?: string;
    color?: string;
    size?: string;
    imageUrl: string;
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
  items: OrderItem[];
}

function CheckoutSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  const { theme } = useTheme();
  const { settings } = useStoreSettings();
  const t = translations[language || 'en'];

  const [orderId, setOrderId] = useState<string>('');
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const adminState = localStorage.getItem('isAdmin');
    if (adminState === 'true') {
      setIsAdmin(true);
    }
  }, []);

  useEffect(() => {
    const orderIdParam = searchParams.get('orderId');
    if (!orderIdParam) {
      router.push('/');
      return;
    }

    setOrderId(orderIdParam);
    fetchOrderDetails(orderIdParam);
  }, [searchParams, router]);

  const fetchOrderDetails = async (id: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/orders/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch order details');
      }

      const data = await response.json();
      if (data.success && data.order) {
        setOrder(data.order);
      } else {
        throw new Error('Invalid order data');
      }
    } catch (err) {
      console.error('Error fetching order:', err);
      setError(err instanceof Error ? err.message : 'Failed to load order details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetIsAdmin = (value: boolean) => {
    setIsAdmin(value);
    localStorage.setItem('isAdmin', value.toString());
  };

  const getDeliveryTypeLabel = (type: string) => {
    switch (type) {
      case 'office':
        return language === 'bg' ? 'Офис на Speedy' : 'Speedy Office';
      case 'address':
        return language === 'bg' ? 'Адрес' : 'Address';
      case 'econtomat':
        return language === 'bg' ? 'Еконтомат' : 'Econtomat';
      default:
        return type;
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

  if (!orderId) {
    return null; // Will redirect
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header isAdmin={isAdmin} setIsAdmin={handleSetIsAdmin} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p style={{ color: theme.colors.textSecondary }}>
              {language === 'bg' ? 'Зареждане на детайли за поръчката...' : 'Loading order details...'}
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header isAdmin={isAdmin} setIsAdmin={handleSetIsAdmin} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <p className="text-red-600 mb-4">{error || 'Order not found'}</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {language === 'bg' ? 'Върни се в началото' : 'Return to Home'}
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const isGradientTheme = theme.id === 'gradient';

  return (
    <div className="min-h-screen flex flex-col">
      <Header isAdmin={isAdmin} setIsAdmin={handleSetIsAdmin} />
      <div 
        className="flex-1 transition-colors duration-300"
        style={{ 
          background: isGradientTheme ? theme.colors.background : theme.colors.background
        }}
      >
        <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div 
              className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
              style={{ backgroundColor: theme.colors.primary + '20' }}
            >
              <CheckCircle size={32} style={{ color: theme.colors.primary }} />
            </div>
            <h1 
              className="text-3xl sm:text-4xl font-bold mb-2 transition-colors duration-300"
              style={{ color: theme.colors.text }}
            >
              {language === 'bg' ? 'Поръчката е приета успешно!' : 'Order Placed Successfully!'}
            </h1>
            <p 
              className="text-lg transition-colors duration-300"
              style={{ color: theme.colors.textSecondary }}
            >
              {language === 'bg' 
                ? 'Благодарим за поръчката! Ще обработим поръчката ви възможно най-бързо и ще ви информираме по имейл за всяка промяна в статуса.'
                : 'Thank you for your order! We will process your order as soon as possible and keep you updated via email.'}
            </p>
          </div>

          {/* Order Summary Card */}
          <div 
            className="rounded-lg mb-8 p-6 transition-colors duration-300"
            style={{
              backgroundColor: theme.colors.cardBg,
              border: `1px solid ${theme.colors.border}`
            }}
          >
            <h2 
              className="text-xl font-semibold mb-6 transition-colors duration-300"
              style={{ color: theme.colors.text }}
            >
              {language === 'bg' ? 'Резюме на поръчката' : 'Order Summary'}
            </h2>

            {/* Order ID */}
            <div className="mb-6 pb-6 border-b" style={{ borderColor: theme.colors.border }}>
              <p 
                className="text-sm mb-2 transition-colors duration-300"
                style={{ color: theme.colors.textSecondary }}
              >
                {language === 'bg' ? 'Номер на поръчка' : 'Order Number'}
              </p>
              <p 
                className="text-2xl font-bold font-mono transition-colors duration-300"
                style={{ color: theme.colors.text }}
              >
                #{order.orderid}
              </p>
              <p 
                className="text-sm mt-2 transition-colors duration-300"
                style={{ color: theme.colors.textSecondary }}
              >
                {formatDate(order.createdat)}
              </p>
            </div>

            {/* Order Items */}
            <div className="mb-6">
              <h3 
                className="text-lg font-medium mb-4 transition-colors duration-300"
                style={{ color: theme.colors.text }}
              >
                {language === 'bg' ? 'Поръчани продукти' : 'Order Items'}
              </h3>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div 
                    key={item.orderitemid} 
                    className="flex gap-4 pb-4 border-b last:border-b-0 last:pb-0"
                    style={{ borderColor: theme.colors.border }}
                  >
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={item.product?.imageUrl || '/image.png'}
                        alt={item.product?.name || 'Product'}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 
                        className="font-medium mb-1 transition-colors duration-300"
                        style={{ color: theme.colors.text }}
                      >
                        {item.product?.name || 'Unknown Product'}
                      </h4>
                      {(item.product?.brand || item.product?.model) && (
                        <p 
                          className="text-sm mb-1 transition-colors duration-300"
                          style={{ color: theme.colors.textSecondary }}
                        >
                          {item.product?.brand} {item.product?.model}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 text-sm">
                        {item.product?.color && (
                          <span 
                            className="transition-colors duration-300"
                            style={{ color: theme.colors.textSecondary }}
                          >
                            {language === 'bg' ? 'Цвят' : 'Color'}: {item.product.color}
                          </span>
                        )}
                        {item.product?.size && (
                          <span 
                            className="transition-colors duration-300"
                            style={{ color: theme.colors.textSecondary }}
                          >
                            {language === 'bg' ? 'Размер' : 'Size'}: {item.product.size}
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span 
                          className="text-sm transition-colors duration-300"
                          style={{ color: theme.colors.textSecondary }}
                        >
                          {language === 'bg' ? 'Количество' : 'Quantity'}: {item.quantity}
                        </span>
                        <span 
                          className="font-medium transition-colors duration-300"
                          style={{ color: theme.colors.text }}
                        >
                          €{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Totals */}
            <div className="pt-4 border-t" style={{ borderColor: theme.colors.border }}>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span style={{ color: theme.colors.textSecondary }}>
                    {language === 'bg' ? 'Междинна сума' : 'Subtotal'}:
                  </span>
                  <span style={{ color: theme.colors.text }}>€{order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: theme.colors.textSecondary }}>
                    {language === 'bg' ? 'Доставка' : 'Delivery'} ({getDeliveryTypeLabel(order.deliverytype)}):
                  </span>
                  <span style={{ color: theme.colors.text }}>€{order.deliverycost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t" style={{ borderColor: theme.colors.border }}>
                  <span style={{ color: theme.colors.text }}>
                    {language === 'bg' ? 'Обща сума' : 'Total'}:
                  </span>
                  <span style={{ color: theme.colors.primary }}>€{order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer & Delivery Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Customer Info */}
            <div 
              className="rounded-lg p-6 transition-colors duration-300"
              style={{
                backgroundColor: theme.colors.cardBg,
                border: `1px solid ${theme.colors.border}`
              }}
            >
              <h3 
                className="text-lg font-semibold mb-4 transition-colors duration-300"
                style={{ color: theme.colors.text }}
              >
                {language === 'bg' ? 'Информация за клиента' : 'Customer Information'}
              </h3>
              <div className="space-y-2 text-sm">
                <p style={{ color: theme.colors.text }}>
                  <strong>{order.customerfirstname} {order.customerlastname}</strong>
                </p>
                <p style={{ color: theme.colors.textSecondary }}>
                  {order.customeremail}
                </p>
                <p style={{ color: theme.colors.textSecondary }}>
                  {order.customertelephone}
                </p>
                <p style={{ color: theme.colors.textSecondary }}>
                  {order.customercity}, {order.customercountry}
                </p>
              </div>
            </div>

            {/* Delivery Info */}
            <div 
              className="rounded-lg p-6 transition-colors duration-300"
              style={{
                backgroundColor: theme.colors.cardBg,
                border: `1px solid ${theme.colors.border}`
              }}
            >
              <h3 
                className="text-lg font-semibold mb-4 transition-colors duration-300"
                style={{ color: theme.colors.text }}
              >
                {language === 'bg' ? 'Информация за доставка' : 'Delivery Information'}
              </h3>
              <div className="space-y-2 text-sm">
                <p style={{ color: theme.colors.textSecondary }}>
                  <strong style={{ color: theme.colors.text }}>
                    {language === 'bg' ? 'Тип доставка' : 'Delivery Type'}:
                  </strong> {getDeliveryTypeLabel(order.deliverytype)}
                </p>
                {order.deliverynotes && (
                  <p style={{ color: theme.colors.textSecondary }}>
                    <strong style={{ color: theme.colors.text }}>
                      {language === 'bg' ? 'Бележки' : 'Notes'}:
                    </strong> {order.deliverynotes}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div 
            className="rounded-lg p-6 mb-8 transition-colors duration-300"
            style={{
              backgroundColor: theme.colors.primary + '10',
              border: `1px solid ${theme.colors.primary + '30'}`
            }}
          >
            <div className="flex items-start gap-4">
              <Mail size={24} style={{ color: theme.colors.primary }} className="flex-shrink-0 mt-1" />
              <div>
                <h3 
                  className="text-lg font-semibold mb-2 transition-colors duration-300"
                  style={{ color: theme.colors.text }}
                >
                  {language === 'bg' ? 'Следващи стъпки' : 'Next Steps'}
                </h3>
                <p 
                  className="text-sm leading-relaxed transition-colors duration-300"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {language === 'bg' 
                    ? 'Ще обработим поръчката ви възможно най-бързо. Ще получите имейл потвърждение с детайли за поръчката и ще ви информираме по имейл за всяка промяна в статуса на поръчката, включително когато бъде изпратена.'
                    : 'We will process your order as soon as possible. You will receive an email confirmation with your order details, and we will keep you updated via email about any changes to your order status, including when it has been shipped.'}
                </p>
              </div>
            </div>
          </div>

          {/* Order Status Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div 
              className="rounded-lg p-4 text-center transition-colors duration-300"
              style={{
                backgroundColor: theme.colors.cardBg,
                border: `1px solid ${theme.colors.border}`
              }}
            >
              <Package size={24} style={{ color: theme.colors.primary }} className="mx-auto mb-2" />
              <h4 
                className="font-medium mb-1 transition-colors duration-300"
                style={{ color: theme.colors.text }}
              >
                {language === 'bg' ? 'Поръчката е получена' : 'Order Received'}
              </h4>
              <p 
                className="text-xs transition-colors duration-300"
                style={{ color: theme.colors.textSecondary }}
              >
                {language === 'bg' ? 'Обработва се' : 'Processing'}
              </p>
            </div>

            <div 
              className="rounded-lg p-4 text-center transition-colors duration-300 opacity-75"
              style={{
                backgroundColor: theme.colors.cardBg,
                border: `1px solid ${theme.colors.border}`
              }}
            >
              <Truck size={24} style={{ color: theme.colors.textSecondary }} className="mx-auto mb-2" />
              <h4 
                className="font-medium mb-1 transition-colors duration-300"
                style={{ color: theme.colors.text }}
              >
                {language === 'bg' ? 'В транзит' : 'In Transit'}
              </h4>
              <p 
                className="text-xs transition-colors duration-300"
                style={{ color: theme.colors.textSecondary }}
              >
                {language === 'bg' ? 'Подготвя се за изпращане' : 'Preparing for shipment'}
              </p>
            </div>

            <div 
              className="rounded-lg p-4 text-center transition-colors duration-300 opacity-75"
              style={{
                backgroundColor: theme.colors.cardBg,
                border: `1px solid ${theme.colors.border}`
              }}
            >
              <MapPin size={24} style={{ color: theme.colors.textSecondary }} className="mx-auto mb-2" />
              <h4 
                className="font-medium mb-1 transition-colors duration-300"
                style={{ color: theme.colors.text }}
              >
                {language === 'bg' ? 'Доставена' : 'Delivered'}
              </h4>
              <p 
                className="text-xs transition-colors duration-300"
                style={{ color: theme.colors.textSecondary }}
              >
                {language === 'bg' ? 'Очаква се 2-3 дни' : 'Estimated 2-3 days'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => router.push('/')}
              className="flex-1 py-3 px-6 rounded-lg font-medium transition-colors duration-300"
              style={{
                backgroundColor: theme.colors.primary,
                color: '#fff'
              }}
            >
              {language === 'bg' ? 'Продължи пазаруването' : 'Continue Shopping'}
            </button>
            {settings?.email && (
              <a
                href={`mailto:${settings.email}?subject=${encodeURIComponent(language === 'bg' ? 'Въпрос за поръчка' : 'Order Question')} #${order.orderid}`}
                className="flex-1 py-3 px-6 rounded-lg font-medium text-center transition-colors duration-300"
                style={{
                  border: `1px solid ${theme.colors.border}`,
                  color: theme.colors.text,
                  backgroundColor: theme.colors.background
                }}
              >
                {language === 'bg' ? 'Свържи се с нас' : 'Contact Us'}
              </a>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useCart } from '@/context/CartContext';
import { useCheckoutStore, type DeliveryType, type CityOption } from '@/store/checkoutStore';
import { translations } from '@/lib/translations';
import { ShoppingBag, Truck, MapPin, Package } from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { theme } = useTheme();
  const { items, totalItems, totalPrice, clearCart } = useCart();
  const {
    formData,
    cities,
    isSubmitting,
    isValidatingStock,
    error,
    insufficientStock,
    updateFormData,
    setCities,
    setSubmitting,
    setValidatingStock,
    setError,
    setInsufficientStock,
    resetForm,
    isFormValid,
    fullName
  } = useCheckoutStore();

  const t = translations[language || 'en'];
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const adminState = localStorage.getItem('isAdmin');
    if (adminState === 'true') {
      setIsAdmin(true);
    }

    // Redirect if cart is empty
    if (totalItems === 0) {
      router.push('/');
      return;
    }

    // Load cities data
    loadCities();
  }, [totalItems, router]);

  const loadCities = async () => {
    // This would typically come from an API, but for now we'll use static data
    const bulgarianCities: CityOption[] = [
      { name: 'Пловдив', postcode: '4000', displayName: 'Пловдив [4000]' },
      { name: 'Варна', postcode: '9000', displayName: 'Варна [9000]' },
      { name: 'Бургас', postcode: '8000', displayName: 'Бургас [8000]' },
      { name: 'Русе', postcode: '7000', displayName: 'Русе [7000]' },
      { name: 'Стара Загора', postcode: '6000', displayName: 'Стара Загора [6000]' },
      { name: 'Плевен', postcode: '5800', displayName: 'Плевен [5800]' },
      { name: 'Сливен', postcode: '8800', displayName: 'Сливен [8800]' },
      { name: 'Добрич', postcode: '9300', displayName: 'Добрич [9300]' },
      { name: 'Шумен', postcode: '9700', displayName: 'Шумен [9700]' },
      { name: 'Перник', postcode: '2300', displayName: 'Перник [2300]' },
      { name: 'Хасково', postcode: '6300', displayName: 'Хасково [6300]' },
      { name: 'Ямбол', postcode: '8600', displayName: 'Ямбол [8600]' },
      { name: 'Пазарджик', postcode: '4400', displayName: 'Пазарджик [4400]' },
      { name: 'Благоевград', postcode: '2700', displayName: 'Благоевград [2700]' },
      { name: 'Велико Търново', postcode: '5000', displayName: 'Велико Търново [5000]' },
      { name: 'Враца', postcode: '3000', displayName: 'Враца [3000]' },
      { name: 'Габрово', postcode: '5300', displayName: 'Габрово [5300]' },
      { name: 'Асеновград', postcode: '4230', displayName: 'Асеновград [4230]' },
      { name: 'Видин', postcode: '3700', displayName: 'Видин [3700]' },
      { name: 'Кърджали', postcode: '6600', displayName: 'Кърджали [6600]' },
      { name: 'Кюстендил', postcode: '2500', displayName: 'Кюстендил [2500]' },
      { name: 'Ловеч', postcode: '5500', displayName: 'Ловеч [5500]' },
      { name: 'Монтана', postcode: '3400', displayName: 'Монтана [3400]' },
      { name: 'Търговище', postcode: '7700', displayName: 'Търговище [7700]' },
      { name: 'Разград', postcode: '7200', displayName: 'Разград [7200]' },
      { name: 'Силистра', postcode: '7500', displayName: 'Силистра [7500]' },
      { name: 'Смолян', postcode: '4700', displayName: 'Смолян [4700]' }
    ];

    setCities(bulgarianCities);
  };

  const handleInputChange = (field: string, value: string) => {
    updateFormData({ [field]: value });
  };

  const handleDeliveryTypeChange = (deliveryType: DeliveryType) => {
    updateFormData({ deliveryType });
  };

  const getDeliveryCost = (deliveryType: DeliveryType) => {
    // Simple delivery cost calculation based on type
    switch (deliveryType) {
      case 'office':
        return 4.50;
      case 'address':
        return 6.90;
      case 'econtomat':
        return 3.20;
      default:
        return 4.50;
    }
  };

  const deliveryCost = getDeliveryCost(formData.deliveryType);
  const finalTotal = totalPrice + deliveryCost;

  const handleSubmitOrder = async () => {
    if (!isFormValid()) {
      setError('Please fill in all required fields');
      return;
    }

    // Temporarily commented out stock validation
    setError(null);

    try {
      setSubmitting(true);

      // Prepare order data
      const orderData = {
        customer: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          telephone: formData.telephone,
          country: formData.country,
          city: formData.city,
        },
        delivery: {
          type: formData.deliveryType,
          notes: formData.notes,
        },
        items: items.map(item => ({
          id: item.id,
          quantity: item.quantity,
          size: item.size,
          price: item.price
        })),
        totals: {
          subtotal: totalPrice,
          delivery: deliveryCost,
          total: finalTotal,
        },
      };

      console.log('Submitting order data:', orderData);

      // Submit order
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      console.log('Order response status:', orderResponse.status);
      console.log('Order response headers:', Object.fromEntries(orderResponse.headers.entries()));

      let orderResult;
      const responseText = await orderResponse.text();
      console.log('Raw response text:', responseText);

      try {
        orderResult = JSON.parse(responseText);
        console.log('Parsed response JSON:', orderResult);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        console.error('Response was not JSON. Raw response:', responseText);
        throw new Error(`Server returned non-JSON response: ${responseText.substring(0, 200)}...`);
      }

      if (!orderResponse.ok) {
        console.error('HTTP error response:', {
          status: orderResponse.status,
          statusText: orderResponse.statusText,
          result: orderResult
        });
        const errorMessage = orderResult?.error || `HTTP ${orderResponse.status}: ${orderResponse.statusText}`;
        const errorDetails = orderResult?.details ? ` (${orderResult.details})` : '';
        throw new Error(`${errorMessage}${errorDetails}`);
      }

      if (!orderResult.success) {
        console.error('API returned success=false:', orderResult);
        throw new Error(orderResult.error || 'Failed to place order');
      }

      console.log('Order placed successfully:', orderResult.orderId);

      // Clear cart and form
      clearCart();
      resetForm();

      // Redirect to success page with order ID
      router.push(`/checkout/success?orderId=${orderResult.orderId}`);

    } catch (err) {
      console.error('Order submission error:', err);
      console.error('Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        name: err instanceof Error ? err.name : undefined
      });
      setError(err instanceof Error ? err.message : 'Failed to place order. Please try again.');
    } finally {
      setValidatingStock(false);
      setSubmitting(false);
    }
  };

  const handleSetIsAdmin = (value: boolean) => {
    setIsAdmin(value);
    localStorage.setItem('isAdmin', value.toString());
  };

  if (totalItems === 0) {
    return null; // Will redirect in useEffect
  }

  const deliveryTypeIcons = {
    office: Truck,
    address: MapPin,
    econtomat: Package,
  };

  const deliveryTypeLabels = {
    office: t.deliveryOffice,
    address: t.deliveryAddress,
    econtomat: t.deliveryEcontomat,
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header isAdmin={isAdmin} setIsAdmin={handleSetIsAdmin} />

      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.checkout}</h1>
            <div className="flex items-center gap-2 text-gray-600">
              <ShoppingBag size={20} />
              <span>{totalItems} {totalItems === 1 ? 'item' : 'items'} in cart</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Form (Desktop) / Top (Mobile) */}
            <div className="order-1 lg:order-1">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Customer Information
                </h2>

                <div className="space-y-6">
                  {/* Order Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.orderNotes}
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder={t.orderNotesPlaceholder}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Name Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t.firstName} *
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t.lastName} *
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  {/* Contact Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t.telephone} *
                      </label>
                      <input
                        type="tel"
                        value={formData.telephone}
                        onChange={(e) => handleInputChange('telephone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t.email} *
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  {/* Country and City */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t.country} *
                      </label>
                      <select
                        value={formData.country}
                        onChange={(e) => handleInputChange('country', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Bulgaria">Bulgaria</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t.city} *
                      </label>
                      <select
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select a city</option>
                        {cities.map((city) => (
                          <option key={city.displayName} value={city.displayName}>
                            {city.displayName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Delivery Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      {t.deliveryType} *
                    </label>
                    <div className="space-y-3">
                      {(['office', 'address', 'econtomat'] as DeliveryType[]).map((type) => {
                        const Icon = deliveryTypeIcons[type];
                        return (
                          <label
                            key={type}
                            className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                              formData.deliveryType === type
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <input
                              type="radio"
                              name="deliveryType"
                              value={type}
                              checked={formData.deliveryType === type}
                              onChange={() => handleDeliveryTypeChange(type)}
                              className="mr-3"
                            />
                            <Icon size={20} className="mr-3 text-gray-600" />
                            <div>
                              <div className="font-medium text-gray-900">
                                {deliveryTypeLabels[type]}
                              </div>
                              <div className="text-sm text-gray-600">
                                €{getDeliveryCost(type).toFixed(2)}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Order Summary (Desktop) / Bottom (Mobile) */}
            <div className="order-2 lg:order-2">
              <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  {t.orderSummary}
                </h2>

                {/* Cart Items */}
                <div className="space-y-4 mb-6">
                  {items.map((item, index) => (
                    <div key={`${item.id}-${index}`} className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-b-0">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                          {item.brand} {item.model}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {item.color}
                          {item.size && ` • ${item.size}`}
                          {item.type && ` • ${item.type}`}
                        </p>
                        {item.propertyValues && Object.keys(item.propertyValues).length > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            {Object.entries(item.propertyValues).map(([key, value]) => `${key}: ${value}`).join(', ')}
                          </p>
                        )}
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-sm text-gray-600">
                            Qty: {item.quantity}
                          </span>
                          <span className="font-medium text-gray-900">
                            €{(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Totals */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t.total}:</span>
                    <span className="font-medium">€{totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t.delivery} ({deliveryTypeLabels[formData.deliveryType]}):</span>
                    <span className="font-medium">€{deliveryCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>{t.orderTotal}:</span>
                    <span>€{finalTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {/* Place Order Button */}
                <button
                  onClick={handleSubmitOrder}
                  disabled={isSubmitting || isValidatingStock || !isFormValid()}
                  className="w-full mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center"
                >
                  {isValidatingStock ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Checking Stock...
                    </>
                  ) : isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t.placingOrder}
                    </>
                  ) : (
                    t.placeOrder
                  )}
                </button>

                {!isFormValid() && (
                  <p className="text-sm text-red-600 mt-2 text-center">
                    Please fill in all required fields
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
      <CartDrawer />
    </div>
  );
}

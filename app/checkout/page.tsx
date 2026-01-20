'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useCart } from '@/context/CartContext';
import { useStoreSettings } from '@/context/StoreSettingsContext';
import { useCheckoutStore, type DeliveryType, type CityOption } from '@/store/checkoutStore';
import { translations } from '@/lib/translations';
import { ShoppingBag, Truck, MapPin, Package } from 'lucide-react';
import type { EcontOfficesData, EcontOffice } from '@/types/econt';

export default function CheckoutPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { theme } = useTheme();
  const { items, totalItems, totalPrice, clearCart } = useCart();
  const { settings } = useStoreSettings();
  const t = translations[language];

  useEffect(() => {
    const pageTitle = t.checkout || (language === 'bg' ? 'Поръчка' : 'Checkout');
    const storeName = settings?.storename || '';
    document.title = storeName ? `${pageTitle} - ${storeName}` : pageTitle;
  }, [language, t, settings?.storename]);
  const {
    formData,
    cities,
    isSubmitting,
    isValidatingStock,
    error,
    insufficientStock,
    appliedDiscount,
    discountValidating,
    discountError,
    updateFormData,
    setCities,
    setSubmitting,
    setValidatingStock,
    setError,
    setInsufficientStock,
    resetForm,
    isFormValid,
    fullName,
    validateDiscount,
    removeDiscount,
    discountedTotal
  } = useCheckoutStore();

  const [isAdmin, setIsAdmin] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    telephone?: string;
    email?: string;
    street?: string;
    streetNumber?: string;
    econtOfficeId?: string;
  }>({});
  const [econtOffices, setEcontOffices] = useState<EcontOfficesData | null>(null);
  const [selectedOffice, setSelectedOffice] = useState<EcontOffice | null>(null);
  const [showCityDropdown, setShowCityDropdown] = useState<boolean>(false);
  const cityDropdownRef = useRef<HTMLDivElement>(null);
  const [showMissingOfficePrompt, setShowMissingOfficePrompt] = useState(false);

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
    
    // Load Econt offices data
    loadEcontOffices();
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

  const loadEcontOffices = async () => {
    try {
      const response = await fetch('/data/econt-offices.json');
      const data: EcontOfficesData = await response.json();
      setEcontOffices(data);
    } catch (error) {
      console.error('Failed to load Econt offices:', error);
    }
  };

  // Validation functions
  const validateBulgarianPhone = (phone: string): boolean => {
    if (!phone || phone.trim() === '') return false;
    
    // Remove spaces and dashes
    const cleaned = phone.replace(/[\s-]/g, '');
    
    // Bulgarian phone formats:
    // 1. 10 digits starting with 0 (e.g., 0888123456)
    // 2. +359 followed by 9 digits (e.g., +359888123456)
    // 3. 00359 followed by 9 digits (e.g., 00359888123456)
    
    const patterns = [
      /^0\d{9}$/,                    // 0888123456
      /^\+359\d{9}$/,                // +359888123456
      /^00359\d{9}$/                 // 00359888123456
    ];
    
    return patterns.some(pattern => pattern.test(cleaned));
  };

  const validateEmail = (email: string): boolean => {
    if (!email || email.trim() === '') return false;
    
    // Standard email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const handleInputChange = (field: string, value: string) => {
    updateFormData({ [field]: value });
    
    // Clear validation error when user starts typing
    if (validationErrors[field as keyof typeof validationErrors]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as keyof typeof validationErrors];
        return newErrors;
      });
    }
  };

  const handleBlur = (field: string, value: string) => {
    let error: string | undefined;
    
    if (field === 'telephone') {
      if (!value || value.trim() === '') {
        error = t.phoneRequired;
      } else if (!validateBulgarianPhone(value)) {
        error = t.invalidPhone;
      }
    } else if (field === 'email') {
      if (!value || value.trim() === '') {
        error = t.emailRequired;
      } else if (!validateEmail(value)) {
        error = t.invalidEmail;
      }
    }
    
    if (error) {
      setValidationErrors(prev => ({ ...prev, [field]: error }));
    } else {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as keyof typeof validationErrors];
        return newErrors;
      });
    }
  };

  const handleApplyDiscount = () => {
    if (formData.discountCode?.trim()) {
      validateDiscount(totalPrice);
    } else {
      removeDiscount();
    }
  };

  const handleDeliveryTypeChange = (deliveryType: DeliveryType) => {
    updateFormData({ deliveryType, econtOfficeId: '', missingEcontOffice: '' });
    setSelectedOffice(null);
    setShowMissingOfficePrompt(false);
    
    // Clear validation errors when delivery type changes
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.econtOfficeId;
      delete newErrors.street;
      delete newErrors.streetNumber;
      return newErrors;
    });
  };

  const handleOfficeSelect = (officeId: string) => {
    updateFormData({ econtOfficeId: officeId });
    
    // Clear validation error when office is selected
    if (validationErrors.econtOfficeId) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.econtOfficeId;
        return newErrors;
      });
    }
    
    // Find and set the selected office for displaying working hours
    if (econtOffices && formData.city) {
      const cityOffices = econtOffices.officesByCity[formData.city] || [];
      const office = cityOffices.find(o => o.id === officeId);
      setSelectedOffice(office || null);
    }
  };

  const handleOfficeSelectValue = (value: string) => {
    if (value === '__missing__') {
      updateFormData({ econtOfficeId: '', missingEcontOffice: formData.missingEcontOffice || '' });
      setSelectedOffice(null);
      setShowMissingOfficePrompt(true);
      return;
    }

    setShowMissingOfficePrompt(false);
    handleOfficeSelect(value);
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
  const finalTotal = discountedTotal(totalPrice, deliveryCost);

  const handleSubmitOrder = async () => {
    // Validate phone and email before submission
    const phoneError = !formData.telephone || formData.telephone.trim() === '' 
      ? t.phoneRequired 
      : !validateBulgarianPhone(formData.telephone) 
        ? t.invalidPhone 
        : undefined;
    
    const emailError = !formData.email || formData.email.trim() === '' 
      ? t.emailRequired 
      : !validateEmail(formData.email) 
        ? t.invalidEmail 
        : undefined;

    if (phoneError || emailError) {
      setValidationErrors({
        telephone: phoneError,
        email: emailError
      });
      setError('Please correct the errors in the form');
      return;
    }

    if (!isFormValid()) {
      setError('Please fill in all required fields');
      return;
    }

    // Validate Econt office selection for office delivery
    if (
      formData.deliveryType === 'office' &&
      !formData.econtOfficeId &&
      !(formData.missingEcontOffice && formData.missingEcontOffice.trim())
    ) {
      setValidationErrors(prev => ({ ...prev, econtOfficeId: t.selectEcontOffice }));
      setError(t.selectEcontOffice);
      return;
    }

    // Validate address fields for address delivery
    if (formData.deliveryType === 'address') {
      const addressErrors: any = {};
      
      if (!formData.street || !formData.street.trim()) {
        addressErrors.street = t.required;
      }
      if (!formData.streetNumber || !formData.streetNumber.trim()) {
        addressErrors.streetNumber = t.required;
      }
      
      if (Object.keys(addressErrors).length > 0) {
        setValidationErrors(prev => ({ ...prev, ...addressErrors }));
        setError(t.pleaseFillAllRequiredFields || 'Please fill all required fields');
        return;
      }
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
          missingEcontOffice: formData.missingEcontOffice,
          econtOfficeId: formData.econtOfficeId,
          street: formData.street,
          streetNumber: formData.streetNumber,
          entrance: formData.entrance,
          floor: formData.floor,
          apartment: formData.apartment,
        },
        items: items.map(item => ({
          id: item.id,
          quantity: item.quantity,
          size: item.size,
          price: item.price
        })),
        totals: {
          subtotal: totalPrice,
          discount: appliedDiscount ? appliedDiscount.discountAmount : 0,
          delivery: deliveryCost,
          total: finalTotal,
        },
        discount: appliedDiscount ? {
          code: appliedDiscount.code,
          type: appliedDiscount.type,
          value: appliedDiscount.value,
          amount: appliedDiscount.discountAmount,
        } : null,
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

      // Redirect to success page with order ID using window.location for immediate redirect
      // This ensures the redirect happens before any state updates that might prevent navigation
      window.location.href = `/checkout/success?orderId=${orderResult.orderId}`;
      
      // Clear cart and form after redirect (these won't execute if redirect works, but that's fine)
      clearCart();
      resetForm();

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
              <span>{totalItems} {t.itemsInCart}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Form (Desktop) / Top (Mobile) */}
            <div className="order-1 lg:order-1">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  {t.customerInformation}
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

                  {/* Discount Code */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.discountCode}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.discountCode || ''}
                        onChange={(e) => handleInputChange('discountCode', e.target.value.toUpperCase())}
                        placeholder={t.enterDiscountCode}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={handleApplyDiscount}
                        disabled={discountValidating || !formData.discountCode?.trim()}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                        {discountValidating ? t.applyingDiscount : t.applyDiscount}
                      </button>
                    </div>

                    {/* Discount Messages */}
                    {appliedDiscount && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-sm text-green-700">
                          ✓ {appliedDiscount.description || `${appliedDiscount.code} ${t.discountApplied}`}
                          {appliedDiscount.type === 'percentage'
                            ? ` (${appliedDiscount.value}% ${t.amountOff})`
                            : ` (€${appliedDiscount.discountAmount.toFixed(2)} ${t.amountOff})`
                          }
                        </p>
                        <button
                          onClick={removeDiscount}
                          className="text-xs text-green-600 hover:text-green-800 underline mt-1"
                        >
                          {t.removeDiscount}
                        </button>
                      </div>
                    )}

                    {discountError && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-700">✗ {
                          discountError === 'Invalid or expired discount code' ? t.invalidDiscountCode :
                          discountError === 'Discount code has expired' ? t.expiredDiscountCode :
                          discountError === 'Discount code is required' ? t.discountCodeRequiredMsg :
                          discountError === 'Invalid discount code format' ? t.discountCodeFormatError :
                          discountError
                        }</p>
                      </div>
                    )}
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
                        value={formData.telephone || ''}
                        onChange={(e) => handleInputChange('telephone', e.target.value)}
                        onBlur={(e) => handleBlur('telephone', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          validationErrors.telephone ? 'border-red-500' : 'border-gray-300'
                        }`}
                        required
                      />
                      {validationErrors.telephone && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.telephone}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t.email} *
                      </label>
                      <input
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        onBlur={(e) => handleBlur('email', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          validationErrors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                        required
                      />
                      {validationErrors.email && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>
                      )}
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
                        <option value="Bulgaria">{t.bulgaria}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t.city} *
                      </label>
                      <div className="relative" ref={cityDropdownRef}>
                        <input
                          type="text"
                          value={formData.city}
                          onChange={(e) => {
                            const value = e.target.value;
                            handleInputChange('city', value);
                            setShowCityDropdown(true);
                            // Reset office selection when city changes
                            if (formData.deliveryType === 'office') {
                              updateFormData({ econtOfficeId: '', missingEcontOffice: '' });
                              setSelectedOffice(null);
                              setShowMissingOfficePrompt(false);
                            }
                          }}
                          onFocus={() => setShowCityDropdown(true)}
                          placeholder={t.selectCity}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                        {showCityDropdown && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {/* Show Econt cities if office delivery is selected and data is loaded */}
                            {formData.deliveryType === 'office' && econtOffices ? (
                              econtOffices.cities
                                .filter((city) => 
                                  city.toLowerCase().includes((formData.city || '').toLowerCase())
                                )
                                .map((city) => (
                                  <button
                                    key={city}
                                    type="button"
                                    onClick={() => {
                                      handleInputChange('city', city);
                                      setShowCityDropdown(false);
                                      if (formData.deliveryType === 'office') {
                                        updateFormData({ econtOfficeId: '', missingEcontOffice: '' });
                                        setSelectedOffice(null);
                                        setShowMissingOfficePrompt(false);
                                      }
                                    }}
                                    className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                                  >
                                    {city}
                                  </button>
                                ))
                            ) : (
                              cities
                                .filter((city) => 
                                  city.name.toLowerCase().includes((formData.city || '').toLowerCase()) ||
                                  city.displayName.toLowerCase().includes((formData.city || '').toLowerCase()) ||
                                  city.postcode.includes(formData.city || '')
                                )
                                .map((city) => (
                                  <button
                                    key={city.displayName}
                                    type="button"
                                    onClick={() => {
                                      handleInputChange('city', city.displayName);
                                      setShowCityDropdown(false);
                                      if (formData.deliveryType === 'office') {
                                        updateFormData({ econtOfficeId: '', missingEcontOffice: '' });
                                        setSelectedOffice(null);
                                        setShowMissingOfficePrompt(false);
                                      }
                                    }}
                                    className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                                  >
                                    {city.displayName}
                                  </button>
                                ))
                            )}
                          </div>
                        )}
                      </div>
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
                        const isDisabled = type === 'econtomat';
                        return (
                          <label
                            key={type}
                            className={`flex items-center p-4 border rounded-lg transition-all ${
                              isDisabled
                                ? 'cursor-not-allowed opacity-50 bg-gray-100'
                                : 'cursor-pointer'
                            } ${
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
                              disabled={isDisabled}
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

                  {/* Econt Office Selection - Only show if office delivery is selected */}
                  {formData.deliveryType === 'office' && formData.city && econtOffices && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t.econtOffice} *
                      </label>
                      <select
                        value={formData.econtOfficeId || ''}
                        onChange={(e) => handleOfficeSelectValue(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          validationErrors.econtOfficeId ? 'border-red-500' : 'border-gray-300'
                        }`}
                        required={!(formData.missingEcontOffice && formData.missingEcontOffice.trim())}
                      >
                        <option value="">{t.selectEcontOffice}</option>
                        <option value="__missing__">
                          {language === 'bg' ? 'Офисът не е наличен' : 'Office not available'}
                        </option>
                        {(econtOffices.officesByCity[formData.city] || []).map((office) => (
                          <option key={office.id} value={office.id}>
                            {office.name}
                          </option>
                        ))}
                      </select>
                      {validationErrors.econtOfficeId && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.econtOfficeId}</p>
                      )}
                      
                      {/* Show office details when selected */}
                      {selectedOffice && (
                        <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-md">
                          <div className="space-y-2">
                            <div>
                              <span className="text-sm font-medium text-gray-700">{t.officeAddress}:</span>
                              <p className="text-sm text-gray-900">{selectedOffice.address}</p>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-700">{t.workingHours}:</span>
                              <p className="text-sm text-gray-900">{selectedOffice.workingHours}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {(showMissingOfficePrompt ||
                        (formData.city && (!econtOffices.officesByCity[formData.city] || econtOffices.officesByCity[formData.city].length === 0))) && (
                        <div className="mt-2 space-y-3">
                          {formData.city && (!econtOffices.officesByCity[formData.city] || econtOffices.officesByCity[formData.city].length === 0) && (
                            <p className="text-sm text-amber-600">
                              {t.noOfficesInCity}
                            </p>
                          )}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {language === 'bg'
                                ? 'Липсващ офис? моля напишете име и адрес?'
                                : 'Missing office? Please enter name and address.'}
                            </label>
                            <textarea
                              value={formData.missingEcontOffice || ''}
                              onChange={(e) => handleInputChange('missingEcontOffice', e.target.value)}
                              placeholder={language === 'bg'
                                ? 'Напр. Еконт офис Център, ул. Примерна 10'
                                : 'e.g. Econt office Center, Example St 10'}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              rows={3}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Address Fields - Only show if address delivery is selected */}
                  {formData.deliveryType === 'address' && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">{t.addressDetails}</h3>
                      
                      <div className="space-y-4">
                        {/* Street and Number */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {t.street} *
                            </label>
                            <input
                              type="text"
                              value={formData.street || ''}
                          onChange={(e) => handleInputChange('street', e.target.value)}
                              placeholder="ул. Васил Левски"
                              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                validationErrors.street ? 'border-red-500' : 'border-gray-300'
                              }`}
                              required
                            />
                            {validationErrors.street && (
                              <p className="text-red-500 text-xs mt-1">{validationErrors.street}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {t.streetNumber} *
                            </label>
                            <input
                              type="text"
                              value={formData.streetNumber || ''}
                              onChange={(e) => handleInputChange('streetNumber', e.target.value)}
                              placeholder="123"
                              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                validationErrors.streetNumber ? 'border-red-500' : 'border-gray-300'
                              }`}
                              required
                            />
                            {validationErrors.streetNumber && (
                              <p className="text-red-500 text-xs mt-1">{validationErrors.streetNumber}</p>
                            )}
                          </div>
                        </div>

                        {/* Entrance, Floor, Apartment */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {t.entrance}
                            </label>
                            <input
                              type="text"
                              value={formData.entrance || ''}
                              onChange={(e) => handleInputChange('entrance', e.target.value)}
                              placeholder="A"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {t.floor}
                            </label>
                            <input
                              type="text"
                              value={formData.floor || ''}
                              onChange={(e) => handleInputChange('floor', e.target.value)}
                              placeholder="5"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {t.apartment}
                            </label>
                            <input
                              type="text"
                              value={formData.apartment || ''}
                              onChange={(e) => handleInputChange('apartment', e.target.value)}
                              placeholder="12"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
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
                  {appliedDiscount && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>{t.discountOrderSummary} ({appliedDiscount.code}):</span>
                      <span>-€{appliedDiscount.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
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
                    {t.pleaseFillAllRequiredFields}
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

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';
import { CheckCircle, Truck, Package, MapPin } from 'lucide-react';

function CheckoutSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  const t = translations[language || 'en'];

  const [orderId, setOrderId] = useState<string>('');
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const orderIdParam = searchParams.get('orderId');
    if (!orderIdParam) {
      router.push('/');
      return;
    }

    setOrderId(orderIdParam);

    // Start animation after a brief delay
    setTimeout(() => {
      setIsAnimating(true);
    }, 500);
  }, [searchParams, router]);

  if (!orderId) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header isAdmin={false} setIsAdmin={() => {}} />

      <div className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="max-w-2xl w-full">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Order Placed Successfully!
            </h1>
            <p className="text-lg text-gray-600">
              Thank you for your order. We'll send you a confirmation email shortly.
            </p>
          </div>

          {/* Order ID */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8 text-center">
            <p className="text-sm text-gray-600 mb-2">Order Number</p>
            <p className="text-2xl font-bold text-gray-900 font-mono">#{orderId}</p>
          </div>

          {/* Truck Animation */}
          <div className="relative mb-8">
            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-8 overflow-hidden">
              {/* Road */}
              <div className="relative h-32 bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 rounded">
                {/* Road lines */}
                <div className="absolute inset-y-0 left-1/4 w-1 bg-yellow-400"></div>
                <div className="absolute inset-y-0 right-1/4 w-1 bg-yellow-400"></div>

                {/* Truck Animation */}
                <div className={`transition-all duration-3000 ease-in-out ${isAnimating ? 'translate-x-full' : '-translate-x-32'}`}>
                  <div className="relative">
                    {/* Truck body */}
                    <div className="bg-blue-600 rounded-lg p-2 shadow-lg">
                      <div className="flex items-center space-x-2">
                        {/* Cabin */}
                        <div className="bg-blue-700 rounded p-1">
                          <div className="w-6 h-4 bg-blue-800 rounded-t"></div>
                        </div>
                        {/* Trailer */}
                        <div className="bg-blue-500 rounded px-4 py-2">
                          <div className="flex space-x-1">
                            {/* Boxes in trailer */}
                            <div className="w-3 h-3 bg-yellow-400 rounded"></div>
                            <div className="w-3 h-3 bg-red-400 rounded"></div>
                            <div className="w-3 h-3 bg-green-400 rounded"></div>
                            <div className="w-3 h-3 bg-blue-400 rounded"></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Wheels */}
                    <div className="flex justify-between mt-1">
                      <div className="w-3 h-3 bg-gray-800 rounded-full"></div>
                      <div className="w-3 h-3 bg-gray-800 rounded-full"></div>
                      <div className="w-3 h-3 bg-gray-800 rounded-full ml-8"></div>
                      <div className="w-3 h-3 bg-gray-800 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress text */}
              <div className="text-center mt-4">
                <p className={`text-sm font-medium transition-colors duration-1000 ${isAnimating ? 'text-green-600' : 'text-blue-600'}`}>
                  {isAnimating ? 'Order shipped! 🚚' : 'Preparing your order...'}
                </p>
              </div>
            </div>
          </div>

          {/* Order Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
              <Package className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900 mb-1">Order Received</h3>
              <p className="text-sm text-gray-600">Processing your order</p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200 text-center opacity-75">
              <Truck className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900 mb-1">In Transit</h3>
              <p className="text-sm text-gray-600">Preparing for shipment</p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200 text-center opacity-75">
              <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900 mb-1">Delivered</h3>
              <p className="text-sm text-gray-600">Estimated 2-3 days</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => router.push('/')}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Continue Shopping
            </button>
            <button
              onClick={() => router.push('/')}
              className="flex-1 border border-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              View Order Details
            </button>
          </div>

          {/* Additional Info */}
          <div className="mt-8 text-center text-sm text-gray-600">
            <p>You will receive an email confirmation with your order details.</p>
            <p className="mt-2">
              Need help? Contact us at{' '}
              <a href="mailto:support@yourstore.com" className="text-blue-600 hover:underline">
                support@yourstore.com
              </a>
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}

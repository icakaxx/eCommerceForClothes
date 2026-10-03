'use client';

import { Headphones, Lock, RotateCcw, Truck } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';

export default function TrustBar() {
  const { language } = useLanguage();
  const { theme } = useTheme();

  const trustItems = [
    {
      icon: Truck,
      title: language === 'bg' ? 'Бърза доставка' : 'Fast delivery',
      subtitle: language === 'bg' ? '1-2 работни дни' : '1-2 business days',
    },
    {
      icon: RotateCcw,
      title: language === 'bg' ? 'Лесно връщане' : 'Easy returns',
      subtitle: language === 'bg' ? '14 дни право на връщане' : '14-day return policy',
    },
    {
      icon: Lock,
      title: language === 'bg' ? 'Сигурно плащане' : 'Secure payment',
      subtitle: language === 'bg' ? '100% защитени плащания' : '100% protected payments',
    },
    {
      icon: Headphones,
      title: language === 'bg' ? 'Клиентска грижа' : 'Customer care',
      subtitle: language === 'bg' ? 'На разположение' : 'Always available',
    },
  ];

  return (
    <section
      className="border-y"
      style={{
        backgroundColor: theme.colors.secondary,
        borderColor: theme.colors.border,
      }}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-5">
        <div className="grid grid-cols-4 gap-2 sm:gap-6">
          {trustItems.map(item => (
            <div key={item.title} className="flex flex-col items-center text-center gap-1.5 sm:gap-2">
              <item.icon
                size={18}
                className="sm:hidden"
                style={{ color: theme.colors.text }}
                strokeWidth={1.5}
              />
              <item.icon
                size={22}
                className="hidden sm:block"
                style={{ color: theme.colors.text }}
                strokeWidth={1.5}
              />
              <div>
                <p
                  className="text-[10px] sm:text-sm font-medium leading-tight"
                  style={{ color: theme.colors.text }}
                >
                  {item.title}
                </p>
                <p
                  className="hidden sm:block text-xs mt-0.5"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {item.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useStoreSettings } from '@/context/StoreSettingsContext';

export default function Banner() {
  const { theme } = useTheme();
  const { settings } = useStoreSettings();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Split banner text by newlines and filter out empty lines
  const bannerLines = settings?.bannertext
    ? settings.bannertext
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
    : [];

  const duration = settings?.bannerduration || 5; // Default to 5 seconds

  // Rotate through banner lines
  useEffect(() => {
    if (bannerLines.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % bannerLines.length);
    }, duration * 1000);

    return () => clearInterval(interval);
  }, [bannerLines.length, duration]);

  // Don't render if no banner text is set
  if (!settings?.bannertext || settings.bannertext.trim() === '' || bannerLines.length === 0) {
    return null;
  }

  // If only one line, just show it without rotation
  const displayText = bannerLines[currentIndex];

  return (
    <div
      className="w-full py-2 px-4 text-center transition-all duration-500 ease-in-out"
      style={{
        backgroundColor: theme.colors.primary,
        color: '#ffffff'
      }}
    >
      <p className="text-sm sm:text-base font-medium">
        {displayText}
      </p>
    </div>
  );
}


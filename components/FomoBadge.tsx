'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

export type FomoTone = 'neutral' | 'success' | 'warning';

export interface FomoMessage {
  text: string;
  tone?: FomoTone;
}

interface FomoBadgeProps {
  messages: FomoMessage[];
  rotationInterval?: number; // in milliseconds
  enabled?: boolean;
  className?: string;
}

export default function FomoBadge({ 
  messages, 
  rotationInterval = 8000,
  enabled = true,
  className = ''
}: FomoBadgeProps) {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const rotationStartedRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Check if admin mode is enabled
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    const adminState = localStorage.getItem('isAdmin');
    setIsAdmin(adminState === 'true');
  }, []);

  // Randomize initial message
  const shuffledMessages = useMemo(() => {
    const shuffled = [...messages];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [messages]);

  // Rotate messages - with initial delay to show first message for a while
  useEffect(() => {
    // Clean up any existing intervals
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    rotationStartedRef.current = false;

    if (!enabled || shuffledMessages.length <= 1 || prefersReducedMotion) return;

    // Initial delay - show first message for longer before starting rotation (at least 10 seconds)
    const initialDelay = Math.max(rotationInterval * 1.5, 10000);

    const initialTimeout = setTimeout(() => {
      rotationStartedRef.current = true;
      
      // Start rotation after initial delay
      intervalRef.current = setInterval(() => {
        setIsVisible(false);
        
        setTimeout(() => {
          setCurrentIndex((prev) => (prev + 1) % shuffledMessages.length);
          setIsVisible(true);
        }, 300); // Half of transition duration
      }, rotationInterval);
    }, initialDelay);

    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, shuffledMessages.length, rotationInterval, prefersReducedMotion]);

  if (!enabled || shuffledMessages.length === 0 || isAdmin) return null;

  const currentMessage = shuffledMessages[currentIndex];
  const tone = currentMessage.tone || 'neutral';

  // Get colors based on tone
  const getToneColors = () => {
    switch (tone) {
      case 'success':
        return {
          bg: 'rgba(34, 197, 94, 0.1)',
          text: '#22c55e',
          border: 'rgba(34, 197, 94, 0.2)'
        };
      case 'warning':
        return {
          bg: 'rgba(245, 158, 11, 0.1)',
          text: '#f59e0b',
          border: 'rgba(245, 158, 11, 0.2)'
        };
      default:
        return {
          bg: theme.colors.surface || 'rgba(0, 0, 0, 0.05)',
          text: theme.colors.textSecondary || '#6b7280',
          border: theme.colors.border || 'rgba(0, 0, 0, 0.1)'
        };
    }
  };

  const colors = getToneColors();

  return (
    <div 
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs transition-all duration-300 ${className}`}
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(-4px)',
      }}
    >
      {/* Optional pulse dot */}
      {!prefersReducedMotion && (
        <span 
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ backgroundColor: colors.text }}
        />
      )}
      <span>{currentMessage.text}</span>
    </div>
  );
}

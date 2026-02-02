'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useTheme } from '@/context/ThemeContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Testimonial {
  testimonialid: string;
  imageurl: string;
  sortorder: number;
  isactive: boolean;
}

interface TestimonialsCarouselProps {
  testimonials: Testimonial[];
}

export default function TestimonialsCarousel({ testimonials }: TestimonialsCarouselProps) {
  const { theme } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slidesToShow, setSlidesToShow] = useState(3);
  const autoplayIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const updateSlidesToShow = () => {
      if (typeof window !== 'undefined') {
        const width = window.innerWidth;
        if (width < 768) {
          setSlidesToShow(1); // Mobile
        } else if (width < 1024) {
          setSlidesToShow(2); // Tablet
        } else {
          setSlidesToShow(3); // Desktop
        }
      }
    };

    updateSlidesToShow();
    window.addEventListener('resize', updateSlidesToShow);
    return () => window.removeEventListener('resize', updateSlidesToShow);
  }, []);

  if (!testimonials || testimonials.length === 0) {
    return null;
  }

  const maxIndex = Math.max(0, testimonials.length - slidesToShow);
  const canGoNext = currentIndex < maxIndex;
  const canGoPrev = currentIndex > 0;

  // Function to reset the autoplay timer
  const resetAutoplay = useCallback(() => {
    if (autoplayIntervalRef.current) {
      clearInterval(autoplayIntervalRef.current);
      autoplayIntervalRef.current = null;
    }

    if (testimonials.length <= slidesToShow) return;

    autoplayIntervalRef.current = setInterval(() => {
      setCurrentIndex(prev => {
        if (prev >= maxIndex) {
          return 0;
        }
        return prev + 1;
      });
    }, 6000);
  }, [testimonials.length, slidesToShow, maxIndex]);

  const next = () => {
    if (canGoNext) {
      setCurrentIndex(prev => Math.min(prev + 1, maxIndex));
    } else {
      setCurrentIndex(0); // Loop to start
    }
    resetAutoplay(); // Reset timer when user manually navigates
  };

  const prev = () => {
    if (canGoPrev) {
      setCurrentIndex(prev => Math.max(prev - 1, 0));
    } else {
      setCurrentIndex(maxIndex); // Loop to end
    }
    resetAutoplay(); // Reset timer when user manually navigates
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(Math.min(index, maxIndex));
    resetAutoplay(); // Reset timer when user clicks on dots
  };

  // Auto-play
  useEffect(() => {
    resetAutoplay();

    return () => {
      if (autoplayIntervalRef.current) {
        clearInterval(autoplayIntervalRef.current);
        autoplayIntervalRef.current = null;
      }
    };
  }, [resetAutoplay]);

  return (
    <div className="w-full py-8 sm:py-12 relative testimonials-carousel">
      <div className="relative overflow-hidden">
        {/* Carousel Container */}
        <div
          className="flex transition-transform ease-in-out"
          style={{
            transform: `translateX(-${currentIndex * (100 / slidesToShow)}%)`,
            transitionDuration: '1000ms', // Increased from 600ms to 1000ms (1 second)
          }}
        >
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.testimonialid}
              className="flex-shrink-0 px-3"
              style={{
                width: `${100 / slidesToShow}%`,
              }}
            >
              <div
                className="relative rounded-lg overflow-hidden transition-all duration-300 hover:shadow-xl"
                style={{
                  backgroundColor: theme.colors.cardBg,
                  border: `1px solid ${theme.colors.border}`,
                  boxShadow: theme.effects.shadow,
                  aspectRatio: '4/5',
                  minHeight: '400px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = theme.effects.shadowHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = theme.effects.shadow;
                }}
              >
                <Image
                  src={testimonial.imageurl}
                  alt="Customer testimonial"
                  fill
                  className="object-contain p-2"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  unoptimized
                />
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        {testimonials.length > slidesToShow && (
          <>
            <button
              onClick={prev}
              aria-label="Previous testimonial"
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center rounded-full transition-all duration-300 hover:scale-110"
              style={{
                width: '48px',
                height: '48px',
                background: theme.colors.cardBg,
                color: theme.colors.text,
                border: `1px solid ${theme.colors.border}`,
                boxShadow: theme.effects.shadow,
                left: '-50px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.primary;
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.cardBg;
                e.currentTarget.style.color = theme.colors.text;
              }}
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={next}
              aria-label="Next testimonial"
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center rounded-full transition-all duration-300 hover:scale-110"
              style={{
                width: '48px',
                height: '48px',
                background: theme.colors.cardBg,
                color: theme.colors.text,
                border: `1px solid ${theme.colors.border}`,
                boxShadow: theme.effects.shadow,
                right: '-50px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.primary;
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.cardBg;
                e.currentTarget.style.color = theme.colors.text;
              }}
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}

        {/* Dots Indicator */}
        {testimonials.length > slidesToShow && (
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToSlide(idx)}
                className="rounded-full transition-all duration-300"
                style={{
                  width: currentIndex === idx ? '12px' : '8px',
                  height: '8px',
                  backgroundColor: currentIndex === idx ? theme.colors.primary : theme.colors.border,
                }}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Responsive Arrow Positioning */}
      <style jsx global>{`
        @media (max-width: 1024px) and (min-width: 769px) {
          .testimonials-carousel button[aria-label="Previous testimonial"],
          .testimonials-carousel button[aria-label="Next testimonial"] {
            left: -40px !important;
            right: -40px !important;
          }
        }
        @media (max-width: 768px) {
          .testimonials-carousel button[aria-label="Previous testimonial"] {
            left: 10px !important;
            width: 40px !important;
            height: 40px !important;
          }
          .testimonials-carousel button[aria-label="Next testimonial"] {
            right: 10px !important;
            width: 40px !important;
            height: 40px !important;
          }
        }
      `}</style>
    </div>
  );
}

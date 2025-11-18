'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface ImageSliderProps {
  images: string[];
}

export default function ImageSlider({ images }: ImageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { theme } = useTheme();

  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((currentIndex + 1) % images.length);
  };

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((currentIndex - 1 + images.length) % images.length);
  };

  if (!images || images.length === 0) return null;

  return (
    <div 
      className="relative w-full aspect-square rounded-t-xl overflow-hidden group transition-colors duration-300"
      style={{ 
        backgroundColor: theme.colors.secondary,
        borderRadius: theme.id === 'gradient' ? '0.75rem 0.75rem 0 0' : `${theme.effects.borderRadius} ${theme.effects.borderRadius} 0 0`
      }}
    >
      <img
        src={images[currentIndex]}
        alt="Product"
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      
      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              backgroundColor: theme.colors.surface + 'CC',
              color: theme.colors.text
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.surface;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.surface + 'CC';
            }}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              backgroundColor: theme.colors.surface + 'CC',
              color: theme.colors.text
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.surface;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.surface + 'CC';
            }}
          >
            <ChevronRight size={20} />
          </button>
          
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                className="rounded-full transition-all duration-300"
                style={{
                  width: idx === currentIndex ? '1.5rem' : '0.5rem',
                  height: '0.5rem',
                  backgroundColor: idx === currentIndex ? theme.colors.surface : theme.colors.surface + '99'
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}


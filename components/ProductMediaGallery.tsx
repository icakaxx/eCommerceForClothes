'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { MAX_PRODUCT_IMAGES } from '@/lib/product-images';

interface ProductMediaGalleryProps {
  images: string[];
  productName: string;
  focusImage?: string | null;
}

function normalizeGalleryImages(images: string[] | undefined): string[] {
  if (!images || !Array.isArray(images) || images.length === 0) return ['/image.png'];
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const image of images) {
    if (!image) continue;
    const key = image.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(image);
    if (unique.length >= MAX_PRODUCT_IMAGES) break;
  }
  return unique.length > 0 ? unique : ['/image.png'];
}

export default function ProductMediaGallery({ images, productName, focusImage }: ProductMediaGalleryProps) {
  const { theme } = useTheme();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [backgroundColors, setBackgroundColors] = useState<Record<number, string>>({});
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const safeImages = useMemo(() => normalizeGalleryImages(images), [images]);
  const hasMultiple = safeImages.length > 1;
  const currentImage = safeImages[activeSlide] || safeImages[0];

  useEffect(() => {
    setActiveSlide((prev) => Math.min(prev, safeImages.length - 1));
  }, [safeImages.length]);

  useEffect(() => {
    if (!focusImage) return;
    const targetIndex = safeImages.findIndex((image) => image === focusImage);
    if (targetIndex >= 0) {
      setActiveSlide(targetIndex);
    }
  }, [focusImage, safeImages]);

  useEffect(() => {
    const extractColors = (imageUrl: string, index: number) => {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          canvas.width = 50;
          canvas.height = 50;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          const samplePoints = [
            [0, 0],
            [canvas.width - 1, 0],
            [0, canvas.height - 1],
            [canvas.width - 1, canvas.height - 1],
            [Math.floor(canvas.width / 2), Math.floor(canvas.height / 2)],
          ];

          let r = 0;
          let g = 0;
          let b = 0;
          samplePoints.forEach(([x, y]) => {
            const idx = (y * canvas.width + x) * 4;
            r += data[idx];
            g += data[idx + 1];
            b += data[idx + 2];
          });

          r = Math.floor(r / samplePoints.length);
          g = Math.floor(g / samplePoints.length);
          b = Math.floor(b / samplePoints.length);

          const color = `rgb(${r}, ${g}, ${b})`;
          const lighterColor = `rgb(${Math.min(255, r + 30)}, ${Math.min(255, g + 30)}, ${Math.min(255, b + 30)})`;
          const gradient = `linear-gradient(135deg, ${color} 0%, ${lighterColor} 100%)`;
          setBackgroundColors((prev) => ({ ...prev, [index]: gradient }));
        } catch {
          // Ignore canvas/CORS failures and keep theme fallback.
        }
      };
      img.onerror = () => {
        setBackgroundColors((prev) => ({
          ...prev,
          [index]: `linear-gradient(135deg, ${theme.colors.cardBg} 0%, ${theme.colors.surface} 100%)`,
        }));
      };
      img.src = imageUrl;
    };

    safeImages.forEach((image, index) => {
      extractColors(image, index);
    });
  }, [safeImages, theme.colors.cardBg, theme.colors.surface]);

  useEffect(() => {
    if (!isModalOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsModalOpen(false);
        document.body.style.overflow = '';
      } else if (event.key === 'ArrowRight' && hasMultiple) {
        setActiveSlide((prev) => (prev + 1) % safeImages.length);
      } else if (event.key === 'ArrowLeft' && hasMultiple) {
        setActiveSlide((prev) => (prev - 1 + safeImages.length) % safeImages.length);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isModalOpen, hasMultiple, safeImages.length]);

  const goTo = (index: number) => {
    if (index < 0 || index >= safeImages.length) return;
    setActiveSlide(index);
  };

  const goNext = (event?: React.MouseEvent) => {
    event?.stopPropagation();
    if (!hasMultiple) return;
    setActiveSlide((prev) => (prev + 1) % safeImages.length);
  };

  const goPrev = (event?: React.MouseEvent) => {
    event?.stopPropagation();
    if (!hasMultiple) return;
    setActiveSlide((prev) => (prev - 1 + safeImages.length) % safeImages.length);
  };

  const openModal = () => {
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setIsModalOpen(false);
    document.body.style.overflow = '';
  };

  const onTouchStart = (event: React.TouchEvent) => {
    setTouchStartX(event.changedTouches[0]?.clientX ?? null);
  };

  const onTouchEnd = (event: React.TouchEvent) => {
    if (touchStartX == null || !hasMultiple) return;
    const endX = event.changedTouches[0]?.clientX ?? touchStartX;
    const delta = endX - touchStartX;
    if (Math.abs(delta) < 40) return;
    if (delta < 0) goNext();
    else goPrev();
    setTouchStartX(null);
  };

  const arrowButtonStyle: React.CSSProperties = {
    background: 'rgba(15, 23, 42, 0.75)',
    color: '#ffffff',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    boxShadow: '0 6px 16px rgba(15, 23, 42, 0.35)',
  };

  return (
    <div className="product-media-container" style={{ paddingBottom: hasMultiple ? '72px' : 0 }}>
      <div
        className="main-image-container rounded-lg overflow-hidden relative"
        style={{
          backgroundColor: theme.colors.cardBg,
          boxShadow: theme.effects.shadow,
        }}
      >
        {hasMultiple && (
          <div
            className="absolute top-3 right-3 z-20 rounded-full px-2.5 py-1 text-xs font-medium"
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              color: '#ffffff',
            }}
          >
            {activeSlide + 1} / {safeImages.length}
          </div>
        )}

        <div
          className="product-image cursor-pointer relative"
          onClick={openModal}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          style={{
            width: '100%',
            minHeight: 320,
            height: 'min(70vw, 520px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: backgroundColors[activeSlide] || theme.colors.cardBg,
              filter: 'blur(40px)',
              transform: 'scale(1.1)',
              opacity: 0.6,
              zIndex: 0,
            }}
          />
          <div
            className="relative z-10"
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Image
              src={currentImage}
              alt={`${productName} - Image ${activeSlide + 1}`}
              width={800}
              height={600}
              style={{
                objectFit: 'contain',
                objectPosition: 'center',
                maxWidth: '100%',
                maxHeight: '100%',
              }}
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
            />
          </div>
        </div>

        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous image"
              className="absolute left-2.5 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full"
              style={arrowButtonStyle}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Next image"
              className="absolute right-2.5 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full"
              style={arrowButtonStyle}
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>

      {hasMultiple && (
        <div className="mt-3 flex justify-center gap-2">
          {safeImages.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => goTo(index)}
              aria-label={`Image ${index + 1}`}
              className="overflow-hidden rounded-lg border-2 transition-opacity"
              style={{
                width: 52,
                height: 52,
                borderColor: index === activeSlide ? theme.colors.primary : 'transparent',
                opacity: index === activeSlide ? 1 : 0.75,
              }}
            >
              <Image
                src={image}
                alt={`Thumbnail ${index + 1}`}
                width={64}
                height={64}
                style={{ objectFit: 'cover', width: '100%', height: '100%' }}
              />
            </button>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="product-image-modal fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="modal-overlay absolute inset-0 bg-black bg-opacity-75"
            onClick={closeModal}
          />
          <div className="modal-content relative z-10 w-full max-w-6xl mx-4">
            <button
              type="button"
              className="modal-close absolute top-4 right-4 z-20 rounded-full bg-white p-2 shadow-lg transition-colors hover:bg-gray-100"
              onClick={closeModal}
              aria-label="Close fullscreen view"
            >
              <X size={24} />
            </button>

            <div
              className="modal-slider-container relative overflow-hidden rounded-lg bg-white"
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              <div
                className="modal-image flex items-center justify-center"
                style={{ height: '80vh' }}
              >
                <Image
                  src={currentImage}
                  alt={`${productName} - Image ${activeSlide + 1}`}
                  width={1200}
                  height={960}
                  style={{
                    objectFit: 'contain',
                    objectPosition: 'center',
                    maxWidth: '100%',
                    maxHeight: '100%',
                  }}
                />
              </div>

              {hasMultiple && (
                <>
                  <button
                    type="button"
                    onClick={goPrev}
                    aria-label="Previous image"
                    className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full"
                    style={arrowButtonStyle}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    aria-label="Next image"
                    className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full"
                    style={arrowButtonStyle}
                  >
                    <ChevronRight size={18} />
                  </button>
                  <div
                    className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full px-2.5 py-1 text-xs font-medium"
                    style={{
                      backgroundColor: 'rgba(15, 23, 42, 0.75)',
                      color: '#ffffff',
                    }}
                  >
                    {activeSlide + 1} / {safeImages.length}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @media (min-width: 768px) {
          .product-image {
            height: 600px !important;
          }
        }
      `}</style>
    </div>
  );
}

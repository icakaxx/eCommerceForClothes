'use client';

import React, { useState, useRef } from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import Image from 'next/image';
import { useTheme } from '@/context/ThemeContext';

interface ProductMediaGalleryProps {
  images: string[];
  productName: string;
  focusImage?: string | null;
}

const PrevArrow = (props: any) => {
  const { className, onClick } = props;
  return (
    <button
      className={`${className} custom-arrow prev-arrow`}
      onClick={onClick}
      aria-label="Previous image"
      style={{
        left: '10px',
        zIndex: 2,
        width: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(15, 23, 42, 0.75)',
        color: '#ffffff',
        borderRadius: '999px',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        boxShadow: '0 6px 16px rgba(15, 23, 42, 0.35)'
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
  );
};

const NextArrow = (props: any) => {
  const { className, onClick } = props;
  return (
    <button
      className={`${className} custom-arrow next-arrow`}
      onClick={onClick}
      aria-label="Next image"
      style={{
        right: '10px',
        zIndex: 2,
        width: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(15, 23, 42, 0.75)',
        color: '#ffffff',
        borderRadius: '999px',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        boxShadow: '0 6px 16px rgba(15, 23, 42, 0.35)'
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 18l6-6-6-6" />
      </svg>
    </button>
  );
};

export default function ProductMediaGallery({ images, productName, focusImage }: ProductMediaGalleryProps) {
  const { theme } = useTheme();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const mainSliderRef = useRef<any>(null);
  const modalSliderRef = useRef<any>(null);
  const [backgroundColors, setBackgroundColors] = useState<Record<number, string>>({});

  // Cap at 4 product photos; show exactly how many were uploaded (1–4)
  const safeImages = (() => {
    if (!images || !Array.isArray(images) || images.length === 0) return ['/image.png'];
    const seen = new Set<string>();
    const unique: string[] = [];
    for (const image of images) {
      if (!image) continue;
      const key = image.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      unique.push(image);
      if (unique.length >= 4) break;
    }
    return unique.length > 0 ? unique : ['/image.png'];
  })();

  const mainSliderSettings = {
    dots: safeImages.length > 1,
    infinite: safeImages.length > 1,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: safeImages.length > 1,
    fade: false,
    swipe: true,
    prevArrow: <PrevArrow />,
    nextArrow: <NextArrow />,
    beforeChange: (_: number, next: number) => {
      setActiveSlide(next);
    },
    afterChange: (current: number) => {
      setActiveSlide(current);
    },
    customPaging: function (i: number) {
      return (
        <div className="thumbnail-wrapper" style={{ padding: '2px' }}>
          <Image
            src={safeImages[i]}
            alt={`Thumbnail ${i + 1}`}
            width={64}
            height={64}
            style={{ objectFit: 'cover', borderRadius: '6px', width: '100%', height: '100%' }}
          />
        </div>
      );
    }
  };

  const modalSliderSettings = {
    dots: false,
    infinite: safeImages.length > 1,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    prevArrow: <PrevArrow />,
    nextArrow: <NextArrow />,
    initialSlide: activeSlide,
    adaptiveHeight: true,
    fade: false,
    swipe: true,
    customPaging: undefined
  };

  // Extract dominant colors from images for blurred background
  const extractColors = (imageUrl: string, index: number) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Sample a smaller version for performance
        canvas.width = 50;
        canvas.height = 50;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Extract dominant colors (simple approach: average colors from corners and center)
        const samplePoints = [
          [0, 0], // top-left
          [canvas.width - 1, 0], // top-right
          [0, canvas.height - 1], // bottom-left
          [canvas.width - 1, canvas.height - 1], // bottom-right
          [Math.floor(canvas.width / 2), Math.floor(canvas.height / 2)] // center
        ];

        let r = 0, g = 0, b = 0;
        samplePoints.forEach(([x, y]) => {
          const idx = (y * canvas.width + x) * 4;
          r += data[idx];
          g += data[idx + 1];
          b += data[idx + 2];
        });

        r = Math.floor(r / samplePoints.length);
        g = Math.floor(g / samplePoints.length);
        b = Math.floor(b / samplePoints.length);

        // Create gradient with the extracted color
        const color = `rgb(${r}, ${g}, ${b})`;
        const lighterColor = `rgb(${Math.min(255, r + 30)}, ${Math.min(255, g + 30)}, ${Math.min(255, b + 30)})`;
        const gradient = `linear-gradient(135deg, ${color} 0%, ${lighterColor} 100%)`;
        
        setBackgroundColors(prev => ({ ...prev, [index]: gradient }));
      } catch (error) {
        console.error('Error extracting colors:', error);
      }
    };
    img.onerror = () => {
      // Fallback to theme color if image fails to load
      setBackgroundColors(prev => ({ 
        ...prev, 
        [index]: `linear-gradient(135deg, ${theme.colors.cardBg} 0%, ${theme.colors.surface} 100%)` 
      }));
    };
    img.src = imageUrl;
  };

  // Extract colors for all images
  React.useEffect(() => {
    safeImages.forEach((image, index) => {
      extractColors(image, index);
    });
  }, [safeImages, theme.colors.cardBg, theme.colors.surface]);

  React.useEffect(() => {
    if (!focusImage) return;
    const targetIndex = safeImages.findIndex((image) => image === focusImage);
    if (targetIndex === -1) return;

    setActiveSlide(targetIndex);
    if (mainSliderRef.current) {
      mainSliderRef.current.slickGoTo(targetIndex);
    }
    if (modalSliderRef.current) {
      modalSliderRef.current.slickGoTo(targetIndex);
    }
  }, [focusImage, safeImages]);

  const openModal = (index: number) => {
    setActiveSlide(index);
    setIsModalOpen(true);

    setTimeout(() => {
      if (modalSliderRef.current) {
        modalSliderRef.current.slickGoTo(index);
      }
    }, 100);

    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setIsModalOpen(false);
    document.body.style.overflow = '';
  };

  return (
    <div className="product-media-container">
      <div 
        className="main-image-container rounded-lg overflow-hidden relative"
        style={{
          backgroundColor: theme.colors.cardBg,
          boxShadow: theme.effects.shadow
        }}
      >
        {safeImages.length > 1 && (
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
        <Slider
          ref={mainSliderRef}
          {...mainSliderSettings}
          className="product-slider"
        >
          {safeImages.map((image, index) => (
            <div
              key={index}
              className="product-image cursor-pointer relative"
              onClick={() => openModal(index)}
              style={{ width: '100%', height: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
            >
              {/* Blurred background with extracted colors */}
              <div
                className="absolute inset-0"
                style={{
                  background: backgroundColors[index] || theme.colors.cardBg,
                  filter: 'blur(40px)',
                  transform: 'scale(1.1)',
                  opacity: 0.6,
                  zIndex: 0
                }}
              />
              {/* Actual image */}
              <div className="relative z-10" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Image
                  src={image}
                  alt={`${productName} - Image ${index + 1}`}
                  width={800}
                  height={600}
                  style={{ objectFit: 'contain', objectPosition: 'center', maxWidth: '100%', maxHeight: '100%' }}
                  priority={index === 0}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
                />
              </div>
            </div>
          ))}
        </Slider>
      </div>

      {isModalOpen && (
        <div className="product-image-modal fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="modal-overlay absolute inset-0 bg-black bg-opacity-75"
            onClick={closeModal}
          ></div>
          <div className="modal-content relative z-10 w-full max-w-6xl mx-4">
            <button
              className="modal-close absolute top-4 right-4 z-20 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
              onClick={closeModal}
              aria-label="Close fullscreen view"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <div className="modal-slider-container bg-white rounded-lg overflow-hidden">
              <Slider
                ref={modalSliderRef}
                {...modalSliderSettings}
              >
                {safeImages.map((image, index) => (
                  <div 
                    key={index} 
                    className="modal-image"
                    style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Image
                      src={image}
                      alt={`${productName} - Image ${index + 1}`}
                      width={1200}
                      height={960}
                      style={{ objectFit: 'contain', objectPosition: 'center', maxWidth: '100%', maxHeight: '100%' }}
                    />
                  </div>
                ))}
              </Slider>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .product-media-container {
          padding-bottom: ${safeImages.length > 1 ? '72px' : '0'};
        }
        .product-slider .slick-list,
        .product-slider .slick-track {
          height: 100%;
        }
        .product-slider .slick-slide > div {
          height: 100%;
        }
        .product-slider .product-image {
          min-height: 320px;
          height: min(70vw, 520px) !important;
        }
        @media (min-width: 768px) {
          .product-slider .product-image {
            height: 600px !important;
          }
        }
        .product-slider .slick-dots {
          bottom: -68px;
          display: flex !important;
          justify-content: center;
          align-items: center;
          gap: 4px;
        }
        .product-slider .slick-dots li {
          width: 52px;
          height: 52px;
          margin: 0 4px;
        }
        .product-slider .slick-dots li button:before {
          display: none;
        }
        .product-slider .slick-dots li .thumbnail-wrapper {
          width: 52px;
          height: 52px;
          border: 2px solid transparent;
          border-radius: 8px;
          overflow: hidden;
          opacity: 0.75;
        }
        .product-slider .slick-dots li.slick-active .thumbnail-wrapper {
          border-color: ${theme.colors.primary};
          opacity: 1;
        }
        .product-slider .slick-prev,
        .product-slider .slick-next {
          z-index: 3;
          width: 40px;
          height: 40px;
        }
        .custom-arrow:before {
          display: none;
        }
        .product-image-modal .slick-dots {
          bottom: 20px;
        }
        .product-image-modal .slick-dots li {
          width: 64px;
          height: 64px;
          margin: 0 6px;
        }
        .product-image-modal .slick-dots li.slick-active .thumbnail-wrapper {
          border: 2px solid ${theme.colors.primary};
          border-radius: 6px;
        }
      `}</style>
    </div>
  );
}


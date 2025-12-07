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
        background: 'rgba(255, 255, 255, 0.9)',
        borderRadius: '50%',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
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
        background: 'rgba(255, 255, 255, 0.9)',
        borderRadius: '50%',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
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

export default function ProductMediaGallery({ images, productName }: ProductMediaGalleryProps) {
  const { theme } = useTheme();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const mainSliderRef = useRef<any>(null);
  const modalSliderRef = useRef<any>(null);

  // Safety check: ensure images is an array with at least one item
  const safeImages = images && Array.isArray(images) && images.length > 0 
    ? images 
    : ['/image.png'];

  const mainSliderSettings = {
    dots: safeImages.length > 1,
    dotsClass: 'slick-dots slick-thumb',
    infinite: safeImages.length > 1,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: safeImages.length > 1,
    fade: false,
    prevArrow: <PrevArrow />,
    nextArrow: <NextArrow />,
    beforeChange: (_: number, next: number) => {
      setActiveSlide(next);
    },
    customPaging: function (i: number) {
      return (
        <div className="thumbnail-wrapper" style={{ padding: '4px' }}>
          <Image
            src={safeImages[i]}
            alt={`Thumbnail ${i + 1}`}
            width={80}
            height={80}
            style={{ objectFit: 'cover', borderRadius: '4px' }}
          />
        </div>
      );
    }
  };

  const modalSliderSettings = {
    dots: safeImages.length > 1,
    dotsClass: 'slick-dots slick-thumb',
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
    customPaging: function (i: number) {
      return (
        <div className="thumbnail-wrapper" style={{ padding: '4px' }}>
          <Image
            src={safeImages[i]}
            alt={`Thumbnail ${i + 1}`}
            width={80}
            height={80}
            style={{ objectFit: 'cover', borderRadius: '4px' }}
          />
        </div>
      );
    }
  };

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
        className="main-image-container rounded-lg overflow-hidden"
        style={{
          backgroundColor: theme.colors.cardBg,
          boxShadow: theme.effects.shadow
        }}
      >
        <Slider
          ref={mainSliderRef}
          {...mainSliderSettings}
          className="product-slider"
        >
          {safeImages.map((image, index) => (
            <div
              key={index}
              className="product-image cursor-pointer"
              onClick={() => openModal(index)}
              style={{ width: '100%', height: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Image
                src={image}
                alt={`${productName} - Image ${index + 1}`}
                width={800}
                height={600}
                style={{ objectFit: 'contain', maxWidth: '100%', maxHeight: '100%' }}
                priority={index === 0}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
              />
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
                      style={{ objectFit: 'contain', maxWidth: '100%', maxHeight: '100%' }}
                    />
                  </div>
                ))}
              </Slider>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .product-slider .slick-dots {
          bottom: -60px;
        }
        .product-slider .slick-dots li {
          width: 80px;
          height: 80px;
          margin: 0 8px;
        }
        .product-slider .slick-dots li.slick-active .thumbnail-wrapper {
          border: 2px solid ${theme.colors.primary};
          border-radius: 6px;
        }
        .custom-arrow:before {
          display: none;
        }
        .product-image-modal .slick-dots {
          bottom: 20px;
        }
        .product-image-modal .slick-dots li {
          width: 80px;
          height: 80px;
          margin: 0 8px;
        }
        .product-image-modal .slick-dots li.slick-active .thumbnail-wrapper {
          border: 2px solid ${theme.colors.primary};
          border-radius: 6px;
        }
      `}</style>
    </div>
  );
}


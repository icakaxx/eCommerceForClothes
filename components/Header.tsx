'use client';

import { useState, useRef, useEffect } from 'react';
import { Menu, Settings, LogOut, ShoppingCart, User as UserIcon, ChevronLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';
import { useTheme } from '@/context/ThemeContext';
import { useProductTypes } from '@/context/ProductTypeContext';
import { useStoreSettings } from '@/context/StoreSettingsContext';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useProducts } from '@/context/ProductContext';

interface HeaderProps {
  isAdmin: boolean;
  setIsAdmin: (value: boolean) => void;
}

export default function Header({ isAdmin, setIsAdmin }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredNavItem, setHoveredNavItem] = useState<string | null>(null);
  const [hoveredCategoryId, setHoveredCategoryId] = useState<string | number | null>(null);
  const [displayedImage, setDisplayedImage] = useState<{ url: string; categoryName: string } | null>(null);
  const [mobileCategoryDrawerOpen, setMobileCategoryDrawerOpen] = useState(false);
  const [selectedSectionForCategories, setSelectedSectionForCategories] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { language } = useLanguage();
  const { productTypes } = useProductTypes();
  const { products } = useProducts();
  const t = translations[language];
  const dropdownRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Create nav items - For Him, For Her, Accessories
  const allNavItems = [
    { id: 'for-him', label: language === 'bg' ? 'За него' : 'For Him', path: '/for-him' },
    { id: 'for-her', label: language === 'bg' ? 'За нея' : 'For Her', path: '/for-her' },
    { id: 'accessories', label: language === 'bg' ? 'Аксесоари' : 'Accessories', path: '/accessories' }
  ];

  const getCurrentPage = () => {
    if (pathname === '/for-him') return 'for-him';
    if (pathname === '/for-her') return 'for-her';
    if (pathname === '/accessories') return 'accessories';
    return '';
  };

  const currentPage = getCurrentPage();

  const { theme } = useTheme();
  const { settings } = useStoreSettings();
  const { totalItems, openCart } = useCart();
  const { user, isAuthenticated, logout } = useAuth();

  // Map nav items to rfproducttypeid
  const getRfProductTypeId = (navId: string) => {
    const mapping: Record<string, number> = {
      'for-him': 1,
      'for-her': 2,
      'accessories': 3
    };
    return mapping[navId];
  };

  // Get categories for a specific nav item - same logic as StorePage
  const getCategoriesForNavItem = (navId: string) => {
    const rfProductTypeId = getRfProductTypeId(navId);
    if (!rfProductTypeId) return [];
    
    // Filter categories: rfproducttypeid is on PRODUCTS, not product_types
    // So we filter product types by checking if any products with that productTypeID have the matching rfproducttypeid
    const availableCategories = productTypes.filter(type => {
      const hasProducts = products.some(p => {
        if (!p.visible) return false;
        // Show products with quantity > 0 OR products with no variants (newly created)
        if (p.quantity <= 0 && p.variants && p.variants.length > 0) return false;
        
        // Check if product's rfproducttypeid matches the section
        const productRfProductTypeId = (p as any).rfproducttypeid;
        if (productRfProductTypeId === null || productRfProductTypeId === undefined) return false;
        
        // Check if product's rfproducttypeid matches the section
        const rfMatches = Number(productRfProductTypeId) === Number(rfProductTypeId);
        if (!rfMatches) return false;
        
        // Check productTypeID (camelCase) or producttypeid (lowercase) - handle both string and number
        const productTypeId = p.productTypeID || (p as any).producttypeid;
        const categoryId = type.producttypeid;
        
        // Compare as strings for safety (both might be strings or numbers)
        const productTypeIdStr = String(productTypeId);
        const categoryIdStr = String(categoryId);
        const matches = productTypeIdStr === categoryIdStr;
        
        return matches;
      });
      
      return hasProducts;
    });
    
    return availableCategories;
  };

  // Filter nav items to only show those with available categories
  const navItems = allNavItems.filter(item => {
    const categories = getCategoriesForNavItem(item.id);
    return categories.length > 0;
  });

  // Extract image URL from a product
  const extractImageFromProduct = (product: any): string | null => {
    // Get the first available image
    const images = product.images || product.Images || [];
    if (Array.isArray(images) && images.length > 0) {
      // Handle both string arrays and object arrays
      const firstImage = images[0];
      if (typeof firstImage === 'string') {
        return firstImage;
      } else if (firstImage && typeof firstImage === 'object') {
        const imgObj = firstImage as any;
        return imgObj.imageurl || imgObj.ImageURL || imgObj.url || null;
      }
    }
    
    // Check variants for images
    const variants = product.variants || product.Variants || [];
    if (variants.length > 0) {
      const firstVariant = variants[0] as any;
      const variantImage = firstVariant?.imageurl || firstVariant?.ImageURL || 
                         (Array.isArray(firstVariant?.images) && firstVariant.images.length > 0 ? firstVariant.images[0] : null);
      if (variantImage) {
        return typeof variantImage === 'string' ? variantImage : ((variantImage as any).imageurl || (variantImage as any).ImageURL || (variantImage as any).url || null);
      }
    }
    
    return null;
  };

  // Get a random product image from a specific category or from any category in the section
  const getRandomProductImage = (navItemId: string, categoryId?: string | number | null): { url: string; categoryName: string } | null => {
    const rfProductTypeId = getRfProductTypeId(navItemId);
    if (!rfProductTypeId) return null;
    
    // Get all products that match the section's rfproducttypeid
    let sectionProducts = products.filter(p => {
      if (!p.visible) return false;
      if (p.quantity <= 0 && p.variants && p.variants.length > 0) return false;
      
      const productRfProductTypeId = (p as any).rfproducttypeid;
      if (productRfProductTypeId === null || productRfProductTypeId === undefined) return false;
      if (Number(productRfProductTypeId) !== Number(rfProductTypeId)) return false;
      
      // If categoryId is provided, filter by that category
      if (categoryId !== null && categoryId !== undefined) {
        const productTypeId = p.productTypeID || (p as any).producttypeid;
        const categoryIdStr = String(categoryId);
        const productTypeIdStr = String(productTypeId);
        return productTypeIdStr === categoryIdStr;
      }
      
      return true;
    });
    
    if (sectionProducts.length === 0) return null;
    
    // Get a random product
    const randomProduct = sectionProducts[Math.floor(Math.random() * sectionProducts.length)];
    const imageUrl = extractImageFromProduct(randomProduct);
    
    if (!imageUrl) return null;
    
    // Get category name
    const productTypeId = randomProduct.productTypeID || (randomProduct as any).producttypeid;
    const category = productTypes.find(pt => pt.producttypeid === productTypeId);
    const categoryName = category?.name || '';
    
    return { url: imageUrl, categoryName };
  };

  // Handle category selection
  const handleCategorySelect = (navItem: typeof navItems[0], categoryId: string) => {
    const url = `${navItem.path}?producttypeid=${categoryId}`;
    router.push(url);
    setHoveredNavItem(null);
    setMobileCategoryDrawerOpen(false);
    setMobileMenuOpen(false);
    setSelectedSectionForCategories(null);
    setIsAdmin(false);
  };

  // Handle main section click on mobile
  const handleMobileSectionClick = (item: typeof navItems[0]) => {
    setSelectedSectionForCategories(item.id);
    setMobileCategoryDrawerOpen(true);
  };

  // Update displayed image when dropdown opens or category changes
  useEffect(() => {
    if (hoveredNavItem) {
      const categories = getCategoriesForNavItem(hoveredNavItem);
      if (categories.length > 0) {
        // If hovering over a specific category, show image from that category
        if (hoveredCategoryId !== null && hoveredCategoryId !== undefined) {
          const imageData = getRandomProductImage(hoveredNavItem, String(hoveredCategoryId));
          if (imageData) {
            setDisplayedImage(imageData);
          }
        } else {
          // Otherwise, show a random image from any category in this section
          const imageData = getRandomProductImage(hoveredNavItem, null);
          if (imageData) {
            setDisplayedImage(imageData);
          }
        }
      }
    } else {
      setDisplayedImage(null);
    }
  }, [hoveredNavItem, hoveredCategoryId, productTypes, products]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        // Clear any pending timeout
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
          hoverTimeoutRef.current = null;
        }
        setHoveredNavItem(null);
        setHoveredCategoryId(null);
      }
    };

    if (hoveredNavItem) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      // Cleanup timeout on unmount
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
    };
  }, [hoveredNavItem]);

  return (
    <>
      <header
        className="shadow-sm sticky top-0 z-50 transition-colors duration-300"
        style={{
          backgroundColor: theme.colors.headerBg,
          borderBottom: `1px solid ${theme.colors.border}`
        }}
      >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex items-center h-16 relative">
          {/* Navigation tabs on the left */}
          <nav className="hidden md:flex items-center gap-4 lg:gap-8 flex-1" ref={dropdownRef}>
            {navItems.map(item => {
              const categories = getCategoriesForNavItem(item.id);
              const isHovered = hoveredNavItem === item.id;
              
              return (
                <div
                  key={item.id}
                  className="relative"
                  onMouseEnter={() => {
                    // Clear any pending timeout
                    if (hoverTimeoutRef.current) {
                      clearTimeout(hoverTimeoutRef.current);
                      hoverTimeoutRef.current = null;
                    }
                    setHoveredNavItem(item.id);
                  }}
                  onMouseLeave={() => {
                        // Delay closing the dropdown
                        hoverTimeoutRef.current = setTimeout(() => {
                          setHoveredNavItem(null);
                          setHoveredCategoryId(null);
                          hoverTimeoutRef.current = null;
                        }, 200); // 200ms delay
                  }}
                >
                  <Link
                    href={item.path}
                    onClick={() => setIsAdmin(false)}
                    className="text-sm font-medium transition-colors whitespace-nowrap"
                    style={{
                      color: currentPage === item.id && !isAdmin 
                        ? theme.colors.primary 
                        : theme.colors.textSecondary
                    }}
                    onMouseEnter={(e) => {
                      if (currentPage !== item.id || isAdmin) {
                        e.currentTarget.style.color = theme.colors.text;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentPage !== item.id || isAdmin) {
                        e.currentTarget.style.color = theme.colors.textSecondary;
                      }
                    }}
                  >
                    {item.label}
                  </Link>
                  
                  {/* Dropdown Menu - Multi-column design with image */}
                  {isHovered && (
                    <div
                      className="absolute top-full left-0 md:fixed md:left-1/2 md:-translate-x-1/2 md:top-16 lg:absolute lg:top-full lg:left-0 lg:translate-x-0 mt-2 w-[800px] rounded-lg shadow-xl z-50"
                      style={{
                        backgroundColor: theme.colors.surface,
                        border: `1px solid ${theme.colors.border}`
                      }}
                      onMouseEnter={() => {
                        // Clear any pending timeout
                        if (hoverTimeoutRef.current) {
                          clearTimeout(hoverTimeoutRef.current);
                          hoverTimeoutRef.current = null;
                        }
                        setHoveredNavItem(item.id);
                      }}
                      onMouseLeave={() => {
                        // Delay closing the dropdown
                        hoverTimeoutRef.current = setTimeout(() => {
                          setHoveredNavItem(null);
                          setHoveredCategoryId(null);
                          hoverTimeoutRef.current = null;
                        }, 200); // 200ms delay
                      }}
                    >
                      {categories.length > 0 ? (
                        <div className="flex">
                          {/* Categories Section */}
                          <div className="flex-1 p-6">
                            <div className="mb-4 pb-3 border-b" style={{ borderColor: theme.colors.border }}>
                              <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.colors.textSecondary }}>
                                {language === 'bg' ? 'Категории' : 'Categories'}
                              </h3>
                            </div>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                              {categories.map(category => (
                                  <button
                                    key={category.producttypeid}
                                    onClick={() => handleCategorySelect(item, category.producttypeid)}
                                    className="text-left py-2 text-sm font-medium transition-all duration-200 group"
                                    style={{
                                      color: theme.colors.text
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.color = theme.colors.primary;
                                      e.currentTarget.style.paddingLeft = '4px';
                                      setHoveredCategoryId(category.producttypeid);
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.color = theme.colors.text;
                                      e.currentTarget.style.paddingLeft = '0px';
                                      setHoveredCategoryId(null);
                                    }}
                                  >
                                    <span className="flex items-center gap-2">
                                      {category.name}
                                      <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ color: theme.colors.primary }}>
                                        →
                                      </span>
                                    </span>
                                  </button>
                              ))}
                            </div>
                          </div>
                          
                          {/* Product Image Section - Always visible when dropdown is open */}
                          {displayedImage && (
                            <div 
                              className="w-[280px] border-l p-6 flex flex-col items-center justify-center"
                              style={{ 
                                borderColor: theme.colors.border,
                                backgroundColor: theme.colors.surface
                              }}
                              onMouseEnter={() => {
                                // Keep category hovered when mouse enters image area
                                if (hoverTimeoutRef.current) {
                                  clearTimeout(hoverTimeoutRef.current);
                                  hoverTimeoutRef.current = null;
                                }
                              }}
                            >
                              <div className="w-full">
                                <div className="relative w-full aspect-square mb-4 rounded-lg overflow-hidden" style={{ border: `1px solid ${theme.colors.border}` }}>
                                  <Image
                                    src={displayedImage.url}
                                    alt={displayedImage.categoryName}
                                    fill
                                    className="object-cover"
                                    sizes="280px"
                                  />
                                </div>
                                <div className="text-center">
                                  <h4 className="text-lg font-semibold mb-1" style={{ color: theme.colors.text }}>
                                    {displayedImage.categoryName}
                                  </h4>
                                  <p className="text-sm" style={{ color: theme.colors.primary }}>
                                    {language === 'bg' ? '- Разгледай всички -' : '- Discover All -'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-6">
                          <div className="text-center py-8">
                            <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                              {language === 'bg' ? 'Няма налични категории' : 'No categories available'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
          
          {/* Logo - centered on desktop, left on mobile */}
          <Link
            href="/"
            className="flex items-center gap-2 sm:gap-3 cursor-pointer md:absolute md:left-1/2 md:transform md:-translate-x-1/2"
            onClick={() => setIsAdmin(false)}
          >
            {settings?.logourl ? (
              <Image
                src={settings.logourl}
                alt={`${settings.storename} Logo`}
                width={120}
                height={40}
                className="h-8 sm:h-10 w-auto object-contain"
                priority
              />
            ) : (
              <Image
                src="/image.png"
                alt={`${settings?.storename || 'Store'} Logo`}
                width={120}
                height={40}
                className="h-8 sm:h-10 w-auto object-contain"
                priority
              />
            )}
            <span
              className="text-lg sm:text-xl font-semibold transition-colors duration-300"
              style={{ color: theme.colors.text }}
            >
              {settings?.storename || 'Store'}
            </span>
          </Link>
          
          {/* Right side actions */}
          <div className="flex items-center gap-2 sm:gap-4 flex-1 justify-end">
            {!isAdmin && (
              <>
                <button
                  onClick={openCart}
                  className="relative p-2 transition-colors duration-300"
                  style={{ color: theme.colors.textSecondary }}
                  onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.text}
                  onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.textSecondary}
                  aria-label="Shopping Cart"
                >
                  <ShoppingCart size={20} />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {totalItems > 99 ? '99+' : totalItems}
                    </span>
                  )}
                </button>
                <Link
                  href={isAuthenticated && user ? "/user/dashboard" : "/user"}
                  className="p-2 transition-colors duration-300"
                  style={{ color: theme.colors.textSecondary }}
                  onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.text}
                  onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.textSecondary}
                  aria-label={isAuthenticated && user ? "User Dashboard" : "Login"}
                >
                  <UserIcon size={20} />
                </Link>
                {isAuthenticated && user && (
                  <button
                    onClick={() => {
                      logout();
                      router.push('/');
                    }}
                    className="p-2 transition-colors duration-300"
                    style={{ color: theme.colors.textSecondary }}
                    onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.text}
                    onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.textSecondary}
                    aria-label="Logout"
                  >
                    <LogOut size={20} />
                  </button>
                )}
              </>
            )}

            {isAdmin && (
              <>
                <button
                  onClick={() => {
                    router.push('/admin');
                  }}
                  className="p-2 rounded-lg transition-all duration-300"
                  style={{
                    color: theme.colors.textSecondary,
                    border: `1px solid ${theme.colors.border}`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = theme.colors.text;
                    e.currentTarget.style.borderColor = theme.colors.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = theme.colors.textSecondary;
                    e.currentTarget.style.borderColor = theme.colors.border;
                  }}
                  aria-label={t.backToAdmin}
                >
                  <Settings size={18} />
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem('isAdmin', 'false');
                    setIsAdmin(false);
                    router.push('/');
                  }}
                  className="p-2 rounded-lg transition-all duration-300"
                  style={{
                    color: theme.colors.textSecondary,
                    border: `1px solid ${theme.colors.border}`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = theme.colors.text;
                    e.currentTarget.style.borderColor = theme.colors.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = theme.colors.textSecondary;
                    e.currentTarget.style.borderColor = theme.colors.border;
                  }}
                  aria-label={t.exitAdmin}
                >
                  <LogOut size={18} />
                </button>
              </>
            )}
            
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex flex-col items-center justify-center p-2 transition-colors duration-300"
              aria-label="Menu"
              style={{ color: theme.colors.textSecondary }}
            >
              <Menu size={24} />
              <span className="text-[10px] font-medium mt-0.5">МЕНЮ</span>
            </button>
          </div>
        </div>
      </div>
    </header>

    {/* Backdrop Overlay */}
    {mobileMenuOpen && (
      <div
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={() => {
          setMobileMenuOpen(false);
          setMobileCategoryDrawerOpen(false);
          setSelectedSectionForCategories(null);
        }}
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      />
    )}

    {/* Mobile Menu - Sliding from Right */}
    {mobileMenuOpen && (
      <div
        className="fixed top-0 right-0 h-full w-[280px] z-50 md:hidden shadow-2xl"
        style={{ 
          backgroundColor: theme.colors.surface,
          width: '280px',
          minWidth: '280px',
          maxWidth: '280px'
        }}
        onTouchStart={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - No Close Button */}
        <div className="flex items-center p-6 border-b"
             style={{ borderColor: theme.colors.border }}>
          <h2 className="font-semibold text-lg"
              style={{ color: theme.colors.text }}>
            МЕНЮ
          </h2>
        </div>

        {/* Menu Items */}
        <nav className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto">
            {navItems.map(item => {
              const categories = getCategoriesForNavItem(item.id);
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (categories.length > 0) {
                      handleMobileSectionClick(item);
                    } else {
                      // If no categories, navigate directly to the section
                      router.push(item.path);
                      setIsAdmin(false);
                      setMobileMenuOpen(false);
                    }
                  }}
                  className="block w-full text-left px-6 py-4 font-medium border-b transition-colors duration-300 hover:opacity-70"
                  style={{
                    color: currentPage === item.id && !isAdmin
                      ? theme.colors.primary
                      : theme.colors.text,
                    borderColor: theme.colors.border
                  }}
                >
                  {item.label}
                </button>
              );
            })}

            {/* User menu in mobile */}
            {!isAdmin && (
              <>
                {isAuthenticated && user ? (
                  <>
                    <Link
                      href="/user/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 w-full text-left px-6 py-4 font-medium border-b transition-colors duration-300 hover:opacity-70"
                      style={{
                        color: theme.colors.text,
                        borderColor: theme.colors.border
                      }}
                    >
                      <UserIcon size={20} />
                      {language === 'bg' ? 'Профил' : 'Profile'}
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                        router.push('/');
                      }}
                      className="flex items-center gap-3 w-full text-left px-6 py-4 font-medium border-b transition-colors duration-300 hover:opacity-70"
                      style={{
                        color: theme.colors.text,
                        borderColor: theme.colors.border
                      }}
                    >
                      <LogOut size={20} />
                      {language === 'bg' ? 'Изход' : 'Logout'}
                    </button>
                  </>
                ) : (
                  <Link
                    href="/user"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 w-full text-left px-6 py-4 font-medium border-b transition-colors duration-300 hover:opacity-70"
                    style={{
                      color: theme.colors.text,
                      borderColor: theme.colors.border
                    }}
                  >
                    <UserIcon size={20} />
                    {language === 'bg' ? 'Вход' : 'Login'}
                  </Link>
                )}
              </>
            )}

            {/* Admin Buttons (only shown when in admin mode) */}
            {isAdmin && (
              <>
                <button
                  onClick={() => {
                    router.push('/admin');
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 w-full text-left px-6 py-4 font-medium border-b transition-colors duration-300 hover:opacity-70"
                  style={{
                    color: theme.colors.textSecondary,
                    borderColor: theme.colors.border
                  }}
                >
                  <div 
                    className="p-2 rounded-lg"
                    style={{
                      border: `1px solid ${theme.colors.border}`
                    }}
                  >
                    <Settings size={18} />
                  </div>
                  {t.backToAdmin}
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem('isAdmin', 'false');
                    setIsAdmin(false);
                    router.push('/');
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 w-full text-left px-6 py-4 font-medium border-b transition-colors duration-300 hover:opacity-70"
                  style={{
                    color: theme.colors.textSecondary,
                    borderColor: theme.colors.border
                  }}
                >
                  <div 
                    className="p-2 rounded-lg"
                    style={{
                      border: `1px solid ${theme.colors.border}`
                    }}
                  >
                    <LogOut size={18} />
                  </div>
                  {t.exitAdmin}
                </button>
              </>
            )}
          </div>

          {/* Bottom CTA Button */}
          <div className="p-6 border-t"
               style={{ borderColor: theme.colors.border }}>
            <Link
              href="/for-him"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full text-center py-3 px-6 rounded-lg font-medium transition-all duration-300"
              style={{
                backgroundColor: theme.colors.primary,
                color: '#ffffff'
              }}
            >
              {t.goToStore}
            </Link>
          </div>
        </nav>
      </div>
    )}

    {/* Mobile Category Drawer - Overlay on top of main menu */}
    {mobileCategoryDrawerOpen && selectedSectionForCategories && (
      <div
        className="fixed top-0 right-0 h-full w-[280px] md:hidden shadow-2xl"
        style={{ 
          zIndex: 60,
          backgroundColor: theme.colors.surface,
          width: '280px',
          minWidth: '280px',
          maxWidth: '280px'
        }}
        onTouchStart={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Back Button */}
        <div className="flex items-center p-6 border-b"
             style={{ borderColor: theme.colors.border }}>
          <button
            onClick={() => {
              setMobileCategoryDrawerOpen(false);
              setSelectedSectionForCategories(null);
            }}
            className="mr-3 p-1 transition-colors duration-300"
            style={{ color: theme.colors.text }}
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="font-semibold text-lg"
              style={{ color: theme.colors.text }}>
            {navItems.find(item => item.id === selectedSectionForCategories)?.label || 'Categories'}
          </h2>
        </div>

        {/* Category Items */}
        <nav className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-4">
            {getCategoriesForNavItem(selectedSectionForCategories).length > 0 ? (
              <>
                <div className="mb-4 pb-2 border-b" style={{ borderColor: theme.colors.border }}>
                  <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.colors.textSecondary }}>
                    {language === 'bg' ? 'Категории' : 'Categories'}
                  </h3>
                </div>
                <div className="space-y-1">
                  {getCategoriesForNavItem(selectedSectionForCategories).map(category => {
                    const navItem = navItems.find(item => item.id === selectedSectionForCategories);
                    if (!navItem) return null;
                    
                    return (
                      <button
                        key={category.producttypeid}
                        onClick={() => handleCategorySelect(navItem, category.producttypeid)}
                        className="block w-full text-left px-4 py-3 font-medium rounded-lg transition-all duration-200 group"
                        style={{
                          color: theme.colors.text,
                          backgroundColor: 'transparent'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = theme.colors.cardBg;
                          e.currentTarget.style.color = theme.colors.primary;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = theme.colors.text;
                        }}
                      >
                        <span className="flex items-center justify-between">
                          {category.name}
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ color: theme.colors.primary }}>
                            →
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                  {language === 'bg' ? 'Няма налични категории' : 'No categories available'}
                </p>
              </div>
            )}
          </div>
        </nav>
      </div>
    )}
    </>
  );
}


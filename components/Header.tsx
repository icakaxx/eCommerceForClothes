'use client';

import { useState, useRef, useEffect } from 'react';
import { Menu, Settings, LogOut, ShoppingCart, User as UserIcon, ChevronLeft, X, Search } from 'lucide-react';
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
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null); // Desktop: clicked/expanded category
  const [displayedImage, setDisplayedImage] = useState<{ url: string; categoryName: string } | null>(null);
  const [mobileCategoryDrawerOpen, setMobileCategoryDrawerOpen] = useState(false);
  const [selectedSectionForCategories, setSelectedSectionForCategories] = useState<string | null>(null);
  const [selectedParentCategoryId, setSelectedParentCategoryId] = useState<string | null>(null); // Mobile: selected parent for nested drawer
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

  // Get categories for a specific nav item with hierarchical structure
  const getCategoriesForNavItem = (navId: string) => {
    const rfProductTypeId = getRfProductTypeId(navId);
    if (!rfProductTypeId) return [];
    
    // Filter categories: rfproducttypeid is on PRODUCTS, not product_types
    // So we filter product types by checking if any products with that productTypeID have the matching rfproducttypeid
    const availableCategories = productTypes.filter(type => {
      // Check if this category or any of its children have products
      const checkCategoryHasProducts = (categoryId: string): boolean => {
        // Check direct products
        const hasDirectProducts = products.some(p => {
          if (!p.visible) return false;
          if (p.quantity <= 0 && p.variants && p.variants.length > 0) return false;
          
          const productRfProductTypeId = (p as any).rfproducttypeid;
          if (productRfProductTypeId === null || productRfProductTypeId === undefined) return false;
          if (Number(productRfProductTypeId) !== Number(rfProductTypeId)) return false;
          
          const productTypeId = p.productTypeID || (p as any).producttypeid;
          const productTypeIdStr = String(productTypeId);
          const categoryIdStr = String(categoryId);
          return productTypeIdStr === categoryIdStr;
        });
        
        if (hasDirectProducts) return true;
        
        // Check child categories
        const children = productTypes.filter(pt => pt.parent_producttypeid === categoryId);
        return children.some(child => checkCategoryHasProducts(child.producttypeid));
      };
      
      return checkCategoryHasProducts(type.producttypeid);
    });
    
    // Build hierarchical structure: separate level 2 (no parent) and level 3 (has parent)
    const level2Categories = availableCategories.filter(type => !type.parent_producttypeid);
    const level3Categories = availableCategories.filter(type => type.parent_producttypeid);
    
    // Group level 3 categories by their parent
    const categoriesByParent = new Map<string, typeof level3Categories>();
    level3Categories.forEach(cat => {
      const parentId = cat.parent_producttypeid!;
      if (!categoriesByParent.has(parentId)) {
        categoriesByParent.set(parentId, []);
      }
      categoriesByParent.get(parentId)!.push(cat);
    });
    
    // Return structure with parent categories and their children
    return level2Categories.map(parent => ({
      ...parent,
      children: categoriesByParent.get(parent.producttypeid) || []
    }));
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
    setExpandedCategoryId(null);
    setMobileCategoryDrawerOpen(false);
    setMobileMenuOpen(false);
    setSelectedSectionForCategories(null);
    setSelectedParentCategoryId(null);
    setIsAdmin(false);
  };

  // Handle parent category click (desktop) - expand to show children
  const handleParentCategoryClick = (e: React.MouseEvent, categoryId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedCategoryId(expandedCategoryId === categoryId ? null : categoryId);
  };

  // Handle main section click on mobile
  const handleMobileSectionClick = (item: typeof navItems[0]) => {
    setSelectedSectionForCategories(item.id);
    setSelectedParentCategoryId(null);
    setMobileCategoryDrawerOpen(true);
  };

  // Handle parent category click on mobile - show nested drawer
  const handleMobileParentCategoryClick = (categoryId: string) => {
    setSelectedParentCategoryId(categoryId);
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
        setExpandedCategoryId(null); // Collapse all expanded categories
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
        className="sticky top-0 z-50 transition-colors duration-300 border-b"
        style={{
          backgroundColor: theme.colors.headerBg,
          borderBottom: `1px solid ${theme.colors.border}`
        }}
      >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex items-center h-14 sm:h-16 relative">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 -ml-1 transition-colors duration-300"
            aria-label="Menu"
            style={{ color: theme.colors.text }}
          >
            <Menu size={22} />
          </button>

          <Link
            href="/"
            className="flex items-center gap-2 sm:gap-3 cursor-pointer flex-1 md:flex-none justify-center md:justify-start md:mr-6"
            onClick={() => setIsAdmin(false)}
          >
            {settings?.logourl ? (
              <Image
                src={settings.logourl}
                alt={`${settings.storename} Logo`}
                width={120}
                height={40}
                className="h-7 sm:h-9 w-auto object-contain"
                priority
              />
            ) : (
              <>
                <span
                  className="hidden sm:flex h-8 w-8 items-center justify-center rounded-sm text-[9px] font-bold tracking-tighter text-white"
                  style={{ backgroundColor: theme.colors.text }}
                >
                  MODA
                </span>
                <Image
                  src="/image.png"
                  alt={`${settings?.storename || 'Store'} Logo`}
                  width={120}
                  height={40}
                  className="h-7 sm:h-9 w-auto object-contain sm:hidden"
                  priority
                />
              </>
            )}
            <span
              className="text-base sm:text-lg font-bold tracking-[0.12em] uppercase transition-colors duration-300"
              style={{ color: theme.colors.text }}
            >
              {settings?.storename || 'MODABOX'}
            </span>
          </Link>

          <nav className="hidden md:flex items-center justify-center gap-6 lg:gap-10 absolute left-1/2 -translate-x-1/2" ref={dropdownRef}>
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
                          setExpandedCategoryId(null); // Collapse all expanded categories
                          hoverTimeoutRef.current = null;
                        }, 200); // 200ms delay
                  }}
                >
                  <Link
                    href={item.path}
                    onClick={() => setIsAdmin(false)}
                    className="text-xs font-semibold uppercase tracking-[0.14em] transition-colors whitespace-nowrap"
                    style={{
                      color: currentPage === item.id && !isAdmin 
                        ? theme.colors.primary 
                        : theme.colors.text
                    }}
                    onMouseEnter={(e) => {
                      if (currentPage !== item.id || isAdmin) {
                        e.currentTarget.style.color = theme.colors.primary;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentPage !== item.id || isAdmin) {
                        e.currentTarget.style.color = theme.colors.text;
                      } else {
                        e.currentTarget.style.color = theme.colors.primary;
                      }
                    }}
                  >
                    {item.label}
                  </Link>
                  
                  {/* Dropdown Menu - Multi-column design with image */}
                  {isHovered && (
                    <div
                      className="absolute top-full left-1/2 -translate-x-1/2 md:fixed md:left-1/2 md:-translate-x-1/2 md:top-16 lg:fixed lg:left-1/2 lg:-translate-x-1/2 lg:top-16 mt-2 w-screen max-w-7xl rounded-lg shadow-xl z-50"
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
                          setExpandedCategoryId(null); // Collapse all expanded categories
                          hoverTimeoutRef.current = null;
                        }, 200); // 200ms delay
                      }}
                    >
                      {categories.length > 0 ? (
                        <div className="flex">
                          {/* Categories Section - Level 2 on left, Level 3 on right */}
                          <div className="flex-1 p-6">
                            <div className="mb-4 pb-3 border-b" style={{ borderColor: theme.colors.border }}>
                              <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.colors.textSecondary }}>
                                {language === 'bg' ? 'Категории' : 'Categories'}
                              </h3>
                            </div>
                            <div className="flex gap-8">
                              {/* Level 2 Categories (Parent categories) - Left side */}
                              <div className="flex-1 min-w-[200px] border-r pr-6" style={{ borderColor: theme.colors.border }}>
                                {categories.map(category => (
                                  <div key={category.producttypeid} className="mb-4">
                                    <button
                                      onClick={(e) => {
                                        if (category.children && category.children.length > 0) {
                                          handleParentCategoryClick(e, category.producttypeid);
                                        } else {
                                          handleCategorySelect(item, category.producttypeid);
                                        }
                                      }}
                                      className="text-left py-2 text-sm font-semibold transition-all duration-200 group w-full"
                                      style={{
                                        color: expandedCategoryId === category.producttypeid ? theme.colors.primary : theme.colors.text,
                                        paddingLeft: expandedCategoryId === category.producttypeid ? '4px' : '0px'
                                      }}
                                      onMouseEnter={() => {
                                        setHoveredCategoryId(category.producttypeid);
                                      }}
                                      onMouseLeave={() => {
                                        setHoveredCategoryId(null);
                                      }}
                                    >
                                      <span className="flex items-center gap-2">
                                        {category.name}
                                        {(category.children && category.children.length > 0) && (
                                          <span 
                                            className={`transition-opacity duration-200 ${
                                              hoveredCategoryId === category.producttypeid ? 'opacity-100' : 'opacity-0'
                                            }`} 
                                            style={{ color: theme.colors.primary }}
                                          >
                                            →
                                          </span>
                                        )}
                                      </span>
                                    </button>
                                  </div>
                                ))}
                              </div>
                              {/* Level 3 Subcategories - Right side when parent is clicked/expanded */}
                              <div className="flex-1 min-w-[200px]">
                                {expandedCategoryId && (() => {
                                  const expandedCategory = categories.find(cat => cat.producttypeid === expandedCategoryId);
                                  if (!expandedCategory || !expandedCategory.children || expandedCategory.children.length === 0) {
                                    return null;
                                  }
                                  return (
                                    <div className="space-y-1">
                                      {expandedCategory.children.map(subcategory => (
                                        <button
                                          key={subcategory.producttypeid}
                                          onClick={() => handleCategorySelect(item, subcategory.producttypeid)}
                                          className="text-left py-2 text-sm transition-all duration-200 group w-full block"
                                          style={{
                                            color: theme.colors.text
                                          }}
                                          onMouseEnter={(e) => {
                                            e.currentTarget.style.color = theme.colors.primary;
                                            e.currentTarget.style.paddingLeft = '4px';
                                            // Update image when hovering over subcategory
                                            setHoveredCategoryId(subcategory.producttypeid);
                                          }}
                                          onMouseLeave={(e) => {
                                            e.currentTarget.style.color = theme.colors.text;
                                            e.currentTarget.style.paddingLeft = '0px';
                                            // Reset to parent category image when leaving subcategory
                                            setHoveredCategoryId(expandedCategoryId);
                                          }}
                                        >
                                          {subcategory.name}
                                        </button>
                                      ))}
                                    </div>
                                  );
                                })()}
                              </div>
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
          
          <div className="flex items-center gap-0.5 sm:gap-2 ml-auto shrink-0">
            {!isAdmin && (
              <>
                <Link
                  href="/products"
                  className="p-2 transition-colors duration-300 hidden sm:block"
                  style={{ color: theme.colors.text }}
                  onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.primary}
                  onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.text}
                  aria-label={language === 'bg' ? 'Търсене' : 'Search'}
                >
                  <Search size={20} />
                </Link>
                <button
                  onClick={openCart}
                  className="relative p-2 transition-colors duration-300"
                  style={{ color: theme.colors.text }}
                  onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.primary}
                  onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.text}
                  aria-label="Shopping Cart"
                >
                  <ShoppingCart size={20} />
                  {totalItems > 0 && (
                    <span
                      className="absolute -top-0.5 -right-0.5 text-white text-[10px] rounded-full h-[18px] min-w-[18px] px-1 flex items-center justify-center font-semibold"
                      style={{ backgroundColor: theme.colors.primary }}
                    >
                      {totalItems > 99 ? '99+' : totalItems}
                    </span>
                  )}
                </button>
                <Link
                  href={isAuthenticated && user ? "/user/dashboard" : "/user"}
                  className="p-2 transition-colors duration-300"
                  style={{ color: theme.colors.text }}
                  onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.primary}
                  onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.text}
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
      <>
        {/* Main Categories Drawer */}
        {!selectedParentCategoryId && (
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
            {/* Header with Back and X Buttons */}
            <div className="flex items-center justify-between p-6 border-b"
                 style={{ borderColor: theme.colors.border }}>
              <button
                onClick={() => {
                  setMobileCategoryDrawerOpen(false);
                  setSelectedSectionForCategories(null);
                }}
                className="p-1 transition-colors duration-300"
                style={{ color: theme.colors.text }}
              >
                <ChevronLeft size={20} />
              </button>
              <h2 className="font-semibold text-lg flex-1 text-center"
                  style={{ color: theme.colors.text }}>
                {navItems.find(item => item.id === selectedSectionForCategories)?.label || 'Categories'}
              </h2>
              <button
                onClick={() => {
                  setMobileCategoryDrawerOpen(false);
                  setSelectedSectionForCategories(null);
                }}
                className="p-1 transition-colors duration-300"
                style={{ color: theme.colors.text }}
              >
                <X size={20} />
              </button>
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
                        const hasChildren = category.children && category.children.length > 0;
                        return (
                          <button
                            key={category.producttypeid}
                            onClick={() => {
                              if (hasChildren) {
                                handleMobileParentCategoryClick(category.producttypeid);
                              } else {
                                const navItem = navItems.find(item => item.id === selectedSectionForCategories);
                                if (navItem) {
                                  handleCategorySelect(navItem, category.producttypeid);
                                }
                              }
                            }}
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
                              {hasChildren && (
                                <span className="opacity-100 transition-opacity duration-200" style={{ color: theme.colors.primary }}>
                                  →
                                </span>
                              )}
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

        {/* Nested Subcategories Drawer */}
        {selectedParentCategoryId && (() => {
          const categories = getCategoriesForNavItem(selectedSectionForCategories);
          const parentCategory = categories.find(cat => cat.producttypeid === selectedParentCategoryId);
          if (!parentCategory || !parentCategory.children || parentCategory.children.length === 0) {
            return null;
          }
          return (
            <div
              className="fixed top-0 right-0 h-full w-[280px] md:hidden shadow-2xl"
              style={{ 
                zIndex: 70,
                backgroundColor: theme.colors.surface,
                width: '280px',
                minWidth: '280px',
                maxWidth: '280px'
              }}
              onTouchStart={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with Back and X Buttons */}
              <div className="flex items-center justify-between p-6 border-b"
                   style={{ borderColor: theme.colors.border }}>
                <button
                  onClick={() => {
                    setSelectedParentCategoryId(null);
                  }}
                  className="p-1 transition-colors duration-300"
                  style={{ color: theme.colors.text }}
                >
                  <ChevronLeft size={20} />
                </button>
                <h2 className="font-semibold text-lg flex-1 text-center"
                    style={{ color: theme.colors.text }}>
                  {parentCategory.name}
                </h2>
                <button
                  onClick={() => {
                    setMobileCategoryDrawerOpen(false);
                    setSelectedSectionForCategories(null);
                    setSelectedParentCategoryId(null);
                  }}
                  className="p-1 transition-colors duration-300"
                  style={{ color: theme.colors.text }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Subcategory Items */}
              <nav className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-1">
                    {parentCategory.children.map(subcategory => {
                      const navItem = navItems.find(item => item.id === selectedSectionForCategories);
                      if (!navItem) return null;
                      return (
                        <button
                          key={subcategory.producttypeid}
                          onClick={() => handleCategorySelect(navItem, subcategory.producttypeid)}
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
                          {subcategory.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </nav>
            </div>
          );
        })()}
      </>
    )}
    </>
  );
}


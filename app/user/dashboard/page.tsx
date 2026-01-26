'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { User, Package, Lock, Edit3, LogOut, RefreshCw, Truck, MapPin, X, Heart } from 'lucide-react'
import styles from './dashboard.module.css'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { translations } from '@/lib/translations'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CartDrawer from '@/components/CartDrawer'
import ProductCard from '@/components/ProductCard'
import type { CityOption } from '@/store/checkoutStore'
import type { EcontOfficesData, EcontOffice } from '@/types/econt'
import { Product } from '@/lib/data'

// Favorites List Component
function FavoritesList({ userId, language }: { userId: string; language: string }) {
  const [favorites, setFavorites] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const t = translations[language as 'en' | 'bg']

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/favorites?userId=${userId}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch favorites')
        }

        if (data.success && data.productIds) {
          // Fetch full product details for each favorite
          const productsResponse = await fetch('/api/products')
          const productsData = await productsResponse.json()

          if (productsData.success && productsData.products) {
            const favoriteProducts = productsData.products.filter((p: Product) =>
              data.productIds.includes(p.id || p.productid)
            )
            setFavorites(favoriteProducts)
          }
        }
      } catch (err: any) {
        console.error('Error fetching favorites:', err)
        setError(err.message || (language === 'bg' ? 'Грешка при зареждане на любимите' : 'Error loading favorites'))
      } finally {
        setIsLoading(false)
      }
    }

    if (userId) {
      fetchFavorites()
    }
  }, [userId, language])

  if (isLoading) {
    return (
      <div className={styles.emptyState}>
        <p>{language === 'bg' ? 'Зареждане...' : 'Loading...'}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.emptyState}>
        <p style={{ color: '#ef4444' }}>{error}</p>
      </div>
    )
  }

  if (favorites.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Heart size={48} className={styles.emptyIcon} />
        <h3>{t.favoritesEmpty || (language === 'bg' ? 'Все още няма любими' : 'No favorites yet')}</h3>
        <p>{t.noFavoritesYet || (language === 'bg' ? 'Все още не сте добавили продукти в любими' : "You haven't favorited any products yet")}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {favorites.map((product) => (
        <ProductCard key={product.id || product.productid} product={product} />
      ))}
    </div>
  )
}

interface Order {
  orderId: string
  orderDate: string
  totalAmount: number
  discountAmount: number
  deliveryCost: number
  status: string
  deliveryType: string
  deliveryNotes?: string
  items: Array<{
    productId: number
    variantId: number | null
    name: string
    sku: string
    properties?: Record<string, string>
    quantity: number
    price: number
    totalPrice: number
  }>
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading, logout, updateUser } = useAuth()
  const { language } = useLanguage()
  const t = translations[language]
  const [isAdmin, setIsAdmin] = useState(false)
  
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'favorites'>('orders')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Profile edit states
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: ''
  })
  
  // Password change states
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [isUpdating, setIsUpdating] = useState(false)
  
  // Delivery preferences states
  const [isEditingDelivery, setIsEditingDelivery] = useState(false)
  const [deliveryData, setDeliveryData] = useState({
    preferredDeliveryType: 'office' as 'office' | 'address' | 'econtomat',
    preferredEcontOfficeId: '',
    preferredCity: '',
    preferredStreet: '',
    preferredStreetNumber: '',
    preferredEntrance: '',
    preferredFloor: '',
    preferredApartment: ''
  })
  const [cities, setCities] = useState<CityOption[]>([])
  const [econtOffices, setEcontOffices] = useState<EcontOfficesData | null>(null)
  const [selectedOffice, setSelectedOffice] = useState<EcontOffice | null>(null)
  const [showCityDropdown, setShowCityDropdown] = useState<boolean>(false)
  const cityDropdownRef = useRef<HTMLDivElement>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/user')
    }
  }, [isAuthenticated, authLoading, router])

  // Check for tab query parameter
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const tab = urlParams.get('tab')
      if (tab === 'favorites') {
        setActiveTab('favorites')
      }
    }
  }, [])

  // Initialize profile data when user changes
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      })
      setDeliveryData({
        preferredDeliveryType: (user.preferredDeliveryType as 'office' | 'address' | 'econtomat') || 'office',
        preferredEcontOfficeId: user.preferredEcontOfficeId || '',
        preferredCity: user.preferredCity || '',
        preferredStreet: user.preferredStreet || '',
        preferredStreetNumber: user.preferredStreetNumber || '',
        preferredEntrance: user.preferredEntrance || '',
        preferredFloor: user.preferredFloor || '',
        preferredApartment: user.preferredApartment || ''
      })
    }
  }, [user])

  // Fetch user data on mount
  useEffect(() => {
    if (user && isAuthenticated) {
      fetchUserData()
      loadCities()
      loadEcontOffices()
    }
  }, [user, isAuthenticated])

  // Load cities data
  const loadCities = async () => {
    const bulgarianCities: CityOption[] = [
      { name: 'Пловдив', postcode: '4000', displayName: 'Пловдив [4000]' },
      { name: 'Варна', postcode: '9000', displayName: 'Варна [9000]' },
      { name: 'Бургас', postcode: '8000', displayName: 'Бургас [8000]' },
      { name: 'Русе', postcode: '7000', displayName: 'Русе [7000]' },
      { name: 'Стара Загора', postcode: '6000', displayName: 'Стара Загора [6000]' },
      { name: 'Плевен', postcode: '5800', displayName: 'Плевен [5800]' },
      { name: 'Сливен', postcode: '8800', displayName: 'Сливен [8800]' },
      { name: 'Добрич', postcode: '9300', displayName: 'Добрич [9300]' },
      { name: 'Шумен', postcode: '9700', displayName: 'Шумен [9700]' },
      { name: 'Перник', postcode: '2300', displayName: 'Перник [2300]' },
      { name: 'Хасково', postcode: '6300', displayName: 'Хасково [6300]' },
      { name: 'Ямбол', postcode: '8600', displayName: 'Ямбол [8600]' },
      { name: 'Пазарджик', postcode: '4400', displayName: 'Пазарджик [4400]' },
      { name: 'Благоевград', postcode: '2700', displayName: 'Благоевград [2700]' },
      { name: 'Велико Търново', postcode: '5000', displayName: 'Велико Търново [5000]' },
      { name: 'Враца', postcode: '3000', displayName: 'Враца [3000]' },
      { name: 'Габрово', postcode: '5300', displayName: 'Габрово [5300]' },
      { name: 'Асеновград', postcode: '4230', displayName: 'Асеновград [4230]' },
      { name: 'Видин', postcode: '3700', displayName: 'Видин [3700]' },
      { name: 'Кърджали', postcode: '6600', displayName: 'Кърджали [6600]' },
      { name: 'Кюстендил', postcode: '2500', displayName: 'Кюстендил [2500]' },
      { name: 'Ловеч', postcode: '5500', displayName: 'Ловеч [5500]' },
      { name: 'Монтана', postcode: '3400', displayName: 'Монтана [3400]' },
      { name: 'Търговище', postcode: '7700', displayName: 'Търговище [7700]' },
      { name: 'Разград', postcode: '7200', displayName: 'Разград [7200]' },
      { name: 'Силистра', postcode: '7500', displayName: 'Силистра [7500]' },
      { name: 'Смолян', postcode: '4700', displayName: 'Смолян [4700]' }
    ]
    setCities(bulgarianCities)
  }

  // Load Econt offices data
  const loadEcontOffices = async () => {
    try {
      const response = await fetch('/data/econt-offices.json')
      const data: EcontOfficesData = await response.json()
      setEcontOffices(data)
    } catch (error) {
      console.error('Failed to load Econt offices:', error)
    }
  }

  // Update selected office when city or office ID changes
  useEffect(() => {
    if (econtOffices && deliveryData.preferredCity && deliveryData.preferredEcontOfficeId) {
      // Try to find the city in Econt offices - handle both display name format and plain city name
      let cityName = deliveryData.preferredCity
      
      // If city is in display format like "Пловдив [4000]", extract just the city name
      const displayNameMatch = cityName.match(/^(.+?)\s*\[/)
      if (displayNameMatch) {
        cityName = displayNameMatch[1].trim()
      }
      
      // Try exact match first
      let cityOffices = econtOffices.officesByCity[cityName] || []
      
      // If no offices found, try to find by partial match
      if (cityOffices.length === 0) {
        const matchingCity = econtOffices.cities.find(c => 
          c.toLowerCase() === cityName.toLowerCase() ||
          c.toLowerCase().includes(cityName.toLowerCase()) ||
          cityName.toLowerCase().includes(c.toLowerCase())
        )
        if (matchingCity) {
          cityOffices = econtOffices.officesByCity[matchingCity] || []
        }
      }
      
      // Find the office by ID
      const office = cityOffices.find(o => o.id === deliveryData.preferredEcontOfficeId)
      setSelectedOffice(office || null)
    } else {
      setSelectedOffice(null)
    }
  }, [econtOffices, deliveryData.preferredCity, deliveryData.preferredEcontOfficeId])

  // Handle city change
  const handleCityChange = (city: string) => {
    setDeliveryData(prev => ({ ...prev, preferredCity: city, preferredEcontOfficeId: '' }))
    setSelectedOffice(null)
    setShowCityDropdown(false)
  }

  // Handle office selection
  const handleOfficeSelect = (officeId: string) => {
    setDeliveryData(prev => ({ ...prev, preferredEcontOfficeId: officeId }))
    
    if (econtOffices && deliveryData.preferredCity) {
      const cityOffices = econtOffices.officesByCity[deliveryData.preferredCity] || []
      const office = cityOffices.find(o => o.id === officeId)
      setSelectedOffice(office || null)
    }
  }

  // Close city dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target as Node)) {
        setShowCityDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const fetchUserData = async () => {
    if (!user) return
    
    try {
      // Fetch user's orders
      const ordersResponse = await fetch(`/api/user/orders?userId=${user.id}`)
      const ordersData = await ordersResponse.json()
      
      if (ordersResponse.ok) {
        const sortedOrders = (ordersData.orders || []).sort((a: Order, b: Order) => 
          new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
        )
        setOrders(sortedOrders)
        console.log('Orders loaded:', sortedOrders.length)
      } else {
        console.error('Error fetching orders:', ordersData.error || 'Unknown error')
        setError(ordersData.error || (language === 'bg' ? 'Грешка при зареждане на поръчките' : 'Error loading orders'))
      }
    } catch (err) {
      console.error('Error fetching user data:', err)
      setError(language === 'bg' ? 'Грешка при зареждане на поръчките' : 'Error loading orders')
    }
  }

  const handleRefreshOrders = async () => {
    if (!user) return
    
    try {
      setIsRefreshing(true)
      await fetchUserData()
    } finally {
      setIsRefreshing(false)
    }
  }

  // Translate order status
  const translateStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      'pending': language === 'bg' ? 'В очакване' : 'Pending',
      'confirmed': language === 'bg' ? 'Потвърдена' : 'Confirmed',
      'shipped': language === 'bg' ? 'Изпратена' : 'Shipped',
      'delivered': language === 'bg' ? 'Доставена' : 'Delivered',
      'cancelled': language === 'bg' ? 'Отказана' : 'Cancelled'
    }
    return statusMap[status.toLowerCase()] || status
  }

  // Handle order card click
  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order)
    setIsModalOpen(true)
  }

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedOrder(null)
  }

  // Handle Escape key to close modal
  useEffect(() => {
    if (!isModalOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false)
        setSelectedOrder(null)
      }
    }

    document.addEventListener('keydown', handleEscape)
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isModalOpen])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      logout()
      router.push('/user')
    }
  }

  const handleEditProfile = () => {
    setIsEditingProfile(true)
    setError('')
    setSuccess('')
  }

  const handleCancelEdit = () => {
    setIsEditingProfile(false)
    setError('')
    setSuccess('')
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      })
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setIsUpdating(true)
    setError('')
    setSuccess('')
    
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          name: profileData.name,
          email: profileData.email,
          phone: profileData.phone
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || (language === 'bg' ? 'Грешка при обновяване на профила' : 'Error updating profile'))
      }
      
      setSuccess(language === 'bg' ? 'Профилът е обновен успешно!' : 'Profile updated successfully!')
      setIsEditingProfile(false)
      
      // Update user context with new data
      updateUser({
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone
      })
      
    } catch (err: any) {
      setError(err.message || (language === 'bg' ? 'Грешка при обновяване на профила' : 'Error updating profile'))
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeliveryUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setIsUpdating(true)
    setError('')
    setSuccess('')
    
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          preferredDeliveryType: deliveryData.preferredDeliveryType,
          preferredEcontOfficeId: deliveryData.preferredEcontOfficeId || null,
          preferredCity: deliveryData.preferredCity || null,
          preferredStreet: deliveryData.preferredStreet || null,
          preferredStreetNumber: deliveryData.preferredStreetNumber || null,
          preferredEntrance: deliveryData.preferredEntrance || null,
          preferredFloor: deliveryData.preferredFloor || null,
          preferredApartment: deliveryData.preferredApartment || null
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || (language === 'bg' ? 'Грешка при обновяване на предпочитанията' : 'Error updating preferences'))
      }
      
      setSuccess(language === 'bg' ? 'Предпочитанията са обновени успешно!' : 'Preferences updated successfully!')
      setIsEditingDelivery(false)
      
      // Update user context with new data
      updateUser({
        preferredDeliveryType: deliveryData.preferredDeliveryType,
        preferredEcontOfficeId: deliveryData.preferredEcontOfficeId || undefined,
        preferredCity: deliveryData.preferredCity || undefined,
        preferredStreet: deliveryData.preferredStreet || undefined,
        preferredStreetNumber: deliveryData.preferredStreetNumber || undefined,
        preferredEntrance: deliveryData.preferredEntrance || undefined,
        preferredFloor: deliveryData.preferredFloor || undefined,
        preferredApartment: deliveryData.preferredApartment || undefined
      })
      
    } catch (err: any) {
      setError(err.message || (language === 'bg' ? 'Грешка при обновяване на предпочитанията' : 'Error updating preferences'))
    } finally {
      setIsUpdating(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError(language === 'bg' ? 'Новите пароли не съвпадат' : 'New passwords do not match')
      return
    }
    
    if (passwordData.newPassword.length < 8) {
      setError(language === 'bg' ? 'Паролата трябва да е поне 8 символа дълга' : 'Password must be at least 8 characters long')
      return
    }
    
    setIsUpdating(true)
    setError('')
    setSuccess('')
    
    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || (language === 'bg' ? 'Грешка при промяна на паролата' : 'Error changing password'))
      }
      
      setSuccess(language === 'bg' ? 'Паролата е променена успешно!' : 'Password changed successfully!')
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      
    } catch (err: any) {
      setError(err.message || (language === 'bg' ? 'Грешка при промяна на паролата' : 'Error changing password'))
    } finally {
      setIsUpdating(false)
    }
  }

  if (authLoading) {
    return (
      <>
        <Header isAdmin={isAdmin} setIsAdmin={setIsAdmin} />
        <main className={styles.dashboardPage}>
          <div className={styles.container}>
            <div className={styles.loading}>Loading...</div>
          </div>
        </main>
        <Footer />
        <CartDrawer />
      </>
    )
  }

  if (!user || !isAuthenticated) {
    return null
  }

  return (
    <>
      <Header isAdmin={isAdmin} setIsAdmin={setIsAdmin} />
      <main className={styles.dashboardPage}>
      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.userInfo}>
            <div>
              <h1>
                {language === 'bg' 
                  ? `Добре дошли обратно, ${user.name}!`
                  : `Welcome back, ${user.name}!`}
              </h1>
              <p>{user.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            <LogOut size={20} />
            {language === 'bg' ? 'Изход' : 'Logout'}
          </button>
        </header>

        {/* Navigation Tabs */}
        <nav className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'orders' ? styles.active : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <Package size={20} />
            {language === 'bg' ? 'Поръчки' : 'Orders'}
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'profile' ? styles.active : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={20} />
            {language === 'bg' ? 'Профил' : 'Profile'}
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'favorites' ? styles.active : ''}`}
            onClick={() => setActiveTab('favorites')}
          >
            <Heart size={20} />
            {t.myFavorites || (language === 'bg' ? 'Любими' : 'Favorites')}
          </button>
        </nav>

        {/* Error and Success Messages */}
        {error && <div className={styles.errorMessage}>{error}</div>}
        {success && <div className={styles.successMessage}>{success}</div>}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className={styles.tabContent}>
            <section className={styles.ordersSection}>
              <div className={styles.sectionHeader}>
                <Package className={styles.sectionIcon} size={24} />
                <h2>{language === 'bg' ? 'История на поръчките' : 'Order History'}</h2>
                <button
                  onClick={handleRefreshOrders}
                  disabled={isRefreshing}
                  className={styles.refreshButton}
                  title={language === 'bg' ? 'Обнови поръчките' : 'Refresh orders'}
                >
                  <RefreshCw size={18} className={isRefreshing ? styles.spinning : ''} />
                </button>
              </div>
              {orders.length > 0 ? (
                <div className={styles.ordersList}>
                  {orders.map((order) => (
                    <div 
                      key={order.orderId} 
                      className={styles.orderCard}
                      onClick={() => handleOrderClick(order)}
                    >
                      <div className={styles.orderHeader}>
                        <div>
                          <h3>
                            {language === 'bg' ? 'Поръчка #' : 'Order #'}{order.orderId}
                          </h3>
                          <p className={styles.orderDate}>
                            {new Date(order.orderDate).toLocaleDateString(
                              language === 'bg' ? 'bg-BG' : 'en-US',
                              { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }
                            )}
                          </p>
                          <p className={styles.orderStatus}>
                            {language === 'bg' ? 'Статус: ' : 'Status: '}
                            <span className={styles.statusBadge}>{translateStatus(order.status)}</span>
                          </p>
                        </div>
                        <div className={styles.orderTotal}>
                          {order.totalAmount.toFixed(2)} {language === 'bg' ? 'лв.' : 'BGN'}
                        </div>
                      </div>
                      <div className={styles.orderItems}>
                        {order.items.slice(0, 3).map((item, index) => (
                          <div key={index} className={styles.orderItem}>
                            <span className={styles.itemName}>{item.name}</span>
                            <span className={styles.itemQuantity}>x{item.quantity}</span>
                            <span className={styles.itemPrice}>{item.totalPrice.toFixed(2)} {language === 'bg' ? 'лв.' : 'BGN'}</span>
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <p className={styles.moreItems}>
                            +{order.items.length - 3} {language === 'bg' ? 'още продукти' : 'more items'}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <Package size={48} className={styles.emptyIcon} />
                  <h3>{language === 'bg' ? 'Все още нямате поръчки' : 'No orders yet'}</h3>
                  <p>
                    {language === 'bg' 
                      ? 'Започнете първата си поръчка и ще я покажем тук!'
                      : "Start your first order and we'll show it here!"}
                  </p>
                  <button 
                    onClick={() => router.push('/products')}
                    className={styles.primaryBtn}
                  >
                    {language === 'bg' ? 'Разгледайте продуктите' : 'Browse Products'}
                  </button>
                </div>
              )}
            </section>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className={styles.tabContent}>
            {/* Profile Information */}
            <section className={styles.profileSection}>
              <div className={styles.sectionHeader}>
                <User className={styles.sectionIcon} size={24} />
                <h2>{language === 'bg' ? 'Лична информация' : 'Personal Information'}</h2>
                {!isEditingProfile && (
                  <button 
                    onClick={handleEditProfile}
                    className={styles.editButton}
                  >
                    <Edit3 size={16} />
                    {language === 'bg' ? 'Редактирай' : 'Edit'}
                  </button>
                )}
              </div>
              
              {!isEditingProfile ? (
                <div className={styles.profileInfo}>
                  <div className={styles.infoRow}>
                    <label>{language === 'bg' ? 'Име:' : 'Name:'}</label>
                    <span>{user.name}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <label>{language === 'bg' ? 'Имейл:' : 'Email:'}</label>
                    <span>{user.email}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <label>{language === 'bg' ? 'Телефон:' : 'Phone:'}</label>
                    <span>{user.phone || (language === 'bg' ? 'Не е предоставен' : 'Not provided')}</span>
                  </div>
                  {user.created_at && (
                    <div className={styles.infoRow}>
                      <label>{language === 'bg' ? 'Член от:' : 'Member since:'}</label>
                      <span>
                        {new Date(user.created_at).toLocaleDateString(
                          language === 'bg' ? 'bg-BG' : 'en-US',
                          { year: 'numeric', month: 'long', day: 'numeric' }
                        )}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleProfileUpdate} className={styles.form}>
                  <div className={styles.formGroup}>
                    <label htmlFor="profileName">{language === 'bg' ? 'Име' : 'Name'}</label>
                    <input
                      type="text"
                      id="profileName"
                      value={profileData.name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="profileEmail">{language === 'bg' ? 'Имейл' : 'Email'}</label>
                    <input
                      type="email"
                      id="profileEmail"
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="profilePhone">{language === 'bg' ? 'Телефон' : 'Phone'}</label>
                    <input
                      type="tel"
                      id="profilePhone"
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder={language === 'bg' ? '0888123456 или +359888123456' : '0888123456 or +359888123456'}
                      required
                    />
                  </div>
                  
                  <div className={styles.formActions}>
                    <button 
                      type="button"
                      onClick={handleCancelEdit}
                      className={styles.cancelButton}
                      disabled={isUpdating}
                    >
                      {language === 'bg' ? 'Отказ' : 'Cancel'}
                    </button>
                    <button 
                      type="submit" 
                      className={styles.primaryBtn}
                      disabled={isUpdating}
                    >
                      {isUpdating 
                        ? (language === 'bg' ? 'Запазване...' : 'Saving...')
                        : (language === 'bg' ? 'Запази промените' : 'Save changes')}
                    </button>
                  </div>
                </form>
              )}
            </section>

            {/* Delivery Preferences */}
            <section className={styles.settingsSection}>
              <div className={styles.sectionHeader}>
                <Truck className={styles.sectionIcon} size={24} />
                <h2>{language === 'bg' ? 'Предпочитания за доставка' : 'Delivery Preferences'}</h2>
                {!isEditingDelivery && (
                  <button 
                    onClick={() => setIsEditingDelivery(true)}
                    className={styles.editButton}
                  >
                    <Edit3 size={16} />
                    {language === 'bg' ? 'Редактирай' : 'Edit'}
                  </button>
                )}
              </div>
              
              {!isEditingDelivery ? (
                <div className={styles.profileInfo}>
                  <div className={styles.infoRow}>
                    <label>{language === 'bg' ? 'Тип доставка:' : 'Delivery Type:'}</label>
                    <span>
                      {deliveryData.preferredDeliveryType === 'office' 
                        ? (language === 'bg' ? 'Офис' : 'Office')
                        : deliveryData.preferredDeliveryType === 'address'
                        ? (language === 'bg' ? 'Адрес' : 'Address')
                        : (language === 'bg' ? 'Еконтомат' : 'Econtomat')}
                    </span>
                  </div>
                  {deliveryData.preferredCity && (
                    <div className={styles.infoRow}>
                      <label>{language === 'bg' ? 'Град:' : 'City:'}</label>
                      <span>{deliveryData.preferredCity}</span>
                    </div>
                  )}
                  {deliveryData.preferredDeliveryType === 'office' && deliveryData.preferredEcontOfficeId && (
                    <div className={styles.infoRow}>
                      <label>{language === 'bg' ? 'Еконт офис:' : 'Econt Office:'}</label>
                      <span>
                        {selectedOffice ? selectedOffice.name : deliveryData.preferredEcontOfficeId}
                      </span>
                    </div>
                  )}
                  {deliveryData.preferredDeliveryType === 'office' && selectedOffice && (
                    <div className={styles.infoRow}>
                      <label>{language === 'bg' ? 'Адрес на офис:' : 'Office Address:'}</label>
                      <span>{selectedOffice.address}</span>
                    </div>
                  )}
                  {deliveryData.preferredDeliveryType === 'office' && selectedOffice && (
                    <div className={styles.infoRow}>
                      <label>{language === 'bg' ? 'Работно време:' : 'Working Hours:'}</label>
                      <span>{selectedOffice.workingHours}</span>
                    </div>
                  )}
                  {deliveryData.preferredDeliveryType === 'address' && (
                    <>
                      {deliveryData.preferredStreet && (
                        <div className={styles.infoRow}>
                          <label>{language === 'bg' ? 'Улица:' : 'Street:'}</label>
                          <span>{deliveryData.preferredStreet}</span>
                        </div>
                      )}
                      {deliveryData.preferredStreetNumber && (
                        <div className={styles.infoRow}>
                          <label>{language === 'bg' ? 'Номер:' : 'Number:'}</label>
                          <span>{deliveryData.preferredStreetNumber}</span>
                        </div>
                      )}
                      {deliveryData.preferredEntrance && (
                        <div className={styles.infoRow}>
                          <label>{language === 'bg' ? 'Вход:' : 'Entrance:'}</label>
                          <span>{deliveryData.preferredEntrance}</span>
                        </div>
                      )}
                      {deliveryData.preferredFloor && (
                        <div className={styles.infoRow}>
                          <label>{language === 'bg' ? 'Етаж:' : 'Floor:'}</label>
                          <span>{deliveryData.preferredFloor}</span>
                        </div>
                      )}
                      {deliveryData.preferredApartment && (
                        <div className={styles.infoRow}>
                          <label>{language === 'bg' ? 'Апартамент:' : 'Apartment:'}</label>
                          <span>{deliveryData.preferredApartment}</span>
                        </div>
                      )}
                    </>
                  )}
                  {!deliveryData.preferredCity && (
                    <p className={styles.emptyState}>
                      {language === 'bg' ? 'Няма запазени предпочитания за доставка' : 'No delivery preferences saved'}
                    </p>
                  )}
                </div>
              ) : (
                <form onSubmit={handleDeliveryUpdate} className={styles.form}>
                  <div className={styles.formGroup}>
                    <label>{language === 'bg' ? 'Тип доставка' : 'Delivery Type'}</label>
                    <select
                      value={deliveryData.preferredDeliveryType}
                      onChange={(e) => {
                        const newType = e.target.value as 'office' | 'address' | 'econtomat'
                        setDeliveryData(prev => ({ 
                          ...prev, 
                          preferredDeliveryType: newType,
                          preferredEcontOfficeId: newType !== 'office' ? '' : prev.preferredEcontOfficeId
                        }))
                      }}
                    >
                      <option value="office">{language === 'bg' ? 'Офис' : 'Office'}</option>
                      <option value="address">{language === 'bg' ? 'Адрес' : 'Address'}</option>
                      <option value="econtomat" disabled>{language === 'bg' ? 'Еконтомат (Неактивен)' : 'Econtomat (Disabled)'}</option>
                    </select>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>{language === 'bg' ? 'Град' : 'City'}</label>
                    <div className="relative" ref={cityDropdownRef}>
                      <input
                        type="text"
                        value={deliveryData.preferredCity}
                        onChange={(e) => {
                          const value = e.target.value
                          setDeliveryData(prev => ({ ...prev, preferredCity: value, preferredEcontOfficeId: '' }))
                          setShowCityDropdown(true)
                          setSelectedOffice(null)
                        }}
                        onFocus={() => setShowCityDropdown(true)}
                        placeholder={language === 'bg' ? 'Изберете град' : 'Select city'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {showCityDropdown && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {/* Show Econt cities if office delivery is selected and data is loaded */}
                          {deliveryData.preferredDeliveryType === 'office' && econtOffices ? (
                            econtOffices.cities
                              .filter((city) => 
                                city.toLowerCase().includes((deliveryData.preferredCity || '').toLowerCase())
                              )
                              .map((city) => (
                                <button
                                  key={city}
                                  type="button"
                                  onClick={() => handleCityChange(city)}
                                  className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                                >
                                  {city}
                                </button>
                              ))
                          ) : (
                            cities
                              .filter((city) => 
                                city.name.toLowerCase().includes((deliveryData.preferredCity || '').toLowerCase()) ||
                                city.displayName.toLowerCase().includes((deliveryData.preferredCity || '').toLowerCase()) ||
                                city.postcode.includes(deliveryData.preferredCity || '')
                              )
                              .map((city) => (
                                <button
                                  key={city.displayName}
                                  type="button"
                                  onClick={() => handleCityChange(city.displayName)}
                                  className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                                >
                                  {city.displayName}
                                </button>
                              ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {deliveryData.preferredDeliveryType === 'office' && deliveryData.preferredCity && econtOffices && (
                    <div className={styles.formGroup}>
                      <label>{language === 'bg' ? 'Еконт офис' : 'Econt Office'}</label>
                      <select
                        value={deliveryData.preferredEcontOfficeId || ''}
                        onChange={(e) => handleOfficeSelect(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">{language === 'bg' ? 'Изберете офис' : 'Select office'}</option>
                        {(econtOffices.officesByCity[deliveryData.preferredCity] || []).map((office) => (
                          <option key={office.id} value={office.id}>
                            {office.name}
                          </option>
                        ))}
                      </select>
                      {selectedOffice && (
                        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                          <div className="space-y-1 text-sm">
                            <div>
                              <span className="font-medium">{language === 'bg' ? 'Адрес:' : 'Address:'}</span>
                              <p>{selectedOffice.address}</p>
                            </div>
                            <div>
                              <span className="font-medium">{language === 'bg' ? 'Работно време:' : 'Working Hours:'}</span>
                              <p>{selectedOffice.workingHours}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {deliveryData.preferredDeliveryType === 'address' && (
                    <>
                      <div className={styles.formGroup}>
                        <label>{language === 'bg' ? 'Улица' : 'Street'}</label>
                        <input
                          type="text"
                          value={deliveryData.preferredStreet}
                          onChange={(e) => setDeliveryData(prev => ({ ...prev, preferredStreet: e.target.value }))}
                          placeholder={language === 'bg' ? 'ул. Васил Левски' : 'Vasil Levski St'}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>{language === 'bg' ? 'Номер' : 'Street Number'}</label>
                        <input
                          type="text"
                          value={deliveryData.preferredStreetNumber}
                          onChange={(e) => setDeliveryData(prev => ({ ...prev, preferredStreetNumber: e.target.value }))}
                          placeholder="123"
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>{language === 'bg' ? 'Вход' : 'Entrance'}</label>
                        <input
                          type="text"
                          value={deliveryData.preferredEntrance}
                          onChange={(e) => setDeliveryData(prev => ({ ...prev, preferredEntrance: e.target.value }))}
                          placeholder="A"
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>{language === 'bg' ? 'Етаж' : 'Floor'}</label>
                        <input
                          type="text"
                          value={deliveryData.preferredFloor}
                          onChange={(e) => setDeliveryData(prev => ({ ...prev, preferredFloor: e.target.value }))}
                          placeholder="5"
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>{language === 'bg' ? 'Апартамент' : 'Apartment'}</label>
                        <input
                          type="text"
                          value={deliveryData.preferredApartment}
                          onChange={(e) => setDeliveryData(prev => ({ ...prev, preferredApartment: e.target.value }))}
                          placeholder="12"
                        />
                      </div>
                    </>
                  )}
                  
                  <div className={styles.formActions}>
                    <button 
                      type="button"
                      onClick={() => {
                        setIsEditingDelivery(false)
                        if (user) {
                          const resetData = {
                            preferredDeliveryType: (user.preferredDeliveryType as 'office' | 'address' | 'econtomat') || 'office',
                            preferredEcontOfficeId: user.preferredEcontOfficeId || '',
                            preferredCity: user.preferredCity || '',
                            preferredStreet: user.preferredStreet || '',
                            preferredStreetNumber: user.preferredStreetNumber || '',
                            preferredEntrance: user.preferredEntrance || '',
                            preferredFloor: user.preferredFloor || '',
                            preferredApartment: user.preferredApartment || ''
                          }
                          setDeliveryData(resetData)
                          // Reset selected office will be handled by useEffect
                        }
                      }}
                      className={styles.cancelButton}
                      disabled={isUpdating}
                    >
                      {language === 'bg' ? 'Отказ' : 'Cancel'}
                    </button>
                    <button 
                      type="submit" 
                      className={styles.primaryBtn}
                      disabled={isUpdating}
                    >
                      {isUpdating 
                        ? (language === 'bg' ? 'Запазване...' : 'Saving...')
                        : (language === 'bg' ? 'Запази промените' : 'Save changes')}
                    </button>
                  </div>
                </form>
              )}
            </section>

            {/* Change Password */}
            <section className={styles.settingsSection}>
              <div className={styles.sectionHeader}>
                <Lock className={styles.sectionIcon} size={24} />
                <h2>{language === 'bg' ? 'Промяна на парола' : 'Change Password'}</h2>
              </div>
              <form onSubmit={handlePasswordChange} className={styles.form}>
                <div className={styles.formGroup}>
                  <label htmlFor="currentPassword">
                    {language === 'bg' ? 'Текуща парола' : 'Current Password'}
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="newPassword">
                    {language === 'bg' ? 'Нова парола' : 'New Password'}
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="confirmPassword">
                    {language === 'bg' ? 'Потвърди нова парола' : 'Confirm New Password'}
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  className={styles.primaryBtn}
                  disabled={isUpdating}
                >
                  {isUpdating 
                    ? (language === 'bg' ? 'Обновяване...' : 'Updating...')
                    : (language === 'bg' ? 'Промени парола' : 'Change Password')}
                </button>
              </form>
            </section>
          </div>
        )}

        {/* Favorites Tab */}
        {activeTab === 'favorites' && (
          <div className={styles.tabContent}>
            <section className={styles.ordersSection}>
              <div className={styles.sectionHeader}>
                <Heart className={styles.sectionIcon} size={24} />
                <h2>{t.myFavorites || (language === 'bg' ? 'Моите любими' : 'My Favorites')}</h2>
              </div>
              <FavoritesList userId={user.id} language={language} />
            </section>
          </div>
        )}
      </div>
      </main>
      <Footer />
      <CartDrawer />

      {/* Order Details Modal */}
      {isModalOpen && selectedOrder && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>
                {language === 'bg' ? 'Детайли на поръчка #' : 'Order Details #'}{selectedOrder.orderId}
              </h2>
              <button 
                className={styles.modalCloseBtn}
                onClick={handleCloseModal}
                aria-label={language === 'bg' ? 'Затвори' : 'Close'}
              >
                <X size={24} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {/* Order Info */}
              <div className={styles.modalSection}>
                <div className={styles.modalInfoRow}>
                  <span className={styles.modalLabel}>{language === 'bg' ? 'Дата:' : 'Date:'}</span>
                  <span className={styles.modalValue}>
                    {new Date(selectedOrder.orderDate).toLocaleDateString(
                      language === 'bg' ? 'bg-BG' : 'en-US',
                      { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }
                    )}
                  </span>
                </div>
                <div className={styles.modalInfoRow}>
                  <span className={styles.modalLabel}>{language === 'bg' ? 'Статус:' : 'Status:'}</span>
                  <span className={styles.statusBadge}>{translateStatus(selectedOrder.status)}</span>
                </div>
                <div className={styles.modalInfoRow}>
                  <span className={styles.modalLabel}>{language === 'bg' ? 'Тип доставка:' : 'Delivery Type:'}</span>
                  <span className={styles.modalValue}>
                    {selectedOrder.deliveryType === 'office' 
                      ? (language === 'bg' ? 'Офис' : 'Office')
                      : selectedOrder.deliveryType === 'address'
                      ? (language === 'bg' ? 'Адрес' : 'Address')
                      : (language === 'bg' ? 'Еконтомат' : 'Econtomat')}
                  </span>
                </div>
                {selectedOrder.deliveryNotes && (
                  <div className={styles.modalInfoRow}>
                    <span className={styles.modalLabel}>{language === 'bg' ? 'Бележки:' : 'Notes:'}</span>
                    <span className={styles.modalValue}>{selectedOrder.deliveryNotes}</span>
                  </div>
                )}
              </div>

              {/* Order Items */}
              <div className={styles.modalSection}>
                <h3 className={styles.modalSectionTitle}>
                  {language === 'bg' ? 'Артикули' : 'Items'}
                </h3>
                <div className={styles.modalItemsList}>
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className={styles.modalItem}>
                      <div className={styles.modalItemInfo}>
                        <span className={styles.modalItemName}>{item.name}</span>
                        {item.properties && Object.keys(item.properties).length > 0 && (
                          <div className={styles.modalItemProperties}>
                            {Object.entries(item.properties).map(([propName, propValue]) => (
                              <span key={propName} className={styles.modalPropertyTag}>
                                <span className={styles.modalPropertyName}>{propName}:</span>
                                <span className={styles.modalPropertyValue}>{propValue}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className={styles.modalItemDetails}>
                        <span className={styles.modalItemQuantity}>
                          {language === 'bg' ? 'Количество:' : 'Quantity:'} {item.quantity}
                        </span>
                        <span className={styles.modalItemPrice}>
                          {item.price.toFixed(2)} {language === 'bg' ? 'лв.' : 'BGN'} {language === 'bg' ? 'x' : 'each'}
                        </span>
                        <span className={styles.modalItemTotal}>
                          {item.totalPrice.toFixed(2)} {language === 'bg' ? 'лв.' : 'BGN'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className={styles.modalSection}>
                <div className={styles.modalSummary}>
                  <div className={styles.modalSummaryRow}>
                    <span>{language === 'bg' ? 'Междинна сума:' : 'Subtotal:'}</span>
                    <span>
                      {(selectedOrder.totalAmount - selectedOrder.deliveryCost - (selectedOrder.discountAmount || 0)).toFixed(2)} {language === 'bg' ? 'лв.' : 'BGN'}
                    </span>
                  </div>
                  {selectedOrder.discountAmount > 0 && (
                    <div className={styles.modalSummaryRow}>
                      <span>{language === 'bg' ? 'Отстъпка:' : 'Discount:'}</span>
                      <span style={{ color: 'hsl(var(--success))' }}>
                        -{selectedOrder.discountAmount.toFixed(2)} {language === 'bg' ? 'лв.' : 'BGN'}
                      </span>
                    </div>
                  )}
                  <div className={styles.modalSummaryRow}>
                    <span>{language === 'bg' ? 'Доставка:' : 'Delivery:'}</span>
                    <span>{selectedOrder.deliveryCost.toFixed(2)} {language === 'bg' ? 'лв.' : 'BGN'}</span>
                  </div>
                  <div className={styles.modalSummaryRowTotal}>
                    <span>{language === 'bg' ? 'Общо:' : 'Total:'}</span>
                    <span>{selectedOrder.totalAmount.toFixed(2)} {language === 'bg' ? 'лв.' : 'BGN'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button 
                className={styles.primaryBtn}
                onClick={handleCloseModal}
              >
                {language === 'bg' ? 'Затвори' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

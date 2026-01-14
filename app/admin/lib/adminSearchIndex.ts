export interface SearchableItem {
  id: string;
  type: 'page' | 'section' | 'header' | 'field' | 'action';
  path: string;
  title: string;
  titleBg: string;
  description?: string;
  parentPath?: string;
  keywords: string[];
}

export const adminSearchIndex: SearchableItem[] = [
  // Dashboard
  {
    id: 'dashboard',
    type: 'page',
    path: '/admin',
    title: 'Dashboard',
    titleBg: 'Табло',
    description: 'Преглед на продажбите и активността',
    keywords: ['dashboard', 'overview', 'home', 'main', 'табло', 'начало']
  },
  {
    id: 'dashboard-key-metrics',
    type: 'section',
    path: '/admin',
    title: 'Key Metrics',
    titleBg: 'Ключови показатели',
    parentPath: '/admin',
    keywords: ['metrics', 'statistics', 'stats', 'key', 'показатели', 'статистика']
  },
  {
    id: 'dashboard-weekly-orders',
    type: 'section',
    path: '/admin',
    title: 'Weekly Orders Chart',
    titleBg: 'Графика на поръчките за седмицата',
    parentPath: '/admin',
    keywords: ['chart', 'orders', 'weekly', 'graph', 'графика', 'поръчки']
  },
  {
    id: 'dashboard-product-type-performance',
    type: 'section',
    path: '/admin',
    title: 'Orders by Product Type',
    titleBg: 'Поръчки по тип продукт',
    parentPath: '/admin',
    keywords: ['product type', 'performance', 'category', 'тип продукт', 'категория']
  },
  {
    id: 'dashboard-recent-orders',
    type: 'section',
    path: '/admin',
    title: 'Recent Orders',
    titleBg: 'Последни поръчки',
    parentPath: '/admin',
    keywords: ['recent', 'orders', 'latest', 'последни', 'поръчки']
  },
  {
    id: 'dashboard-top-products',
    type: 'section',
    path: '/admin',
    title: 'Top Products',
    titleBg: 'Топ продукти',
    parentPath: '/admin',
    keywords: ['top', 'products', 'best', 'selling', 'топ', 'продукти']
  },

  // Properties
  {
    id: 'properties',
    type: 'page',
    path: '/admin/properties',
    title: 'Properties',
    titleBg: 'Свойства',
    description: 'Управляване на свойствата на продуктите и техните стойности',
    keywords: ['properties', 'attributes', 'characteristics', 'свойства', 'атрибути']
  },
  {
    id: 'properties-list',
    type: 'section',
    path: '/admin/properties',
    title: 'Properties List',
    titleBg: 'Списък със свойства',
    parentPath: '/admin/properties',
    keywords: ['list', 'all', 'списък']
  },
  {
    id: 'properties-add',
    type: 'action',
    path: '/admin/properties',
    title: 'Add Property',
    titleBg: 'Добави свойство',
    parentPath: '/admin/properties',
    keywords: ['add', 'create', 'new', 'добави', 'създай']
  },
  {
    id: 'property-name',
    type: 'field',
    path: '/admin/properties',
    title: 'Property Name',
    titleBg: 'Име на свойство',
    parentPath: '/admin/properties',
    keywords: ['name', 'title', 'име']
  },
  {
    id: 'property-description',
    type: 'field',
    path: '/admin/properties',
    title: 'Description',
    titleBg: 'Описание',
    parentPath: '/admin/properties',
    keywords: ['description', 'details', 'описание']
  },
  {
    id: 'property-data-type',
    type: 'field',
    path: '/admin/properties',
    title: 'Data Type',
    titleBg: 'Тип данни',
    parentPath: '/admin/properties',
    keywords: ['data type', 'type', 'тип данни', 'тип']
  },
  {
    id: 'property-values',
    type: 'section',
    path: '/admin/properties',
    title: 'Property Values',
    titleBg: 'Стойности на свойство',
    parentPath: '/admin/properties',
    keywords: ['values', 'options', 'choices', 'стойности', 'опции']
  },
  {
    id: 'property-add-value',
    type: 'action',
    path: '/admin/properties',
    title: 'Add Property Value',
    titleBg: 'Добави стойност',
    parentPath: '/admin/properties',
    keywords: ['add value', 'new value', 'добави стойност']
  },
  {
    id: 'property-display-order',
    type: 'field',
    path: '/admin/properties',
    title: 'Display Order',
    titleBg: 'Ред на показване',
    parentPath: '/admin/properties',
    keywords: ['order', 'sort', 'display', 'ред', 'подреждане']
  },

  // Product Types
  {
    id: 'product-types',
    type: 'page',
    path: '/admin/product-types',
    title: 'Product Types',
    titleBg: 'Типове продукти',
    description: 'Управляване на категориите на продуктите',
    keywords: ['product types', 'categories', 'types', 'типове продукти', 'категории']
  },
  {
    id: 'product-types-list',
    type: 'section',
    path: '/admin/product-types',
    title: 'Product Types List',
    titleBg: 'Списък с типове продукти',
    parentPath: '/admin/product-types',
    keywords: ['list', 'all', 'списък']
  },
  {
    id: 'product-types-add',
    type: 'action',
    path: '/admin/product-types',
    title: 'Add Product Type',
    titleBg: 'Добави тип продукт',
    parentPath: '/admin/product-types',
    keywords: ['add', 'create', 'new', 'добави', 'създай']
  },
  {
    id: 'product-type-name',
    type: 'field',
    path: '/admin/product-types',
    title: 'Product Type Name',
    titleBg: 'Име на тип продукт',
    parentPath: '/admin/product-types',
    keywords: ['name', 'title', 'име']
  },
  {
    id: 'product-type-code',
    type: 'field',
    path: '/admin/product-types',
    title: 'Code',
    titleBg: 'Код',
    parentPath: '/admin/product-types',
    keywords: ['code', 'identifier', 'код']
  },
  {
    id: 'product-types-manage-properties',
    type: 'action',
    path: '/admin/product-types',
    title: 'Manage Properties',
    titleBg: 'Управлявай свойства',
    parentPath: '/admin/product-types',
    keywords: ['manage', 'properties', 'configure', 'управлявай', 'свойства']
  },

  // Products
  {
    id: 'products',
    type: 'page',
    path: '/admin/products',
    title: 'Products',
    titleBg: 'Продукти',
    description: 'Управляване на продуктите и техните варианти',
    keywords: ['products', 'items', 'goods', 'продукти', 'стоки']
  },
  {
    id: 'products-list',
    type: 'section',
    path: '/admin/products',
    title: 'Products List',
    titleBg: 'Списък с продукти',
    parentPath: '/admin/products',
    keywords: ['list', 'all', 'списък']
  },
  {
    id: 'products-add',
    type: 'action',
    path: '/admin/products',
    title: 'Add Product',
    titleBg: 'Добави продукт',
    parentPath: '/admin/products',
    keywords: ['add', 'create', 'new', 'добави', 'създай']
  },
  {
    id: 'product-name',
    type: 'field',
    path: '/admin/products',
    title: 'Product Name',
    titleBg: 'Име на продукт',
    parentPath: '/admin/products',
    keywords: ['name', 'title', 'име']
  },
  {
    id: 'product-sku',
    type: 'field',
    path: '/admin/products',
    title: 'SKU',
    titleBg: 'SKU',
    parentPath: '/admin/products',
    keywords: ['sku', 'code', 'identifier', 'код']
  },
  {
    id: 'product-description',
    type: 'field',
    path: '/admin/products',
    title: 'Description',
    titleBg: 'Описание',
    parentPath: '/admin/products',
    keywords: ['description', 'details', 'описание']
  },
  {
    id: 'product-main-category',
    type: 'field',
    path: '/admin/products',
    title: 'Main Category',
    titleBg: 'Основна категория',
    parentPath: '/admin/products',
    keywords: ['category', 'main', 'primary', 'категория', 'основна']
  },
  {
    id: 'product-type',
    type: 'field',
    path: '/admin/products',
    title: 'Product Type',
    titleBg: 'Тип продукт',
    parentPath: '/admin/products',
    keywords: ['type', 'product type', 'тип', 'тип продукт']
  },
  {
    id: 'product-featured',
    type: 'field',
    path: '/admin/products',
    title: 'Featured Product',
    titleBg: 'Избран продукт',
    parentPath: '/admin/products',
    keywords: ['featured', 'highlighted', 'promoted', 'избран', 'промотиран']
  },
  {
    id: 'product-variant-properties',
    type: 'section',
    path: '/admin/products',
    title: 'Variant Properties',
    titleBg: 'Свойства на вариантите',
    parentPath: '/admin/products',
    keywords: ['variants', 'properties', 'options', 'варианти', 'свойства']
  },
  {
    id: 'product-generate-variants',
    type: 'action',
    path: '/admin/products',
    title: 'Generate Variants',
    titleBg: 'Генерирай варианти',
    parentPath: '/admin/products',
    keywords: ['generate', 'create variants', 'генерирай', 'варианти']
  },
  {
    id: 'product-variants',
    type: 'section',
    path: '/admin/products',
    title: 'Variants',
    titleBg: 'Варианти',
    parentPath: '/admin/products',
    keywords: ['variants', 'options', 'versions', 'варианти']
  },
  {
    id: 'variant-price',
    type: 'field',
    path: '/admin/products',
    title: 'Price',
    titleBg: 'Цена',
    parentPath: '/admin/products',
    keywords: ['price', 'cost', 'amount', 'цена']
  },
  {
    id: 'variant-quantity',
    type: 'field',
    path: '/admin/products',
    title: 'Quantity',
    titleBg: 'Количество',
    parentPath: '/admin/products',
    keywords: ['quantity', 'stock', 'amount', 'количество', 'наличност']
  },
  {
    id: 'variant-image',
    type: 'field',
    path: '/admin/products',
    title: 'Image',
    titleBg: 'Изображение',
    parentPath: '/admin/products',
    keywords: ['image', 'photo', 'picture', 'изображение', 'снимка']
  },
  {
    id: 'variant-primary',
    type: 'field',
    path: '/admin/products',
    title: 'Primary Image',
    titleBg: 'Основно изображение',
    parentPath: '/admin/products',
    keywords: ['primary', 'main', 'default', 'основно']
  },

  // Sales
  {
    id: 'sales',
    type: 'page',
    path: '/admin/sales',
    title: 'Sales',
    titleBg: 'Продажби',
    description: 'Преглед и управление на продажбите',
    keywords: ['sales', 'transactions', 'revenue', 'продажби', 'транзакции']
  },

  // Customers
  {
    id: 'customers',
    type: 'page',
    path: '/admin/customers',
    title: 'Customers',
    titleBg: 'Клиенти',
    description: 'Управляване и преглед на клиентската база',
    keywords: ['customers', 'users', 'clients', 'клиенти', 'потребители']
  },
  {
    id: 'customers-total',
    type: 'section',
    path: '/admin/customers',
    title: 'Total Customers',
    titleBg: 'Общо клиенти',
    parentPath: '/admin/customers',
    keywords: ['total', 'all', 'общо']
  },
  {
    id: 'customers-active',
    type: 'section',
    path: '/admin/customers',
    title: 'Active Customers',
    titleBg: 'Активни клиенти',
    parentPath: '/admin/customers',
    keywords: ['active', 'engaged', 'активни']
  },
  {
    id: 'customer-name',
    type: 'field',
    path: '/admin/customers',
    title: 'Name',
    titleBg: 'Име',
    parentPath: '/admin/customers',
    keywords: ['name', 'име']
  },
  {
    id: 'customer-email',
    type: 'field',
    path: '/admin/customers',
    title: 'Email',
    titleBg: 'Имейл',
    parentPath: '/admin/customers',
    keywords: ['email', 'e-mail', 'имейл']
  },
  {
    id: 'customer-total-orders',
    type: 'field',
    path: '/admin/customers',
    title: 'Total Orders',
    titleBg: 'Общо поръчки',
    parentPath: '/admin/customers',
    keywords: ['orders', 'total', 'поръчки', 'общо']
  },
  {
    id: 'customer-total-spent',
    type: 'field',
    path: '/admin/customers',
    title: 'Total Spent',
    titleBg: 'Общо похарчено',
    parentPath: '/admin/customers',
    keywords: ['spent', 'revenue', 'total', 'похарчено', 'общо']
  },
  {
    id: 'customer-last-order',
    type: 'field',
    path: '/admin/customers',
    title: 'Last Order',
    titleBg: 'Последна поръчка',
    parentPath: '/admin/customers',
    keywords: ['last', 'recent', 'последна']
  },
  {
    id: 'customer-joined',
    type: 'field',
    path: '/admin/customers',
    title: 'Joined',
    titleBg: 'Регистриран',
    parentPath: '/admin/customers',
    keywords: ['joined', 'registered', 'created', 'регистриран']
  },

  // Analytics
  {
    id: 'analytics',
    type: 'page',
    path: '/admin/analytics',
    title: 'Analytics',
    titleBg: 'Доклади',
    description: 'Преглед на показателите за производителност на магазина',
    keywords: ['analytics', 'reports', 'statistics', 'доклади', 'аналитика']
  },
  {
    id: 'analytics-total-orders',
    type: 'field',
    path: '/admin/analytics',
    title: 'Total Orders',
    titleBg: 'Общо поръчки',
    parentPath: '/admin/analytics',
    keywords: ['orders', 'total', 'поръчки']
  },
  {
    id: 'analytics-total-revenue',
    type: 'field',
    path: '/admin/analytics',
    title: 'Total Revenue',
    titleBg: 'Общ приход',
    parentPath: '/admin/analytics',
    keywords: ['revenue', 'income', 'total', 'приход']
  },
  {
    id: 'analytics-total-customers',
    type: 'field',
    path: '/admin/analytics',
    title: 'Total Customers',
    titleBg: 'Общо клиенти',
    parentPath: '/admin/analytics',
    keywords: ['customers', 'total', 'клиенти']
  },
  {
    id: 'analytics-average-order-value',
    type: 'field',
    path: '/admin/analytics',
    title: 'Average Order Value',
    titleBg: 'Средна стойност на поръчка',
    parentPath: '/admin/analytics',
    keywords: ['average', 'order value', 'mean', 'средна', 'стойност']
  },

  // Visitors
  {
    id: 'visitors',
    type: 'page',
    path: '/admin/visitors',
    title: 'Visitors',
    titleBg: 'Посетители',
    description: 'Преглед на аналитиката за посетителите',
    keywords: ['visitors', 'analytics', 'traffic', 'посетители', 'трафик']
  },
  {
    id: 'visitors-summary',
    type: 'section',
    path: '/admin/visitors',
    title: 'Visitor Summary',
    titleBg: 'Обобщение на посетителите',
    parentPath: '/admin/visitors',
    keywords: ['summary', 'overview', 'обобщение']
  },
  {
    id: 'visitors-total',
    type: 'field',
    path: '/admin/visitors',
    title: 'Total Visitors',
    titleBg: 'Общо посетители',
    parentPath: '/admin/visitors',
    keywords: ['visitors', 'total', 'посетители']
  },
  {
    id: 'visitors-sessions',
    type: 'field',
    path: '/admin/visitors',
    title: 'Total Sessions',
    titleBg: 'Общо сесии',
    parentPath: '/admin/visitors',
    keywords: ['sessions', 'total', 'сесии']
  },
  {
    id: 'visitors-page-views',
    type: 'field',
    path: '/admin/visitors',
    title: 'Total Page Views',
    titleBg: 'Общо преглеждания',
    parentPath: '/admin/visitors',
    keywords: ['page views', 'views', 'преглеждания']
  },
  {
    id: 'visitors-bounce-rate',
    type: 'field',
    path: '/admin/visitors',
    title: 'Bounce Rate',
    titleBg: 'Процент на отказ',
    parentPath: '/admin/visitors',
    keywords: ['bounce rate', 'bounce', 'отказ']
  },
  {
    id: 'visitors-top-countries',
    type: 'section',
    path: '/admin/visitors',
    title: 'Top Countries',
    titleBg: 'Топ държави',
    parentPath: '/admin/visitors',
    keywords: ['countries', 'top', 'държави']
  },
  {
    id: 'visitors-device-types',
    type: 'section',
    path: '/admin/visitors',
    title: 'Device Types',
    titleBg: 'Типове устройства',
    parentPath: '/admin/visitors',
    keywords: ['devices', 'types', 'устройства']
  },
  {
    id: 'visitors-browsers',
    type: 'section',
    path: '/admin/visitors',
    title: 'Browsers',
    titleBg: 'Браузъри',
    parentPath: '/admin/visitors',
    keywords: ['browsers', 'браузъри']
  },
  {
    id: 'visitors-operating-systems',
    type: 'section',
    path: '/admin/visitors',
    title: 'Operating Systems',
    titleBg: 'Операционни системи',
    parentPath: '/admin/visitors',
    keywords: ['operating systems', 'os', 'системи']
  },
  {
    id: 'visitors-referrer-sources',
    type: 'section',
    path: '/admin/visitors',
    title: 'Referrer Sources',
    titleBg: 'Източници на трафик',
    parentPath: '/admin/visitors',
    keywords: ['referrer', 'sources', 'traffic', 'източници']
  },

  // Finance
  {
    id: 'finance',
    type: 'page',
    path: '/admin/finance',
    title: 'Finance',
    titleBg: 'Финанси',
    description: 'Преглед на финансовите данни и транзакциите',
    keywords: ['finance', 'financial', 'money', 'transactions', 'финанси', 'пари']
  },
  {
    id: 'finance-total-revenue',
    type: 'field',
    path: '/admin/finance',
    title: 'Total Revenue',
    titleBg: 'Общ приход',
    parentPath: '/admin/finance',
    keywords: ['revenue', 'income', 'total', 'приход']
  },
  {
    id: 'finance-total-orders',
    type: 'field',
    path: '/admin/finance',
    title: 'Total Orders',
    titleBg: 'Общо поръчки',
    parentPath: '/admin/finance',
    keywords: ['orders', 'total', 'поръчки']
  },
  {
    id: 'finance-average-order-value',
    type: 'field',
    path: '/admin/finance',
    title: 'Average Order Value',
    titleBg: 'Средна стойност на поръчка',
    parentPath: '/admin/finance',
    keywords: ['average', 'order value', 'средна']
  },
  {
    id: 'finance-monthly-revenue',
    type: 'field',
    path: '/admin/finance',
    title: 'Monthly Revenue',
    titleBg: 'Месечен приход',
    parentPath: '/admin/finance',
    keywords: ['monthly', 'revenue', 'месечен', 'приход']
  },
  {
    id: 'finance-pending-payments',
    type: 'field',
    path: '/admin/finance',
    title: 'Pending Payments',
    titleBg: 'Изчакващи плащания',
    parentPath: '/admin/finance',
    keywords: ['pending', 'payments', 'изчакващи']
  },
  {
    id: 'finance-net-revenue',
    type: 'field',
    path: '/admin/finance',
    title: 'Net Revenue',
    titleBg: 'Нетен приход',
    parentPath: '/admin/finance',
    keywords: ['net', 'revenue', 'нетен']
  },
  {
    id: 'finance-transactions',
    type: 'section',
    path: '/admin/finance',
    title: 'Transactions',
    titleBg: 'Транзакции',
    parentPath: '/admin/finance',
    keywords: ['transactions', 'транзакции']
  },

  // Discounts
  {
    id: 'discounts',
    type: 'page',
    path: '/admin/discounts',
    title: 'Discounts',
    titleBg: 'Отстъпки',
    description: 'Управляване на кодове за отстъпки',
    keywords: ['discounts', 'coupons', 'promo', 'codes', 'отстъпки', 'промоции']
  },
  {
    id: 'discounts-list',
    type: 'section',
    path: '/admin/discounts',
    title: 'Discounts List',
    titleBg: 'Списък с отстъпки',
    parentPath: '/admin/discounts',
    keywords: ['list', 'all', 'списък']
  },
  {
    id: 'discounts-add',
    type: 'action',
    path: '/admin/discounts',
    title: 'Add Discount',
    titleBg: 'Добави отстъпка',
    parentPath: '/admin/discounts',
    keywords: ['add', 'create', 'new', 'добави']
  },
  {
    id: 'discount-code',
    type: 'field',
    path: '/admin/discounts',
    title: 'Discount Code',
    titleBg: 'Код на отстъпка',
    parentPath: '/admin/discounts',
    keywords: ['code', 'coupon', 'код']
  },
  {
    id: 'discount-description',
    type: 'field',
    path: '/admin/discounts',
    title: 'Description',
    titleBg: 'Описание',
    parentPath: '/admin/discounts',
    keywords: ['description', 'details', 'описание']
  },
  {
    id: 'discount-type',
    type: 'field',
    path: '/admin/discounts',
    title: 'Discount Type',
    titleBg: 'Тип отстъпка',
    parentPath: '/admin/discounts',
    keywords: ['type', 'percentage', 'fixed', 'тип']
  },
  {
    id: 'discount-value',
    type: 'field',
    path: '/admin/discounts',
    title: 'Discount Value',
    titleBg: 'Стойност на отстъпка',
    parentPath: '/admin/discounts',
    keywords: ['value', 'amount', 'percentage', 'стойност']
  },
  {
    id: 'discount-active',
    type: 'field',
    path: '/admin/discounts',
    title: 'Active',
    titleBg: 'Активна',
    parentPath: '/admin/discounts',
    keywords: ['active', 'enabled', 'активна']
  },
  {
    id: 'discount-expires',
    type: 'field',
    path: '/admin/discounts',
    title: 'Expires At',
    titleBg: 'Изтича на',
    parentPath: '/admin/discounts',
    keywords: ['expires', 'expiry', 'expiration', 'изтича']
  },

  // Media
  {
    id: 'media',
    type: 'page',
    path: '/admin/media',
    title: 'Media',
    titleBg: 'Медия',
    description: 'Управляване на медийни файлове',
    keywords: ['media', 'files', 'images', 'photos', 'upload', 'медия', 'файлове', 'изображения']
  },
  {
    id: 'media-library',
    type: 'section',
    path: '/admin/media',
    title: 'Media Library',
    titleBg: 'Медийна библиотека',
    parentPath: '/admin/media',
    keywords: ['library', 'files', 'библиотека']
  },
  {
    id: 'media-upload',
    type: 'action',
    path: '/admin/media',
    title: 'Upload Media',
    titleBg: 'Качи медия',
    parentPath: '/admin/media',
    keywords: ['upload', 'add', 'качи', 'добави']
  },
  {
    id: 'media-folder',
    type: 'field',
    path: '/admin/media',
    title: 'Folder',
    titleBg: 'Папка',
    parentPath: '/admin/media',
    keywords: ['folder', 'directory', 'папка']
  },

  // Settings
  {
    id: 'settings',
    type: 'page',
    path: '/admin/settings',
    title: 'Settings',
    titleBg: 'Настройки',
    description: 'Управляване на настройките на магазина',
    keywords: ['settings', 'configuration', 'config', 'preferences', 'настройки', 'конфигурация']
  },
  {
    id: 'settings-store-information',
    type: 'section',
    path: '/admin/settings',
    title: 'Store Information',
    titleBg: 'Информация за магазина',
    parentPath: '/admin/settings',
    keywords: ['store', 'information', 'details', 'магазин', 'информация']
  },
  {
    id: 'settings-store-name',
    type: 'field',
    path: '/admin/settings',
    title: 'Store Name',
    titleBg: 'Име на магазина',
    parentPath: '/admin/settings',
    keywords: ['store name', 'name', 'име', 'магазин']
  },
  {
    id: 'settings-email',
    type: 'field',
    path: '/admin/settings',
    title: 'Email',
    titleBg: 'Имейл',
    parentPath: '/admin/settings',
    keywords: ['email', 'e-mail', 'имейл']
  },
  {
    id: 'settings-telephone',
    type: 'field',
    path: '/admin/settings',
    title: 'Telephone Number',
    titleBg: 'Телефонен номер',
    parentPath: '/admin/settings',
    keywords: ['telephone', 'phone', 'number', 'телефон']
  },
  {
    id: 'settings-year-creation',
    type: 'field',
    path: '/admin/settings',
    title: 'Year of Creation',
    titleBg: 'Година на създаване',
    parentPath: '/admin/settings',
    keywords: ['year', 'creation', 'founded', 'година', 'създаване']
  },
  {
    id: 'settings-closing-remarks',
    type: 'field',
    path: '/admin/settings',
    title: 'Closing Remarks',
    titleBg: 'Заключителни думи',
    parentPath: '/admin/settings',
    keywords: ['closing', 'remarks', 'message', 'заключителни', 'думи']
  },
  {
    id: 'settings-about-us',
    type: 'section',
    path: '/admin/settings',
    title: 'About Us Page',
    titleBg: 'Страница "За нас"',
    parentPath: '/admin/settings',
    keywords: ['about us', 'about', 'за нас']
  },
  {
    id: 'settings-about-us-photo',
    type: 'field',
    path: '/admin/settings',
    title: 'About Us Photo',
    titleBg: 'Снимка за страницата "За нас"',
    parentPath: '/admin/settings',
    keywords: ['photo', 'image', 'picture', 'снимка']
  },
  {
    id: 'settings-about-us-text',
    type: 'field',
    path: '/admin/settings',
    title: 'About Us Text',
    titleBg: 'Текст за страницата "За нас"',
    parentPath: '/admin/settings',
    keywords: ['text', 'content', 'текст']
  },
  {
    id: 'settings-logo',
    type: 'field',
    path: '/admin/settings',
    title: 'Logo',
    titleBg: 'Лого',
    parentPath: '/admin/settings',
    keywords: ['logo', 'brand', 'лого']
  },
  {
    id: 'settings-hero-image',
    type: 'field',
    path: '/admin/settings',
    title: 'Hero Image',
    titleBg: 'Hero изображение',
    parentPath: '/admin/settings',
    keywords: ['hero', 'image', 'banner', 'изображение']
  },
  {
    id: 'settings-appearance',
    type: 'section',
    path: '/admin/settings',
    title: 'Appearance',
    titleBg: 'Външен вид',
    parentPath: '/admin/settings',
    keywords: ['appearance', 'theme', 'design', 'външен вид', 'тема']
  },
  {
    id: 'settings-color-palette',
    type: 'field',
    path: '/admin/settings',
    title: 'Color Palette',
    titleBg: 'Цветова палитра',
    parentPath: '/admin/settings',
    keywords: ['color', 'palette', 'theme', 'цветова', 'палитра']
  },
  {
    id: 'settings-language',
    type: 'field',
    path: '/admin/settings',
    title: 'Language',
    titleBg: 'Език',
    parentPath: '/admin/settings',
    keywords: ['language', 'lang', 'език']
  },
  {
    id: 'settings-banner',
    type: 'section',
    path: '/admin/settings',
    title: 'Banner',
    titleBg: 'Банер',
    parentPath: '/admin/settings',
    keywords: ['banner', 'notification', 'банер']
  },
  {
    id: 'settings-banner-text',
    type: 'field',
    path: '/admin/settings',
    title: 'Banner Text',
    titleBg: 'Текст на банера',
    parentPath: '/admin/settings',
    keywords: ['banner text', 'text', 'message', 'текст']
  },
  {
    id: 'settings-banner-duration',
    type: 'field',
    path: '/admin/settings',
    title: 'Rotation Duration',
    titleBg: 'Продължителност на ротация',
    parentPath: '/admin/settings',
    keywords: ['duration', 'rotation', 'time', 'продължителност']
  },
  {
    id: 'settings-social-media',
    type: 'section',
    path: '/admin/settings',
    title: 'Social Media',
    titleBg: 'Социални мрежи',
    parentPath: '/admin/settings',
    keywords: ['social media', 'social', 'networks', 'социални', 'мрежи']
  },
  {
    id: 'settings-discord',
    type: 'field',
    path: '/admin/settings',
    title: 'Discord URL',
    titleBg: 'Discord URL',
    parentPath: '/admin/settings',
    keywords: ['discord', 'url', 'link']
  },
  {
    id: 'settings-facebook',
    type: 'field',
    path: '/admin/settings',
    title: 'Facebook URL',
    titleBg: 'Facebook URL',
    parentPath: '/admin/settings',
    keywords: ['facebook', 'url', 'link']
  },
  {
    id: 'settings-pinterest',
    type: 'field',
    path: '/admin/settings',
    title: 'Pinterest URL',
    titleBg: 'Pinterest URL',
    parentPath: '/admin/settings',
    keywords: ['pinterest', 'url', 'link']
  },
  {
    id: 'settings-youtube',
    type: 'field',
    path: '/admin/settings',
    title: 'YouTube URL',
    titleBg: 'YouTube URL',
    parentPath: '/admin/settings',
    keywords: ['youtube', 'url', 'link']
  },
  {
    id: 'settings-instagram',
    type: 'field',
    path: '/admin/settings',
    title: 'Instagram URL',
    titleBg: 'Instagram URL',
    parentPath: '/admin/settings',
    keywords: ['instagram', 'url', 'link']
  },
  {
    id: 'settings-x',
    type: 'field',
    path: '/admin/settings',
    title: 'X (Twitter) URL',
    titleBg: 'X (Twitter) URL',
    parentPath: '/admin/settings',
    keywords: ['x', 'twitter', 'url', 'link']
  },
  {
    id: 'settings-tiktok',
    type: 'field',
    path: '/admin/settings',
    title: 'TikTok URL',
    titleBg: 'TikTok URL',
    parentPath: '/admin/settings',
    keywords: ['tiktok', 'url', 'link']
  },
  {
    id: 'settings-save',
    type: 'action',
    path: '/admin/settings',
    title: 'Save Settings',
    titleBg: 'Запази настройки',
    parentPath: '/admin/settings',
    keywords: ['save', 'store', 'запази']
  },

  // Orders
  {
    id: 'orders',
    type: 'page',
    path: '/admin/orders',
    title: 'Orders',
    titleBg: 'Поръчки',
    description: 'Управляване на поръчките',
    keywords: ['orders', 'purchases', 'transactions', 'поръчки', 'покупки']
  },
  {
    id: 'orders-list',
    type: 'section',
    path: '/admin/orders',
    title: 'Orders List',
    titleBg: 'Списък с поръчки',
    parentPath: '/admin/orders',
    keywords: ['list', 'all', 'списък']
  },
  {
    id: 'order-status',
    type: 'field',
    path: '/admin/orders',
    title: 'Order Status',
    titleBg: 'Статус на поръчка',
    parentPath: '/admin/orders',
    keywords: ['status', 'state', 'статус']
  },
  {
    id: 'order-customer',
    type: 'field',
    path: '/admin/orders',
    title: 'Customer',
    titleBg: 'Клиент',
    parentPath: '/admin/orders',
    keywords: ['customer', 'client', 'клиент']
  },
  {
    id: 'order-total',
    type: 'field',
    path: '/admin/orders',
    title: 'Total',
    titleBg: 'Общо',
    parentPath: '/admin/orders',
    keywords: ['total', 'amount', 'общо']
  },
  {
    id: 'order-date',
    type: 'field',
    path: '/admin/orders',
    title: 'Date',
    titleBg: 'Дата',
    parentPath: '/admin/orders',
    keywords: ['date', 'created', 'дата']
  }
];

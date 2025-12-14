export interface Translations {
  // Navigation
  home: string;
  about: string;
  clothes: string;
  shoes: string;
  accessories: string;
  admin: string;
  exitAdmin: string;

  // Store Page
  ourCurrentStock: string;
  clothesInStock: string;
  shoesInStock: string;
  accessoriesInStock: string;
  browseDescription: string;
  allItemsInStock: string;
  all: string;
  noProductsAvailable: string;

  // Product Card
  color: string;
  size: string;
  available: string;
  pairs: string;
  pcs: string;
  inclVAT: string;
  edit: string;
  value: string;
  status: string;
  // Admin Panel
  products: string;
  manageProducts: string;
  searchPlaceholder: string;
  allCategories: string;
  allItems: string;
  visible: string;
  hidden: string;
  image: string;
  category: string;
  brand: string;
  model: string;
  qty: string;
  price: string;
  actions: string;
  noProductsFound: string;

  // Edit Modal
  editProduct: string;
  basicInfo: string;
  attributes: string;
  pricing: string;
  visibility: string;
  visibleOnWebsite: string;
  saveChanges: string;
  cancel: string;
  typePlaceholder: string;
  categoryLabel: string;
  brandLabel: string;
  modelLabel: string;
  typeLabel: string;
  colorLabel: string;
  sizeLabel: string;
  quantityLabel: string;
  priceLabel: string;

  // Footer
  contact: string;
  copyright: string;

  // Home Page
  welcomeToStore: string;
  homeDescription: string;
  shopNow: string;
  wideSelection: string;
  wideSelectionDesc: string;
  qualityAssured: string;
  qualityAssuredDesc: string;
  customerFirst: string;
  customerFirstDesc: string;
  readyToShop: string;
  readyToShopDesc: string;
  viewProducts: string;

  // About Page
  aboutUs: string;
  ourMission: string;
  missionDescription: string;
  ourValues: string;
  customerFocus: string;
  customerFocusDesc: string;
  qualityExcellence: string;
  qualityExcellenceDesc: string;
  integrity: string;
  integrityDesc: string;
  innovation: string;
  innovationDesc: string;
  getInTouch: string;
  getInTouchDesc: string;

  // Admin Panel
  dashboard: string;
  welcomeToAdmin: string;
  totalSales: string;
  fromLastMonth: string;
  weeklySales: string;
  salesByCategory: string;
  recentOrders: string;
  topProducts: string;
  productTypes: string;
  settings: string;
  backToStore: string;
  storeSettings: string;
  manageStoreSettings: string;
  storeInformation: string;
  storeName: string;
  logo: string;
  uploadLogo: string;
  logoRequirements: string;
  appearance: string;
  colorPalette: string;
  language: string;
  saveSettings: string;
  saving: string;
  settingsSaved: string;
  errorSavingSettings: string;
  pleaseSelectImage: string;
  fileTooLarge: string;
  errorUploadingLogo: string;
  addProduct: string;
  expressAdd: string;
  addToCart: string;
  searchByBrandModelColor: string;
  basicInformation: string;
  productAttributes: string;
  productPricing: string;
  productVisibility: string;
  saveProduct: string;
  createProduct: string;
  productName: string;
  productSKU: string;
  productDescription: string;
  productCategory: string;
  productBrand: string;
  productModel: string;
  productType: string;
  variant: string;
  primary: string;

  // Checkout
  checkout: string;
  orderNotes: string;
  orderNotesPlaceholder: string;
  firstName: string;
  lastName: string;
  telephone: string;
  email: string;
  country: string;
  city: string;
  deliveryType: string;
  deliveryOffice: string;
  deliveryAddress: string;
  deliveryEcontomat: string;
  orderSummary: string;
  total: string;
  delivery: string;
  orderTotal: string;
  placeOrder: string;
  placingOrder: string;

  // Tooltips
  tooltipDashboard: string;
  tooltipProducts: string;
  tooltipProductTypes: string;
  tooltipProperties: string;
  tooltipSettings: string;
  tooltipBackToStore: string;

  // Product Types
  addProductType: string;
  editProductType: string;

  // Properties
  addProperty: string;
  editProperty: string;
  addPropertyValue: string;
  editPropertyValue: string;
  description: string;

  // Admin Navigation
  sales: string;
  customers: string;
  discounts: string;
  finance: string;
  analytics: string;
  media: string;
  adminPanel: string;

  // Product Management
  selectAtLeastOnePropertyValue: string;
  propertyTypeNotSupportVariants: string;
  generateVariants: string;
  combinations: string;
  removeImage: string;
  setAsPrimaryImage: string;

  // Sales/Order Management
  unknownProduct: string;
  moreItems: string;
  viewAndManageOrders: string;
  searchOrders: string;
  allStatuses: string;
  pending: string;
  confirmed: string;
  shipped: string;
  delivered: string;
  cancelled: string;
  updateOrder: string;
  update: string;
  noOrdersFound: string;
  noOrdersMatchSearch: string;
  updateOrderTitle: string;
  orderDetails: string;
  orderItems: string;
  updateStatus: string;
  currentStatus: string;
  newStatus: string;
  updating: string;

  // Customers
  viewAndManageCustomers: string;
  searchCustomers: string;
  location: string;
  lastOrder: string;
  orders: string;
  totalSpent: string;
  customer: string;
  noCustomersFound: string;
  noCustomersMatchSearch: string;

  // Discounts
  manageDiscountCodes: string;
  createDiscount: string;
  searchDiscountCodes: string;
  active: string;
  inactive: string;
  percentOff: string;
  amountOff: string;
  validFrom: string;
  validUntil: string;
  used: string;
  minPurchase: string;
  validPeriod: string;
  usage: string;
  minimum: string;
  to: string;
  unlimited: string;
  noDiscountsFound: string;
  noDiscountsMatchSearch: string;

  // Finance
  financialOverview: string;
  today: string;
  thisWeek: string;
  thisMonth: string;
  thisYear: string;
  allTime: string;
  totalRevenue: string;
  vsPreviousPeriod: string;
  netRevenue: string;
  afterDeliveryCosts: string;
  totalOrders: string;
  avgOrderValue: string;
  perOrder: string;
  recentTransactions: string;
  date: string;
  orderId: string;
  type: string;
  amount: string;
  noTransactionsFound: string;

  // Analytics
  salesAnalytics: string;
  lastWeek: string;
  lastMonth: string;
  lastYear: string;
  salesOverTime: string;
  salesByStatus: string;
  ordersText: string;
  sold: string;
  noProductData: string;
  noAnalyticsData: string;

  // Media
  mediaLibrary: string;
  manageMediaFiles: string;
  grid: string;
  list: string;
  searchFiles: string;
  allFolders: string;
  root: string;
  fileSelected: string;
  filesSelected: string;
  deselectAll: string;
  selectAll: string;
  download: string;
  deleting: string;
  preview: string;
  folder: string;
  uploaded: string;
  openInNewTab: string;
  previewNotAvailable: string;
  downloadFile: string;
  noMediaFiles: string;
  noFilesMatch: string;
  uploadMedia: string;
  selectFiles: string;
  dropFilesHere: string;
  supportedFormats: string;
  uploading: string;
  uploadSuccess: string;
  uploadError: string;
  confirmDeleteFile: string;
  confirmDeleteFiles: string;
  deleteFileError: string;
  deleteFilesError: string;

  // Product Types
  loading: string;
  noProductTypesFound: string;
  confirmDeleteProductType: string;
  errorPrefix: string;
  failedToSaveProductType: string;
  failedToDeleteProductType: string;
  create: string;

  // Properties
  properties: string;
  confirmDeleteProperty: string;
  failedToSaveProperty: string;
  failedToDeleteProperty: string;
  addValue: string;
  editValue: string;
  deleteValue: string;
  noValuesDefined: string;
  confirmDeletePropertyValue: string;
  propertyValueSavedLocally: string;
  propertyValueSavedLocallyFull: string;
  dataType: string;
  text: string;
  select: string;
  number: string;
  propertyColon: string;
  valueRequired: string;
  displayOrder: string;
  lowerNumbersFirst: string;
  addValueBtn: string;
  updateValue: string;
  noPropertiesFound: string;
  propertyValues: string;
  propertyValueDeletedLocally: string;
  next: string;

  // Pagination
  previous: string;

  // Alerts/Messages
  failedToDeletePropertyValue: string;

  // General
  name: string;
  code: string;
  sku: string;
  quantity: string;
  goToStore: string;
  manageProperties: string;
  loadingProduct: string;
  productDescriptionHeading: string;
  productDetails: string;
  backTo: string;
  selectOptions: string;
  notAvailable: string;
  inStock: string;
  outOfStock: string;
}

export type Language = 'en' | 'bg';

export const translations: Record<Language, Translations> = {
  en: {
    edit: 'Edit',
    value: 'Value',
    status: 'Status',
    // Navigation
    home: 'Home',
    about: 'About',
    clothes: 'Clothes',
    shoes: 'Shoes',
    accessories: 'Accessories',
    admin: 'Admin',
    exitAdmin: 'Exit Admin',

    // Store Page
    ourCurrentStock: 'Our Current Stock',
    clothesInStock: 'Clothes in Stock',
    shoesInStock: 'Shoes in Stock',
    accessoriesInStock: 'Accessories in Stock',
    browseDescription: 'Browse our available products',
    allItemsInStock: 'All items listed here are currently in stock',
    all: 'All',
    noProductsAvailable: 'No products available',

    // Product Card
    color: 'Color',
    size: 'Size',
    available: 'Available',
    pairs: 'pairs',
    pcs: 'pcs',
    inclVAT: 'incl. VAT',

    // Admin Panel
    products: 'Products',
    manageProducts: 'Manage product visibility, details, and stock quantities',
    searchPlaceholder: 'Search by brand, model, or color...',
    allCategories: 'All Categories',
    allItems: 'All Items',
    visible: 'Visible',
    hidden: 'Hidden',
    image: 'Image',
    category: 'Category',
    brand: 'Brand',
    model: 'Model',
    qty: 'Qty',
    price: 'Price',
    actions: 'Actions',
    noProductsFound: 'No products found',

    // Edit Modal
    editProduct: 'Edit Product',
    basicInfo: 'Basic Info',
    attributes: 'Attributes',
    pricing: 'Pricing',
    visibility: 'Visibility',
    visibleOnWebsite: 'Visible on website',
    saveChanges: 'Save changes',
    cancel: 'Cancel',
    typePlaceholder: 'T-Shirt, Shirt, Blouse, etc.',
    categoryLabel: 'Category',
    brandLabel: 'Brand',
    modelLabel: 'Model',
    typeLabel: 'Type',
    colorLabel: 'Color',
    sizeLabel: 'Size',
    quantityLabel: 'Quantity',
    priceLabel: 'Price (€)',

    // Footer
    contact: 'contact@storename.com · +1 234 567 890',
    copyright: '© 2025',

    // Home Page
    welcomeToStore: 'Welcome to Our Store',
    homeDescription: 'Discover our latest collection of fashion and style',
    shopNow: 'Shop Now',
    wideSelection: 'Wide Selection',
    wideSelectionDesc: 'Browse through our extensive collection of quality products',
    qualityAssured: 'Quality Assured',
    qualityAssuredDesc: 'Every product is carefully selected for quality and style',
    customerFirst: 'Customer First',
    customerFirstDesc: 'Your satisfaction is our top priority',
    readyToShop: 'Ready to Start Shopping?',
    readyToShopDesc: 'Explore our products and find your perfect style',
    viewProducts: 'View Products',

    // About Page
    aboutUs: 'About Us',
    ourMission: 'Our Mission',
    missionDescription: 'Our mission is to provide high-quality fashion products that help our customers express their unique style and personality. We are committed to offering exceptional value, outstanding customer service, and a seamless shopping experience.',
    ourValues: 'Our Values',
    customerFocus: 'Customer Focus',
    customerFocusDesc: 'We put our customers at the heart of everything we do, ensuring their needs and satisfaction are our top priority.',
    qualityExcellence: 'Quality & Excellence',
    qualityExcellenceDesc: 'We are dedicated to maintaining the highest standards of quality in all our products and services.',
    integrity: 'Integrity',
    integrityDesc: 'We conduct our business with honesty, transparency, and ethical practices in all our interactions.',
    innovation: 'Innovation',
    innovationDesc: 'We continuously strive to improve and innovate, bringing you the latest trends and best shopping experience.',
    getInTouch: 'Get in Touch',
    getInTouchDesc: 'We would love to hear from you. If you have any questions or feedback, please don\'t hesitate to contact us.',

    // Admin Panel
    dashboard: 'Dashboard',
    welcomeToAdmin: 'Welcome to your admin dashboard',
    totalSales: 'Total Sales',
    fromLastMonth: 'from last month',
    weeklySales: 'Weekly Sales',
    salesByCategory: 'Sales by Category',
    recentOrders: 'Recent Orders',
    topProducts: 'Top Products',
    productTypes: 'Product Types',
    settings: 'Settings',
    backToStore: 'Back to Store',
    storeSettings: 'Store Settings',
    manageStoreSettings: 'Manage your store general settings',
    storeInformation: 'Store Information',
    storeName: 'Store Name',
    logo: 'Logo',
    uploadLogo: 'Upload Logo',
    logoRequirements: 'PNG, JPG up to 5MB',
    appearance: 'Appearance',
    colorPalette: 'Color Palette',
    language: 'Language',
    saveSettings: 'Save Settings',
    saving: 'Saving...',
    settingsSaved: 'Settings saved successfully',
    errorSavingSettings: 'Error saving settings',
    pleaseSelectImage: 'Please select an image file',
    fileTooLarge: 'File too large. Maximum size: 5MB',
    errorUploadingLogo: 'Error uploading logo',
    addProduct: 'Add Product',
    expressAdd: 'Express Add',
    addToCart: 'Add to Cart',
    searchByBrandModelColor: 'Search by brand, model, or color...',
    basicInformation: 'Basic Information',
    productAttributes: 'Attributes',
    productPricing: 'Pricing',
    productVisibility: 'Visibility',
    saveProduct: 'Save Product',
    createProduct: 'Create Product',
    productName: 'Product Name',
    productSKU: 'SKU',
    productDescription: 'Description',
    productCategory: 'Category',
    productBrand: 'Brand',
    productModel: 'Model',
    productType: 'Type',
    variant: 'Variant',
    primary: 'Primary',

    // Checkout
    checkout: 'Checkout',
    orderNotes: 'Order Notes',
    orderNotesPlaceholder: 'Any special instructions for your order...',
    firstName: 'First Name',
    lastName: 'Last Name',
    telephone: 'Telephone',
    email: 'Email',
    country: 'Country',
    city: 'City',
    deliveryType: 'Delivery Type',
    deliveryOffice: 'Econt Office',
    deliveryAddress: 'Address',
    deliveryEcontomat: 'Econtomat',
    orderSummary: 'Order Summary',
    total: 'Total',
    delivery: 'Delivery',
    orderTotal: 'Order Total',
    placeOrder: 'Place Order',
    placingOrder: 'Placing Order...',

    // Tooltips
    tooltipDashboard: 'Go to Dashboard',
    tooltipProducts: 'Manage Products',
    tooltipProductTypes: 'Manage Product Types',
    tooltipProperties: 'Manage Properties',
    tooltipSettings: 'Store Settings',
    tooltipBackToStore: 'Return to Store',

    // Admin Navigation
    sales: 'Sales',
    customers: 'Customers',
    discounts: 'Discounts',
    finance: 'Finance',
    analytics: 'Analytics',
    media: 'Media',
    adminPanel: 'Admin Panel',

    // Product Management
    selectAtLeastOnePropertyValue: 'Please select at least one property value',
    propertyTypeNotSupportVariants: 'This property type does not support variants. Add values in the Properties section.',
    generateVariants: 'Generate Variants',
    combinations: 'combinations',
    removeImage: 'Remove image',
    setAsPrimaryImage: 'Set as primary image',

  // Sales/Order Management
  unknownProduct: 'Unknown Product',
  moreItems: 'more items',
  viewAndManageOrders: 'View and manage all orders',
  searchOrders: 'Search orders...',
  allStatuses: 'All Statuses',
  pending: 'Pending',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  updateOrder: 'Update Order',
  update: 'Update',
  noOrdersFound: 'No orders found',
  noOrdersMatchSearch: 'No orders match your search',
  updateOrderTitle: 'Update Order -',
  orderDetails: 'Order Details',
  orderItems: 'Order Items',
  updateStatus: 'Update Status',
  currentStatus: 'Current Status',
  newStatus: 'New Status',
  updating: 'Updating...',

  // Customers
  viewAndManageCustomers: 'View and manage all customers',
  searchCustomers: 'Search customers by name, email, phone, or location...',
  location: 'Location',
  lastOrder: 'Last Order',
  orders: 'Orders',
  totalSpent: 'Total Spent',
  customer: 'Customer',
  noCustomersFound: 'No customers found',
  noCustomersMatchSearch: 'No customers match your search',

  // Discounts
  manageDiscountCodes: 'Manage discount codes and promotions',
  createDiscount: 'Create Discount',
  searchDiscountCodes: 'Search discount codes...',
  active: 'Active',
  inactive: 'Inactive',
  percentOff: '% off',
  amountOff: 'off',
  validFrom: 'Valid From',
  validUntil: 'Valid Until',
  used: 'Used',
  minPurchase: 'Min Purchase',
  validPeriod: 'Valid Period',
  usage: 'Usage',
  minimum: 'Min',
  to: 'to',
  unlimited: '∞',
  noDiscountsFound: 'No discounts found. Create your first discount code!',
  noDiscountsMatchSearch: 'No discounts match your search',

  // Finance
  financialOverview: 'Financial overview and transactions',
  today: 'Today',
  thisWeek: 'This Week',
  thisMonth: 'This Month',
  thisYear: 'This Year',
  allTime: 'All Time',
  totalRevenue: 'Total Revenue',
  vsPreviousPeriod: 'vs previous period',
  netRevenue: 'Net Revenue',
  afterDeliveryCosts: 'After delivery costs',
  totalOrders: 'Total Orders',
  avgOrderValue: 'Avg Order Value',
  perOrder: 'Per order',
  recentTransactions: 'Recent Transactions',
  date: 'Date',
  orderId: 'Order ID',
  type: 'Type',
  amount: 'Amount',
  noTransactionsFound: 'No transactions found for this period',

  // Analytics
  salesAnalytics: 'Sales analytics and insights',
  lastWeek: 'Last Week',
  lastMonth: 'Last Month',
  lastYear: 'Last Year',
  salesOverTime: 'Sales Over Time',
  salesByStatus: 'Sales by Status',
  ordersText: 'orders',
  sold: 'sold',
  noProductData: 'No product data available',
  noAnalyticsData: 'No analytics data available',

  // Media
  mediaLibrary: 'Media Library',
  manageMediaFiles: 'Manage all uploaded media files',
  grid: 'Grid',
  list: 'List',
  searchFiles: 'Search files...',
  allFolders: 'All Folders',
  root: 'Root',
  fileSelected: 'file selected',
  filesSelected: 'files selected',
  deselectAll: 'Deselect all',
  selectAll: 'Select all',
  download: 'Download',
  deleting: 'Deleting...',
  preview: 'Preview',
  folder: 'Folder',
  uploaded: 'Uploaded',
  openInNewTab: 'Open in new tab',
  previewNotAvailable: 'Preview not available for this file type',
  downloadFile: 'Download File',
  noMediaFiles: 'No media files found',
  noFilesMatch: 'No files match your search',
  uploadMedia: 'Upload Media',
  selectFiles: 'Select Files',
  dropFilesHere: 'Drop files here or click to select',
  supportedFormats: 'Supported formats: JPG, PNG, GIF, WebP, SVG up to 10MB each',
  uploading: 'Uploading...',
  uploadSuccess: 'File uploaded successfully',
  uploadError: 'Error uploading file',
  confirmDeleteFile: 'Are you sure you want to delete this file?',
  confirmDeleteFiles: 'Are you sure you want to delete these files?',
  deleteFileError: 'Error deleting file',
  deleteFilesError: 'Error deleting files',

  // Product Types
  loading: 'Loading...',
  noProductTypesFound: 'No product types found. Create one to get started.',
  confirmDeleteProductType: 'Are you sure you want to delete this product type?',
  errorPrefix: 'Error: ',
  failedToSaveProductType: 'Failed to save product type',
  failedToDeleteProductType: 'Failed to delete product type',

    // Pagination
    next: 'Next',
    previous: 'Previous',

    // Alerts/Messages
    propertyValueDeletedLocally: 'Property value deleted locally. Database migration needed for full functionality.',
    failedToDeletePropertyValue: 'Failed to delete property value',

    // Product Types
    addProductType: 'Add Product Type',
    editProductType: 'Edit Product Type',

    // Properties
    properties: 'Properties',
    addProperty: 'Add Property',
    editProperty: 'Edit Property',
    addPropertyValue: 'Add Property Value',
    editPropertyValue: 'Edit Property Value',
    confirmDeleteProperty: 'Are you sure you want to delete this property?',
    failedToSaveProperty: 'Failed to save property',
    failedToDeleteProperty: 'Failed to delete property',
    propertyValues: 'Property Values',
    addValue: 'Add Value',
    editValue: 'Edit Value',
    deleteValue: 'Delete Value',
    noValuesDefined: 'No values defined. Click "Add Value" to create options for this property.',
    confirmDeletePropertyValue: 'Are you sure you want to delete this property value?',
    propertyValueSavedLocally: 'Property value saved locally. Database migration needed for persistence.',
    propertyValueSavedLocallyFull: 'Property value saved locally. Database migration needed for full functionality.',
    description: 'Description',
    dataType: 'Data Type',
    text: 'Text',
    select: 'Select',
    number: 'Number',
    propertyColon: 'Property: ',
    valueRequired: 'Value *',
    displayOrder: 'Display Order',
    lowerNumbersFirst: 'Lower numbers appear first in the list',
    addValueBtn: 'Add Value',
    updateValue: 'Update Value',
    noPropertiesFound: 'No properties found. Create one to get started.',

    // General
    create: 'Create',
    name: 'Name',
    code: 'Code',
    sku: 'SKU',
    quantity: 'Quantity',
    goToStore: 'Go to Store',
    manageProperties: 'Manage Properties',
    loadingProduct: 'Loading product...',
    productDescriptionHeading: 'Product Description',
    productDetails: 'Product Details',
    backTo: 'Back to',
    selectOptions: 'Select Options',
    notAvailable: 'N/A',
    inStock: 'In Stock',
    outOfStock: 'Out of Stock'

  },

  bg: {
    edit: 'Редактиране',
    value: 'Стойност',
    status: 'Статус',
    // Navigation
    home: 'Начало',
    about: 'За нас',
    clothes: 'Дрехи',
    shoes: 'Обувки',
    accessories: 'Аксесоари',
    admin: 'Админ',
    exitAdmin: 'Изход от Админ',

    // Store Page
    ourCurrentStock: 'Нашата наличност',
    clothesInStock: 'Дрехи в наличност',
    shoesInStock: 'Обувки в наличност',
    accessoriesInStock: 'Аксесоари в наличност',
    browseDescription: 'Разгледайте наличните ни продукти',
    allItemsInStock: 'Всички артикули изброени тук са в наличност',
    all: 'Всички',
    noProductsAvailable: 'Няма налични продукти',

    // Product Card
    color: 'Цвят',
    size: 'Размер',
    available: 'Налични',
    pairs: 'чифта',
    pcs: 'бр.',
    inclVAT: 'с ДДС',

    // Admin Panel
    products: 'Продукти',
    manageProducts: 'Управление на видимостта на продуктите, детайлите и количествата на склад',
    searchPlaceholder: 'Търсене по марка, модел или цвят...',
    allCategories: 'Всички категории',
    allItems: 'Всички артикули',
    visible: 'Видим',
    hidden: 'Скрит',
    image: 'Изображение',
    category: 'Категория',
    brand: 'Марка',
    model: 'Модел',
    qty: 'Кол.',
    price: 'Цена',
    actions: 'Действия',
    noProductsFound: 'Няма намерени продукти',

    // Edit Modal
    editProduct: 'Редактиране на продукт',
    basicInfo: 'Основна информация',
    attributes: 'Атрибути',
    pricing: 'Ценообразуване',
    visibility: 'Видимост',
    visibleOnWebsite: 'Видим на уебсайта',
    saveChanges: 'Запази промените',
    cancel: 'Отказ',
    typePlaceholder: 'Тениска, Ризa, Блуза и т.н.',
    categoryLabel: 'Категория',
    brandLabel: 'Марка',
    modelLabel: 'Модел',
    typeLabel: 'Тип',
    colorLabel: 'Цвят',
    sizeLabel: 'Размер',
    quantityLabel: 'Количество',
    priceLabel: 'Цена (€)',

    // Footer
    contact: 'contact@storename.com · +359 88 123 4567',
    copyright: '© 2025',

    // Home Page
    welcomeToStore: 'Добре дошли в нашия магазин',
    homeDescription: 'Открийте нашата най-нова колекция от мода и стил',
    shopNow: 'Пазарувайте сега',
    wideSelection: 'Широк избор',
    wideSelectionDesc: 'Разгледайте нашата обширна колекция от качествени продукти',
    qualityAssured: 'Гарантирано качество',
    qualityAssuredDesc: 'Всеки продукт е внимателно избран за качество и стил',
    customerFirst: 'Клиентът на първо място',
    customerFirstDesc: 'Вашето удовлетворение е наш приоритет',
    readyToShop: 'Готови ли сте да започнете пазаруване?',
    readyToShopDesc: 'Разгледайте нашите продукти и намерете своя перфектен стил',
    viewProducts: 'Вижте продуктите',

    // About Page
    aboutUs: 'За нас',
    ourMission: 'Нашата мисия',
    missionDescription: 'Нашата мисия е да предоставяме висококачествени модни продукти, които помагат на нашите клиенти да изразят своя уникален стил и личност. Ние сме ангажирани да предлагаме изключителна стойност, отлично обслужване на клиенти и безпроблемно пазаруване.',
    ourValues: 'Нашите ценности',
    customerFocus: 'Фокус върху клиента',
    customerFocusDesc: 'Поставяме нашите клиенти в центъра на всичко, което правим, като гарантираме, че техните нужди и удовлетворение са наш приоритет.',
    qualityExcellence: 'Качество и отличност',
    qualityExcellenceDesc: 'Ние сме посветени на поддържането на най-високите стандарти за качество във всички наши продукти и услуги.',
    integrity: 'Честност',
    integrityDesc: 'Ние водим бизнеса си с честност, прозрачност и етични практики във всички наши взаимодействия.',
    innovation: 'Иновации',
    innovationDesc: 'Ние непрекъснато се стремим да подобряваме и иновациираме, като ви предлагаме най-новите тенденции и най-доброто пазаруване.',
    getInTouch: 'Свържете се с нас',
    getInTouchDesc: 'Бихме искали да чуем от вас. Ако имате въпроси или обратна връзка, моля не се колебайте да се свържете с нас.',

    // Admin Panel
    dashboard: 'Табло',
    welcomeToAdmin: 'Добре дошли в администраторското табло',
    totalSales: 'Общи продажби',
    fromLastMonth: 'от миналия месец',
    weeklySales: 'Седмични продажби',
    salesByCategory: 'Продажби по категория',
    recentOrders: 'Последни поръчки',
    topProducts: 'Топ продукти',
    productTypes: 'Типове продукти',
    settings: 'Настройки',
    backToStore: 'Обратно към магазина',
    storeSettings: 'Настройки на магазина',
    manageStoreSettings: 'Управление на общите настройки на магазина',
    storeInformation: 'Информация за магазина',
    storeName: 'Име на магазина',
    logo: 'Лого',
    uploadLogo: 'Качи лого',
    logoRequirements: 'PNG, JPG до 5MB',
    appearance: 'Външен вид',
    colorPalette: 'Цветова палитра',
    language: 'Език',
    saveSettings: 'Запази настройки',
    saving: 'Запазване...',
    settingsSaved: 'Настройките са запазени успешно',
    errorSavingSettings: 'Грешка при запазване на настройките',
    pleaseSelectImage: 'Моля изберете изображение',
    fileTooLarge: 'Файлът е твърде голям. Максимален размер: 5MB',
    errorUploadingLogo: 'Грешка при качване на лого',
    addProduct: 'Добави продукт',
    expressAdd: 'Бързо добавяне',
    addToCart: 'Добави в количката',
    searchByBrandModelColor: 'Търсене по марка, модел или цвят...',
    basicInformation: 'Основна информация',
    productAttributes: 'Атрибути',
    productPricing: 'Ценообразуване',
    productVisibility: 'Видимост',
    saveProduct: 'Запази продукт',
    createProduct: 'Създай продукт',
    productName: 'Име на продукта',
    productSKU: 'SKU',
    productDescription: 'Описание',
    productCategory: 'Категория',
    productBrand: 'Марка',
    productModel: 'Модел',
    productType: 'Тип',
    variant: 'Вариант',
    primary: 'Основен',

    // Checkout
    checkout: 'Поръчка',
    orderNotes: 'Бележки към поръчката',
    orderNotesPlaceholder: 'Специални инструкции за поръчката...',
    firstName: 'Име',
    lastName: 'Фамилия',
    telephone: 'Телефон',
    email: 'Имейл',
    country: 'Държава',
    city: 'Град',
    deliveryType: 'Тип доставка',
    deliveryOffice: 'Офис на Еконт',
    deliveryAddress: 'Адрес',
    deliveryEcontomat: 'Еконтмат',
    orderSummary: 'Обобщение на поръчката',
    total: 'Общо',
    delivery: 'Доставка',
    orderTotal: 'Крайна сума',
    placeOrder: 'Направи поръчка',
    placingOrder: 'Изпълнение на поръчка...',

    // Tooltips
    tooltipDashboard: 'Отиди в Таблото',
    tooltipProducts: 'Управление на продукти',
    tooltipProductTypes: 'Управление на типове продукти',
    tooltipProperties: 'Управление на свойства',
    tooltipSettings: 'Настройки на магазина',
    tooltipBackToStore: 'Връщане в магазина',

    // Product Types
    addProductType: 'Добави тип продукт',
    editProductType: 'Редактирай тип продукт',

  // Properties
  properties: 'Свойства',
  addProperty: 'Добави свойство',
  editProperty: 'Редактирай свойство',
  confirmDeleteProperty: 'Сигурни ли сте, че искате да изтриете това свойство?',
  failedToSaveProperty: 'Неуспешно запазване на свойство',
  failedToDeleteProperty: 'Неуспешно изтриване на свойство',
  propertyValues: 'Стойности на свойствата',
  addValue: 'Добави стойност',
  editValue: 'Редактирай стойност',
  deleteValue: 'Изтрий стойност',
  noValuesDefined: 'Няма дефинирани стойности. Кликнете "Добави стойност" за да създадете опции за това свойство.',
  addPropertyValue: 'Добави стойност на свойство',
  editPropertyValue: 'Редактирай стойност на свойство',
  confirmDeletePropertyValue: 'Сигурни ли сте, че искате да изтриете тази стойност на свойство?',
  propertyValueDeletedLocally: 'Стойността на свойството е изтрита локално. Необходима е миграция на базата данни за постоянство.',
  propertyValueSavedLocally: 'Стойността на свойството е запазена локално. Необходима е миграция на базата данни за постоянство.',
  propertyValueSavedLocallyFull: 'Стойността на свойството е запазена локално. Необходима е миграция на базата данни за пълна функционалност.',
  description: 'Описание',
  dataType: 'Тип данни',
  text: 'Текст',
  select: 'Избор',
  number: 'Число',
  propertyColon: 'Свойство: ',
  valueRequired: 'Стойност *',
  displayOrder: 'Ред на показване',
  lowerNumbersFirst: 'По-ниските числа се показват първи в списъка',
  next: 'Следваща',
  addValueBtn: 'Добави стойност',
  updateValue: 'Актуализирай стойност',
  noPropertiesFound: 'Няма намерени свойства. Създайте едно, за да започнете.',

  // Admin Navigation
  sales: 'Продажби',
  customers: 'Клиенти',
  discounts: 'Отстъпки',
  finance: 'Финанси',
  analytics: 'Анализи',
  media: 'Медия',
  adminPanel: 'Администраторски панел',

  // Product Management
  selectAtLeastOnePropertyValue: 'Моля изберете поне една стойност на свойство',
  propertyTypeNotSupportVariants: 'Този тип свойство не поддържа варианти. Добавете стойности в секцията Свойства.',
  generateVariants: 'Генерирай варианти',
  combinations: 'комбинации',
  removeImage: 'Премахни изображение',
  setAsPrimaryImage: 'Задай като основно изображение',

  unknownProduct: 'Неизвестен продукт',
  moreItems: 'още артикула',
  viewAndManageOrders: 'Преглед и управление на всички поръчки',
  searchOrders: 'Търсене на поръчки...',
  allStatuses: 'Всички статуси',
  pending: 'В очакване',
  confirmed: 'Потвърдена',
  shipped: 'Изпратена',
  delivered: 'Доставена',
  cancelled: 'Отказана',
  updateOrder: 'Актуализирай поръчка',
  update: 'Актуализирай',
  noOrdersFound: 'Няма намерени поръчки',
  noOrdersMatchSearch: 'Няма поръчки, които отговарят на търсенето',
  updateOrderTitle: 'Актуализирай поръчка -',
  orderDetails: 'Детайли на поръчката',
  orderItems: 'Артикули в поръчката',
  updateStatus: 'Актуализирай статус',
  currentStatus: 'Текущ статус',
  newStatus: 'Нов статус',
  updating: 'Актуализиране...',

  // Customers
  viewAndManageCustomers: 'Преглед и управление на всички клиенти',
  searchCustomers: 'Търсене на клиенти по име, имейл, телефон или местоположение...',
  location: 'Местоположение',
  lastOrder: 'Последна поръчка',
  orders: 'Поръчки',
  totalSpent: 'Обща сума',
  customer: 'Клиент',
  noCustomersFound: 'Няма намерени клиенти',
  noCustomersMatchSearch: 'Няма клиенти, които отговарят на търсенето',

  // Discounts
  manageDiscountCodes: 'Управление на кодове за отстъпки и промоции',
  createDiscount: 'Създай отстъпка',
  searchDiscountCodes: 'Търсене на кодове за отстъпки...',
  active: 'Активен',
  inactive: 'Неактивен',
  percentOff: '% отстъпка',
  amountOff: 'отстъпка',
  validFrom: 'Валиден от',
  validUntil: 'Валиден до',
  used: 'Използван',
  minPurchase: 'Мин. покупка',
  validPeriod: 'Период на валидност',
  usage: 'Използване',
  minimum: 'Мин',
  to: 'до',
  unlimited: '∞',
  noDiscountsFound: 'Няма намерени отстъпки. Създайте първия си код за отстъпка!',
  noDiscountsMatchSearch: 'Няма отстъпки, които отговарят на търсенето',

  // Finance
  financialOverview: 'Финансов преглед и транзакции',
  today: 'Днес',
  thisWeek: 'Тази седмица',
  thisMonth: 'Този месец',
  thisYear: 'Тази година',
  allTime: 'Цялото време',
  totalRevenue: 'Общи приходи',
  vsPreviousPeriod: 'спрямо предишния период',
  netRevenue: 'Нетни приходи',
  afterDeliveryCosts: 'След разходи за доставка',
  totalOrders: 'Общи поръчки',
  avgOrderValue: 'Средна стойност на поръчка',
  perOrder: 'На поръчка',
  recentTransactions: 'Последни транзакции',
  date: 'Дата',
  orderId: 'Номер на поръчка',
  type: 'Тип',
  amount: 'Сума',
  noTransactionsFound: 'Няма намерени транзакции за този период',

  // Analytics
  salesAnalytics: 'Анализ на продажбите и прозрения',
  lastWeek: 'Миналата седмица',
  lastMonth: 'Миналия месец',
  lastYear: 'Миналата година',
  salesOverTime: 'Продажби във времето',
  salesByStatus: 'Продажби по статус',
  ordersText: 'поръчки',
  sold: 'продадени',
  noProductData: 'Няма налични данни за продукти',
  noAnalyticsData: 'Няма налични аналитични данни',

  // Media
  mediaLibrary: 'Медийна библиотека',
  manageMediaFiles: 'Управление на всички качени медийни файлове',
  grid: 'Решетка',
  list: 'Списък',
  searchFiles: 'Търсене на файлове...',
  allFolders: 'Всички папки',
  root: 'Основна',
  fileSelected: 'файл избран',
  filesSelected: 'файла избрани',
  deselectAll: 'Отмяна на всички',
  selectAll: 'Избор на всички',
  download: 'Изтегляне',
  deleting: 'Изтриване...',
  preview: 'Преглед',
  folder: 'Папка',
  uploaded: 'Качено',
  openInNewTab: 'Отвори в нов раздел',
  previewNotAvailable: 'Прегледът не е наличен за този тип файл',
  downloadFile: 'Изтегли файл',
  noMediaFiles: 'Няма намерени медийни файлове',
  noFilesMatch: 'Няма файлове, които отговарят на търсенето',
  uploadMedia: 'Качи медия',
  selectFiles: 'Избери файлове',
  dropFilesHere: 'Пуснете файлове тук или кликнете за избор',
  supportedFormats: 'Поддържани формати: JPG, PNG, GIF, WebP, SVG до 10MB всеки',
  uploading: 'Качване...',
  uploadSuccess: 'Файлът е качен успешно',
  uploadError: 'Грешка при качване на файл',
  confirmDeleteFile: 'Сигурни ли сте, че искате да изтриете този файл?',
  confirmDeleteFiles: 'Сигурни ли сте, че искате да изтриете тези файлове?',
  deleteFileError: 'Грешка при изтриване на файл',
  deleteFilesError: 'Грешка при изтриване на файлове',

  // Properties
  previous: 'Предишна',
  failedToDeletePropertyValue: 'Неуспешно изтриване на стойност на свойство',

  // Product Types
  loading: 'Зареждане...',
  noProductTypesFound: 'Няма намерени типове продукти. Създайте един, за да започнете.',
  confirmDeleteProductType: 'Сигурни ли сте, че искате да изтриете този тип продукт?',
  errorPrefix: 'Грешка: ',
  failedToSaveProductType: 'Неуспешно запазване на типа продукт',
  failedToDeleteProductType: 'Неуспешно изтриване на типа продукт',
  name: 'Име',
  code: 'Код',
  create: 'Създай',

  // General
  sku: 'SKU',
  quantity: 'Количество',
  goToStore: 'Към магазина',
  manageProperties: 'Управление на свойства',
  loadingProduct: 'Зареждане на продукт...',
  productDescriptionHeading: 'Описание на продукта',
  productDetails: 'Детайли на продукта',
  backTo: 'Обратно към',
  selectOptions: 'Изберете опции',
  notAvailable: 'Н/Д',
  inStock: 'В наличност',
  outOfStock: 'Изчерпан'

  }
};
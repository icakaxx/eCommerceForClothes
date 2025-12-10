export interface Translations {
  // Navigation
  home: string;
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

  // Admin Panel
  dashboard: string;
  welcomeToAdmin: string;
  totalSales: string;
  totalOrders: string;
  customers: string;
  fromLastMonth: string;
  weeklySales: string;
  salesByCategory: string;
  recentOrders: string;
  topProducts: string;
  sales: string;
  productTypes: string;
  properties: string;
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
  dataType: string;
  propertyValues: string;

  // General
  name: string;
  code: string;
  sku: string;
  quantity: string;
  goToStore: string;
  manageProperties: string;
}

export type Language = 'en' | 'bg';

export const translations: Record<Language, Translations> = {
  en: {
    // Navigation
    home: 'Home',
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

    // Admin Panel
    dashboard: 'Dashboard',
    welcomeToAdmin: 'Welcome to your admin dashboard',
    totalSales: 'Total Sales',
    totalOrders: 'Total Orders',
    customers: 'Customers',
    fromLastMonth: 'from last month',
    weeklySales: 'Weekly Sales',
    salesByCategory: 'Sales by Category',
    recentOrders: 'Recent Orders',
    topProducts: 'Top Products',
    sales: 'sales',
    productTypes: 'Product Types',
    properties: 'Properties',
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

    // Product Types
    addProductType: 'Add Product Type',
    editProductType: 'Edit Product Type',

    // Properties
    addProperty: 'Add Property',
    editProperty: 'Edit Property',
    addPropertyValue: 'Add Property Value',
    editPropertyValue: 'Edit Property Value',
    description: 'Description',
    dataType: 'Data Type',
    propertyValues: 'Property Values',

    // General
    name: 'Name',
    code: 'Code',
    sku: 'SKU',
    quantity: 'Quantity',
    goToStore: 'Go to Store',
    manageProperties: 'Manage Properties'
  },

  bg: {
    // Navigation
    home: 'Начало',
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

    // Admin Panel
    dashboard: 'Табло',
    welcomeToAdmin: 'Добре дошли в администраторското табло',
    totalSales: 'Общи продажби',
    totalOrders: 'Общи поръчки',
    customers: 'Клиенти',
    fromLastMonth: 'от миналия месец',
    weeklySales: 'Седмични продажби',
    salesByCategory: 'Продажби по категория',
    recentOrders: 'Последни поръчки',
    topProducts: 'Топ продукти',
    sales: 'продажби',
    productTypes: 'Типове продукти',
    properties: 'Свойства',
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
    addProperty: 'Добави свойство',
    editProperty: 'Редактирай свойство',
    addPropertyValue: 'Добави стойност на свойство',
    editPropertyValue: 'Редактирай стойност на свойство',
    description: 'Описание',
    dataType: 'Тип данни',
    propertyValues: 'Стойности на свойствата',

    // General
    name: 'Име',
    code: 'Код',
    sku: 'SKU',
    quantity: 'Количество',
    goToStore: 'Към магазина',
    manageProperties: 'Управление на свойства'
  }
};
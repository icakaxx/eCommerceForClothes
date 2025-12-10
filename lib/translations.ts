export type Language = 'en' | 'bg';

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
  productColor: string;
  productSize: string;
  productQuantity: string;
  productPrice: string;
  selectOptions: string;
  noVariants: string;
  completed: string;
  processing: string;
  shipped: string;

  // Admin Table Headers
  name: string;
  sku: string;
  variant: string;
  quantity: string;
  primary: string;
  description: string;
  dataType: string;
  active: string;
  type: string;
  code: string;
  manageProperties: string;
  edit: string;
  delete: string;
  addNew: string;
  addProductType: string;
  editProductType: string;
  save: string;
  confirmDelete: string;
  dataTypeText: string;
  dataTypeSelect: string;
  dataTypeNumber: string;
  isActive: string;
  propertyValues: string;
  addProperty: string;
  editProperty: string;
  addPropertyValue: string;
  editPropertyValue: string;

  // Admin Tooltips
  tooltipProducts: string;
  tooltipProductTypes: string;
  tooltipProperties: string;
  tooltipSettings: string;
  tooltipBackToStore: string;
  tooltipDashboard: string;
  goToStore: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    home: 'Home',
    clothes: 'Clothes',
    shoes: 'Shoes',
    accessories: 'Accessories',
    admin: 'Admin',
    exitAdmin: 'Exit Admin',
    ourCurrentStock: 'Our Current Stock',
    clothesInStock: 'Clothes – In Stock',
    shoesInStock: 'Shoes – In Stock',
    accessoriesInStock: 'Accessories – In Stock',
    browseDescription: 'Browse our available clothes, shoes, and accessories with live quantities and prices',
    allItemsInStock: 'All items listed here are currently in stock',
    all: 'All',
    noProductsAvailable: 'No products available in this category',
    color: 'Color',
    size: 'Size',
    available: 'Available',
    pairs: 'pairs',
    pcs: 'pcs',
    inclVAT: 'incl. VAT',
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
    contact: 'contact@storename.com · +1 234 567 890',
    copyright: '© 2025',
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
    productColor: 'Color',
    productSize: 'Size',
    productQuantity: 'Quantity',
    productPrice: 'Price (€)',
    selectOptions: 'Select Options',
    noVariants: 'No variants',
    completed: 'completed',
    processing: 'processing',
    shipped: 'shipped',
    name: 'Name',
    sku: 'SKU',
    variant: 'Variant',
    quantity: 'Quantity',
    primary: 'Primary',
    description: 'Description',
    dataType: 'Data Type',
    active: 'Active',
    type: 'Type',
    code: 'Code',
    manageProperties: 'Manage Properties',
    edit: 'Edit',
    delete: 'Delete',
    addNew: 'Add New',
    addProductType: 'Add Product Type',
    editProductType: 'Edit Product Type',
    save: 'Save',
    confirmDelete: 'Are you sure you want to delete this?',
    dataTypeText: 'Text',
    dataTypeSelect: 'Select',
    dataTypeNumber: 'Number',
    isActive: 'Active',
    propertyValues: 'Values',
    addProperty: 'Add Property',
    editProperty: 'Edit Property',
    addPropertyValue: 'Add Property Value',
    editPropertyValue: 'Edit Property Value',
    tooltipProducts: 'Manage products and their variants',
    tooltipProductTypes: 'Manage product types',
    tooltipProperties: 'Manage product properties',
    tooltipSettings: 'Store settings',
    tooltipBackToStore: 'Back to store',
    tooltipDashboard: 'Dashboard',
    goToStore: 'Go to Store',
  },
  bg: {
    home: 'Начало',
    clothes: 'Дрехи',
    shoes: 'Обувки',
    accessories: 'Аксесоари',
    admin: 'Админ',
    exitAdmin: 'Изход от админ',
    ourCurrentStock: 'Нашето текущо наличност',
    clothesInStock: 'Дрехи – В наличност',
    shoesInStock: 'Обувки – В наличност',
    accessoriesInStock: 'Аксесоари – В наличност',
    browseDescription: 'Разгледайте нашите налични дрехи, обувки и аксесоари с актуални количества и цени',
    allItemsInStock: 'Всички артикули, изброени тук, са в момента налични',
    all: 'Всички',
    noProductsAvailable: 'Няма налични продукти в тази категория',
    color: 'Цвят',
    size: 'Размер',
    available: 'Налично',
    pairs: 'чифта',
    pcs: 'бр',
    inclVAT: 'вкл. ДДС',
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
    qty: 'Кол',
    price: 'Цена',
    actions: 'Действия',
    noProductsFound: 'Няма намерени продукти',
    editProduct: 'Редактиране на продукт',
    basicInfo: 'Основна информация',
    attributes: 'Атрибути',
    pricing: 'Ценообразуване',
    visibility: 'Видимост',
    visibleOnWebsite: 'Видим на уебсайта',
    saveChanges: 'Запази промените',
    cancel: 'Отказ',
    typePlaceholder: 'Тениска, Риза, Блуза и т.н.',
    categoryLabel: 'Категория',
    brandLabel: 'Марка',
    modelLabel: 'Модел',
    typeLabel: 'Тип',
    colorLabel: 'Цвят',
    sizeLabel: 'Размер',
    quantityLabel: 'Количество',
    priceLabel: 'Цена (€)',
    contact: 'contact@storename.com · +1 234 567 890',
    copyright: '© 2025',
    dashboard: 'Табло за управление',
    welcomeToAdmin: 'Добре дошли в административния панел',
    totalSales: 'Общи продажби',
    totalOrders: 'Общо поръчки',
    customers: 'Клиенти',
    fromLastMonth: 'от миналия месец',
    weeklySales: 'Продажби за седмицата',
    salesByCategory: 'Продажби по категории',
    recentOrders: 'Последни поръчки',
    topProducts: 'Топ продукти',
    sales: 'продажби',
    productTypes: 'Типове продукти',
    properties: 'Свойства',
    settings: 'Настройки',
    backToStore: 'Обратно към магазина',
    storeSettings: 'Настройки на магазина',
    manageStoreSettings: 'Управлявайте общите настройки на вашия магазин',
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
    productColor: 'Цвят',
    productSize: 'Размер',
    productQuantity: 'Количество',
    productPrice: 'Цена (€)',
    selectOptions: 'Избери опции',
    noVariants: 'Няма варианти',
    completed: 'завършен',
    processing: 'обработва се',
    shipped: 'изпратен',
    name: 'Име',
    sku: 'SKU',
    variant: 'Вариант',
    quantity: 'Количество',
    primary: 'Основен',
    description: 'Описание',
    dataType: 'Тип данни',
    active: 'Активен',
    type: 'Тип',
    code: 'Код',
    manageProperties: 'Управление на свойства',
    edit: 'Редактиране',
    delete: 'Изтриване',
    addNew: 'Добави нов',
    addProductType: 'Добави тип продукт',
    editProductType: 'Редактиране на тип продукт',
    save: 'Запази',
    confirmDelete: 'Сигурни ли сте, че искате да изтриете това?',
    dataTypeText: 'Текст',
    dataTypeSelect: 'Избор',
    dataTypeNumber: 'Число',
    isActive: 'Активен',
    propertyValues: 'Стойности',
    addProperty: 'Добави свойство',
    editProperty: 'Редактиране на свойство',
    addPropertyValue: 'Добави стойност',
    editPropertyValue: 'Редактиране на стойност',
    tooltipProducts: 'Управление на продуктите и техните варианти',
    tooltipProductTypes: 'Управление на типовете продукти',
    tooltipProperties: 'Управление на свойствата на продуктите',
    tooltipSettings: 'Настройки на магазина',
    tooltipBackToStore: 'Връщане към магазина',
    tooltipDashboard: 'Табло за управление',
    goToStore: 'Към магазина',
  },
};


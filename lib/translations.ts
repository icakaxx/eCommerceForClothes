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
  },
};


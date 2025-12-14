# ModaBox - E-commerce Store

A comprehensive, modern e-commerce platform built with Next.js 16, featuring a complete admin panel, multi-language support, and advanced product management capabilities.

## 🚀 Features

### 🛍️ Store Features
- **Product Catalog** - Organized categories (Clothes, Shoes, Accessories, For Him, For Her)
- **Product Variants** - Size, color, and custom property management
- **Advanced Search & Filtering** - Search by brand, model, color with real-time filtering
- **Shopping Cart** - Persistent cart with quantity management
- **Secure Checkout** - Complete order processing with multiple delivery options
- **Product Image Gallery** - Multiple product images with primary image selection
- **Responsive Design** - Mobile-first approach with Tailwind CSS
- **Hero Banner** - Customizable hero section with background images
- **Theme System** - Multiple color themes including gradient options

### 🌐 Internationalization
- **Multi-language Support** - English and Bulgarian translations
- **Dynamic Language Switching** - Real-time language toggle
- **RTL Support Ready** - Infrastructure for right-to-left languages

### 👨‍💼 Admin Panel
- **Dashboard Analytics** - Sales overview, recent orders, top products
- **Product Management** - Complete CRUD operations with variant generation
- **Order Management** - Track and update order statuses (Pending, Confirmed, Shipped, Delivered, Cancelled)
- **Customer Management** - View customer details, order history, and spending analytics
- **Discount System** - Create and manage promotional codes with usage tracking
- **Financial Overview** - Revenue tracking, transaction history, and period comparisons
- **Media Library** - Upload and manage product images and media files
- **Store Settings** - Customize store name, logo, colors, and appearance
- **Product Types & Properties** - Flexible product categorization system
- **Analytics** - Sales trends and performance insights

### 🛠️ Technical Features
- **Authentication** - Supabase-based admin authentication with session management
- **Email Integration** - Order notifications via Nodemailer
- **State Management** - Zustand for client-side state, React Context for app-wide state
- **Database** - Supabase PostgreSQL with real-time capabilities
- **File Storage** - Supabase Storage for media files
- **Type Safety** - Full TypeScript implementation
- **Performance** - Optimized with Next.js 16 App Router and image optimization

## 🛠️ Tech Stack

- **Frontend:** Next.js 16 (App Router), React 18, TypeScript
- **Styling:** Tailwind CSS, PostCSS, Autoprefixer
- **State Management:** Zustand, React Context
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **File Storage:** Supabase Storage
- **Icons:** Lucide React, React Icons
- **Carousels:** React Slick
- **Email:** Nodemailer
- **Deployment:** Ready for Vercel/Netlify

## 📁 Project Structure

```
├── app/                          # Next.js App Router pages
│   ├── admin/                    # Admin panel pages
│   │   ├── analytics/           # Sales analytics
│   │   ├── customers/           # Customer management
│   │   ├── discounts/           # Discount codes
│   │   ├── finance/             # Financial overview
│   │   ├── media/               # Media library
│   │   ├── products/            # Product management
│   │   ├── sales/               # Order management
│   │   ├── settings/            # Store settings
│   │   └── product-types/       # Product type management
│   ├── api/                     # API routes
│   ├── checkout/                # Checkout process
│   ├── products/                # Product catalog
│   ├── about/                   # About page
│   └── [category]/              # Dynamic category pages
├── components/                  # Reusable React components
├── context/                     # React Context providers
├── lib/                         # Utilities and configurations
│   ├── supabase/               # Database client
│   ├── translations.ts         # Multi-language translations
│   └── themes.ts               # Theme configurations
├── store/                      # Zustand stores
├── types/                      # TypeScript type definitions
└── public/                     # Static assets
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd eCommerceForClothes
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

4. **Database Setup**
   Run the SQL migrations in your Supabase dashboard to create the required tables for products, orders, customers, etc.

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📄 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run clean` - Clean build files

## 🌐 Pages & Routes

### Public Pages
- `/` - Home page with hero section and featured products
- `/products` - Product catalog with filtering and search
- `/products/[id]` - Individual product details
- `/[category]` - Category-specific product listings (clothes, shoes, accessories, for-him, for-her)
- `/about` - About page with company information
- `/checkout` - Shopping cart and checkout process

### Admin Pages
- `/admin` - Admin dashboard with analytics
- `/admin/products` - Product management
- `/admin/sales` - Order management
- `/admin/customers` - Customer management
- `/admin/discounts` - Discount code management
- `/admin/finance` - Financial overview
- `/admin/analytics` - Sales analytics
- `/admin/media` - Media library
- `/admin/settings` - Store settings
- `/admin/product-types` - Product type management

## 🔧 Configuration

### Store Settings
Customize your store through the admin panel:
- Store name and logo
- Color themes and palettes
- Language preferences
- Hero banner images

### Product Management
- Create product types and properties
- Add products with variants
- Upload multiple product images
- Set pricing and inventory
- Control product visibility

## 📧 Email Configuration

Configure email settings in your environment for order notifications:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms
The app is compatible with any platform supporting Next.js:
- Netlify
- Railway
- Digital Ocean App Platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.


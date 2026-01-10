# Deployment Guide

This guide will walk you through deploying the eCommerce store to Vercel with Supabase as the backend.

## Prerequisites

- GitHub account (for version control)
- Vercel account
- Supabase account
- Gmail account (for order emails, or configure your SMTP provider)

---

## Step 1: Create a New Project on Vercel

1. **Sign in to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with your GitHub account

2. **Create a New Project**
   - Click "Add New..." → "Project"
   - Import your GitHub repository containing this codebase
   - Or connect your local repository using Vercel CLI

3. **Configure Project Settings**
   - Framework Preset: **Next.js** (should be auto-detected)
   - Root Directory: `./` (root)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
   - Install Command: `npm install` (default)

4. **Do NOT deploy yet** - We need to configure environment variables first.

---

## Step 2: Create a New Database on Supabase

1. **Sign in to Supabase**
   - Go to [supabase.com](https://supabase.com)
   - Sign in or create a new account

2. **Create a New Project**
   - Click "New Project"
   - Choose an organization (or create one)
   - Enter project details:
     - **Name**: Your project name (e.g., "ecommerce-store")
     - **Database Password**: Generate a strong password (save this securely)
     - **Region**: Choose the closest region to your users
     - **Pricing Plan**: Free tier is fine to start

3. **Wait for Project Setup**
   - This usually takes 1-2 minutes
   - Wait until the project status shows "Active"

---

## Step 3: Run the Database Schema

1. **Open SQL Editor**
   - In your Supabase project dashboard, go to **SQL Editor** in the left sidebar
   - Click "New Query"

2. **Create Database Tables**
   - Copy the entire contents of `schema.txt` from this repository
   - Paste it into the SQL Editor
   - Click "Run" or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)
   - Wait for execution to complete (should show "Success. No rows returned")

3. **Run Migration: Add Subtitle Column**
   - Open a new query tab
   - Copy the contents of `migration-add-subtitle.sql`
   - Paste and execute it

4. **Run Migration: Add Related Products**
   - Open another new query tab
   - Copy the contents of `migration-add-related-products.sql`
   - Paste and execute it

5. **Verify Schema**
   - Go to **Table Editor** in Supabase dashboard
   - You should see the following tables:
     - `customers`
     - `discounts`
     - `order_items`
     - `orders`
     - `product_images`
     - `product_property_values`
     - `product_type_properties`
     - `product_types`
     - `product_variant_property_values`
     - `product_variants`
     - `products`
     - `profiles`
     - `properties`
     - `property_values`
     - `rfproducttype`
     - `related_products`
     - `store_settings`
     - `visitor_sessions`
     - `visitor_stats`

---

## Step 4: Configure Supabase Storage Bucket

1. **Navigate to Storage**
   - In Supabase dashboard, go to **Storage** in the left sidebar

2. **Create Storage Bucket**
   - Click "New bucket"
   - Bucket name: `products` (must be lowercase)
   - Public bucket: **Enabled** (checked)
   - File size limit: `10485760` (10MB) - optional
   - Allowed MIME types: `image/jpeg, image/png, image/gif, image/webp` - optional
   - Click "Create bucket"

3. **Configure Bucket Policies** (Optional - for additional security)
   - Go to **Storage** → **Policies**
   - The bucket should be public for reading, but you may want to restrict uploads to authenticated admin users only

---

## Step 5: Get Supabase API Keys and Configuration

1. **Get Project URL and Keys**
   - In Supabase dashboard, go to **Settings** → **API**
   - You'll need the following values:
     - **Project URL**: Found under "Project URL"
     - **anon/public key**: Found under "Project API keys" → "anon" → "public"
     - **service_role key**: Found under "Project API keys" → "service_role" → "secret" (⚠️ Keep this secret!)

2. **Copy these values** - You'll need them in the next step

---

## Step 6: Add Environment Variables to Vercel

1. **Open Vercel Project Settings**
   - Go to your Vercel project dashboard
   - Click on **Settings** tab
   - Navigate to **Environment Variables**

2. **Add Required Environment Variables**
   
   Add the following variables (for Production, Preview, and Development):

   | Variable Name | Value | Description |
   |--------------|-------|-------------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL | e.g., `https://xxxxxxxxxxxxx.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key | Found in Supabase Settings → API |
   | `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service_role key | Found in Supabase Settings → API (secret key) |
   | `NEXT_PUBLIC_EMAIL` | Your Gmail address | For sending order confirmation emails |
   | `NEXT_PUBLIC_EMAIL_PASS` | Gmail App Password | See email setup instructions below |

3. **For Each Variable:**
   - Click "Add New"
   - Enter the variable name
   - Enter the value
   - Select environments: Production, Preview, Development (select all three)
   - Click "Save"

4. **Gmail App Password Setup** (for email functionality):
   - Go to your Google Account settings
   - Enable 2-Step Verification (required for app passwords)
   - Go to **Security** → **2-Step Verification** → **App passwords**
   - Generate a new app password for "Mail"
   - Use this 16-character password as `NEXT_PUBLIC_EMAIL_PASS`

---

## Step 7: Create an Admin User

1. **Enable Email Auth in Supabase**
   - Go to **Authentication** → **Providers** in Supabase dashboard
   - Ensure "Email" provider is enabled

2. **Create Admin User via Supabase Dashboard**
   - Go to **Authentication** → **Users**
   - Click "Add user" → "Create new user"
   - Enter email and password
   - Click "Create user"
   - Copy the User ID (UUID) that was created

3. **Create Admin Profile**
   - Go to **SQL Editor** in Supabase
   - Run the following SQL (replace `USER_ID_HERE` with the UUID from step 2):

   ```sql
   INSERT INTO public.profiles (id, email, role)
   VALUES ('USER_ID_HERE', 'your-admin-email@example.com', 'admin');
   ```

4. **Verify Admin User**
   - Go to **Table Editor** → `profiles` table
   - You should see your admin user with `role = 'admin'`

---

## Step 8: Initialize Store Settings (Optional)

1. **Set Up Store Settings**
   - Go to **SQL Editor** in Supabase
   - Run the following to create default store settings:

   ```sql
   INSERT INTO public.store_settings (storename, themeid, language)
   VALUES ('ModaBox', 'default', 'en');
   ```

2. **Add Initial Product Types** (Optional)
   - If you have seed data or need initial product types, you can add them through the admin panel after deployment

---

## Step 9: Deploy to Vercel

1. **Trigger Deployment**
   - If you imported from GitHub: Push any changes or manually trigger a deployment from Vercel dashboard
   - If using Vercel CLI: Run `vercel --prod`

2. **Monitor Build Process**
   - Watch the deployment logs in Vercel dashboard
   - Ensure the build completes successfully

3. **Verify Deployment**
   - Once deployed, Vercel will provide you with a production URL
   - Visit the URL to verify the site is working

---

## Step 10: Configure Custom Domain (Optional)

1. **Add Domain in Vercel**
   - Go to **Settings** → **Domains** in your Vercel project
   - Enter your domain name
   - Follow the DNS configuration instructions

2. **Update Environment Variables** (if needed)
   - Some features may need the production URL in environment variables
   - Check if any additional configuration is needed

---

## Step 11: Post-Deployment Verification

1. **Test the Application**
   - Visit your deployed site
   - Test browsing products (if any exist)
   - Test the admin panel: `https://your-domain.com/admin/login`
   - Log in with your admin credentials

2. **Verify Database Connection**
   - Check that products load correctly
   - Check admin panel loads without errors

3. **Test Image Upload**
   - Go to admin panel
   - Try uploading a product image
   - Verify it appears in Supabase Storage → `products` bucket

4. **Test Order Flow** (if applicable)
   - Place a test order
   - Verify order emails are sent (check spam folder)
   - Verify order appears in database

---

## Troubleshooting

### Build Fails on Vercel
- Check build logs for errors
- Ensure all environment variables are set correctly
- Verify `package.json` has all required dependencies

### Database Connection Errors
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
- Check Supabase project is active and not paused
- Verify the schema was created correctly

### Storage Upload Fails
- Verify `products` bucket exists in Supabase Storage
- Check bucket is set to public
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly

### Email Not Sending
- Verify Gmail app password is correct (not your regular password)
- Check `NEXT_PUBLIC_EMAIL` and `NEXT_PUBLIC_EMAIL_PASS` are set
- Try enabling "Less secure app access" if using older Gmail account (not recommended)

### Admin Login Not Working
- Verify admin user exists in `profiles` table with `role = 'admin'`
- Check the user was created in Supabase Authentication
- Verify the profile `id` matches the auth user `id`

---

## Additional Configuration

### Row Level Security (RLS) Policies
The application may require RLS policies to be configured. Check Supabase documentation and your specific requirements.

### Analytics
If you need analytics, consider:
- Setting up Google Analytics
- Using Vercel Analytics
- Configuring visitor tracking in the application

### Backup Strategy
- Set up regular database backups in Supabase
- Consider using Supabase's automatic daily backups (paid plans)

---

## Environment Variables Summary

Here's a checklist of all required environment variables:

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `NEXT_PUBLIC_EMAIL`
- [ ] `NEXT_PUBLIC_EMAIL_PASS`

---

## Next Steps

After successful deployment:
1. Add your product catalog through the admin panel
2. Configure store settings (logo, social links, etc.)
3. Set up payment processing (if applicable)
4. Configure shipping options
5. Test the complete customer journey
6. Monitor application logs and errors

---

## Support

For issues or questions:
- Check Vercel deployment logs
- Check Supabase logs (Dashboard → Logs)
- Review application logs in Vercel
- Consult Next.js and Supabase documentation

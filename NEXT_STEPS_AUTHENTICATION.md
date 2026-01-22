# Next Steps - User Authentication System

## Status

✅ **Completed:**
- API routes (login, register, forgot-password, reset-password, profile, change-password, orders)
- AuthContext and integration with providers
- Frontend pages (login/register, forgot-password, reset-password)
- CSS modules for all pages
- Header component updated with user menu/logout
- Translations added for authentication
- Dependencies installed
- Build successful

⏳ **Remaining:**

## 1. Database Setup

### Create Users Table

Run the SQL migration file in your Supabase database:

**File:** `migration-create-users-table.sql`

This will create:
- `users` table with all required fields
- Indexes on `email` and `reset_token`
- Proper constraints and comments

**How to run:**
1. Open Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `migration-create-users-table.sql`
3. Execute the migration

**Verify:**
```sql
SELECT * FROM public.users LIMIT 1;
```

---

## 2. Environment Variables

Add the following environment variables to your `.env.local` file:

### Email Service (Required for password reset and welcome emails)

```env
# Gmail SMTP Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

**How to get Gmail App Password:**
1. Go to your Google Account settings
2. Security → 2-Step Verification (must be enabled)
3. App passwords → Generate app password
4. Copy the generated password to `EMAIL_PASS`

### Upstash Redis (Required for rate limiting)

```env
# Upstash Redis Configuration
UPSTASH_REDIS_REST_URL=https://your-redis-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token
```

**How to set up Upstash:**
1. Go to [Upstash Console](https://console.upstash.com/)
2. Create a new Redis database
3. Copy the REST URL and Token from the database details
4. Add them to `.env.local`

**Note:** Rate limiting will work without Upstash, but it's recommended for production to prevent brute force attacks.

### Site URL (Required for password reset links)

```env
# Site URL for password reset emails
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

**For local development:**
```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Complete `.env.local` Example

```env
# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Email Service
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Upstash Redis (Rate Limiting)
UPSTASH_REDIS_REST_URL=https://your-redis-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 3. Optional: Create User Dashboard Page

The dashboard page is not yet created. Reference implementation is in:
- `loginFunctionality/userdashboard.txt`

**Dashboard should include:**
- Profile management tab
- Order history tab
- Password change section
- Address management (optional)

**To create:**
1. Create `app/user/dashboard/page.tsx`
2. Create `app/user/dashboard/dashboard.module.css`
3. Implement tabs for Profile and Orders
4. Integrate with existing API routes:
   - `/api/user/profile` (GET/PUT)
   - `/api/user/orders` (GET)
   - `/api/user/change-password` (POST)

---

## 4. Testing Checklist

### Authentication Flow
- [ ] User registration
- [ ] User login
- [ ] User logout
- [ ] Password reset flow (forgot → reset email → reset password)
- [ ] Session persistence (refresh page, should stay logged in)
- [ ] Cross-tab synchronization (login in one tab, shows in another)

### Security
- [ ] Rate limiting works (try 6+ login attempts quickly)
- [ ] Password hashing (check database, should be bcrypt hash)
- [ ] Email validation (try invalid emails)
- [ ] Phone validation (try invalid Bulgarian phone numbers)
- [ ] Password requirements enforced (min 8 chars, letters + numbers)

### API Endpoints
- [ ] `POST /api/auth/login` - Login
- [ ] `POST /api/auth/register` - Register
- [ ] `POST /api/auth/forgot-password` - Request password reset
- [ ] `POST /api/auth/reset-password` - Reset password with token
- [ ] `GET /api/user/profile?userId=xxx` - Get user profile
- [ ] `PUT /api/user/profile` - Update user profile
- [ ] `POST /api/user/change-password` - Change password
- [ ] `GET /api/user/orders?userId=xxx` - Get user orders

### Frontend Pages
- [ ] `/user` - Login/Register page works
- [ ] `/user/forgot-password` - Forgot password page works
- [ ] `/user/reset-password?token=xxx` - Reset password page works
- [ ] Header shows user icon when logged in
- [ ] Header shows logout button when logged in
- [ ] Logout works and redirects properly

### Email Functionality
- [ ] Welcome email sent after registration
- [ ] Password reset email sent with correct link
- [ ] Email contains correct store name (from settings)

---

## 5. Integration with Checkout

Currently, orders are created via the `customers` table. To link authenticated users to orders:

**Option 1: Email Matching (Recommended for now)**
- When user places order, system matches their email with `customers` table
- This is already implemented in `/api/user/orders`

**Option 2: Add `userid` to orders table (Future enhancement)**
- Requires migration to add `userid` column to `orders` table
- Update checkout to save `userid` when user is authenticated
- This provides better data integrity but requires more changes

---

## 6. Future Enhancements

### High Priority
- [ ] Create user dashboard page (`app/user/dashboard/page.tsx`)
- [ ] Add order details view in dashboard
- [ ] Test all authentication flows end-to-end

### Medium Priority
- [ ] Add address management in dashboard
- [ ] Email verification flow (verify email before account activation)
- [ ] Remember me functionality (longer session tokens)
- [ ] Social login (Google, Facebook) - if needed

### Low Priority
- [ ] Two-factor authentication (2FA)
- [ ] Account deletion functionality
- [ ] Password strength indicator
- [ ] Account activity log

---

## Quick Start Guide

1. **Run Database Migration**
   ```bash
   # Copy SQL from migration-create-users-table.sql
   # Paste into Supabase SQL Editor and execute
   ```

2. **Add Environment Variables**
   ```bash
   # Edit .env.local and add all required variables
   # See section 2 above for details
   ```

3. **Restart Development Server**
   ```bash
   npm run dev
   ```

4. **Test Registration**
   - Go to `/user`
   - Register a new account
   - Check email for welcome message

5. **Test Login**
   - Login with registered credentials
   - Verify Header shows user icon
   - Check localStorage has `user` and `user_id`

6. **Test Password Reset**
   - Go to `/user/forgot-password`
   - Enter your email
   - Check email for reset link
   - Click link and reset password

---

## Troubleshooting

### Email not sending?
- Check `EMAIL_USER` and `EMAIL_PASS` are correct
- Verify Gmail 2-Step Verification is enabled
- Check app password is valid (not regular password)
- Check email service logs in console

### Rate limiting not working?
- Verify `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set
- Check Upstash console for errors
- Rate limiting will gracefully degrade if Upstash is unavailable

### Password reset link not working?
- Verify `NEXT_PUBLIC_SITE_URL` is correct
- Check token hasn't expired (1 hour expiry)
- Verify token matches in database

### User not persisting after refresh?
- Check localStorage is enabled in browser
- Verify `AuthContext` is loading user from localStorage
- Check browser console for errors

---

## Files Reference

### Created Files
- `app/user/page.tsx` - Login/Register page
- `app/user/user.module.css` - Login/Register styles
- `app/user/forgot-password/page.tsx` - Forgot password page
- `app/user/forgot-password/forgot-password.module.css` - Forgot password styles
- `app/user/reset-password/page.tsx` - Reset password page
- `app/user/reset-password/reset-password.module.css` - Reset password styles
- `context/AuthContext.tsx` - Authentication context
- `migration-create-users-table.sql` - Database migration

### Modified Files
- `app/providers.tsx` - Added AuthProvider
- `components/Header.tsx` - Added user menu/logout
- `lib/translations.ts` - Added authentication translations

### Existing API Routes (Already Created)
- `app/api/auth/login/route.ts`
- `app/api/auth/register/route.ts`
- `app/api/auth/forgot-password/route.ts`
- `app/api/auth/reset-password/route.ts`
- `app/api/user/profile/route.ts`
- `app/api/user/change-password/route.ts`
- `app/api/user/orders/route.ts`

### Existing Utilities (Already Created)
- `lib/emailService.ts`
- `lib/rateLimit.ts`
- `lib/validation.ts`
- `lib/zodSchemas.ts`

---

## Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Verify all environment variables are set correctly
3. Check browser console for errors
4. Verify database migration ran successfully
5. Test API endpoints directly using curl or Postman

---

**Last Updated:** After successful build completion
**Status:** Ready for database setup and environment configuration

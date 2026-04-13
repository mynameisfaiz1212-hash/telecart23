# Deployment Guide: Supabase + Netlify

## Step 1: Set Up Your Supabase Project

### 1.1 Create Supabase Account
- Go to [supabase.com](https://supabase.com)
- Sign up or log in
- Create a new project

### 1.2 Get Your Supabase Credentials
- Go to Project Settings → API
- Copy these values:
  - **SUPABASE_URL**: Your project URL
  - **SUPABASE_ANON_KEY**: Your anonymous key
  - **SUPABASE_SERVICE_ROLE_KEY**: Service role key (for backend operations)

### 1.3 Set Up Database Tables
Run these SQL queries in Supabase SQL Editor:

```sql
-- Page Sections
CREATE TABLE page_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_type TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);

-- Hero Settings
CREATE TABLE hero_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  main_text TEXT NOT NULL,
  animated_words TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT now()
);

-- Featured Cards
CREATE TABLE featured_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  logo_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now()
);

-- Categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon_url TEXT,
  bg_color TEXT DEFAULT '#FFF9C4',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now()
);

-- Subcategories
CREATE TABLE subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  link TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now()
);

-- Category Downloads
CREATE TABLE category_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT DEFAULT 'file',
  created_at TIMESTAMP DEFAULT now()
);

-- Offers
CREATE TABLE offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  heading TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  link TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now()
);

-- Ads 2 Column
CREATE TABLE ads_2col (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT,
  link TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now()
);

-- Ads 3 Column
CREATE TABLE ads_3col (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT,
  link TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now()
);

-- Auth table (for tracking admins)
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);
```

### 1.4 Enable Realtime
- Go to Database → Replication
- Enable replication for all tables

---

## Step 2: Configure Environment Variables

### 2.1 Create `.env.local` file
In your project root, create `.env.local`:

```
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 2.2 Update `src/integrations/supabase/client.ts`
Make sure it uses environment variables:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

---

## Step 3: Set Up Admin Authentication

### 3.1 Enable Supabase Auth
- Go to Authentication → Providers
- Enable Email/Password auth
- Set up email templates if needed

### 3.2 Update Admin Login Logic
The admin login checks if user has admin role. Update `src/pages/AdminLogin.tsx` to:
- Allow users to sign up with email/password
- Automatically assign admin role to accounts you select

### 3.3 Create Admin Accounts (In Supabase)
1. Go to Authentication → Users
2. Add users manually OR
3. Users can sign up, then you manually set `is_admin = true` in admin_users table

---

## Step 4: Prepare for Netlify Deployment

### 4.1 Install Dependencies
```bash
npm install
```

### 4.2 Build the Project
```bash
npm run build
```

### 4.3 Test Build Locally
```bash
npm run preview
```

### 4.4 Create `netlify.toml`
In your project root:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[dev]
  command = "npm run dev"
  port = 5173

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## Step 5: Deploy to Netlify

### 5.1 Push Code to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-username/repo-name.git
git push -u origin main
```

### 5.2 Connect to Netlify
1. Go to [netlify.com](https://netlify.com)
2. Sign up with GitHub
3. Click "New site from Git"
4. Select your repository
5. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`

### 5.3 Add Environment Variables in Netlify
1. Go to Site settings → Build & deploy → Environment
2. Add these variables:
   - `VITE_SUPABASE_URL`: Your Supabase URL
   - `VITE_SUPABASE_ANON_KEY`: Your anon key

### 5.4 Deploy
Click "Deploy site" and wait for build to complete

---

## Step 6: Set Up Admin Access for Clients

### 6.1 Database Security Rules (RLS)
Enable Row Level Security in Supabase:

```sql
-- For admin tables - only admins can edit
ALTER TABLE page_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE featured_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads_2col ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads_3col ENABLE ROW LEVEL SECURITY;

-- Example policy for featured_cards (admin only)
CREATE POLICY "Only admins can edit featured_cards" ON featured_cards
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM admin_users WHERE is_admin = true
    )
  );
```

### 6.2 Share Admin Login with Client
1. Share your Netlify URL: `https://your-site.netlify.app/admin/login`
2. Create admin account in Supabase
3. Client can now login and manage content

---

## Step 7: Storage Setup (For Image Uploads)

### 7.1 Create Storage Buckets in Supabase
1. Go to Storage → Buckets
2. Create these buckets:
   - `cards` (for featured cards)
   - `categories` (for category icons)
   - `offers` (for offer images)
   - `ads` (for ad images)

### 7.2 Set Bucket Policies
```sql
-- Anyone can upload
CREATE POLICY "Anyone can upload" ON storage.objects
  FOR INSERT USING (true);

-- Only authenticated users can read
CREATE POLICY "Authenticated users can read" ON storage.objects
  FOR SELECT USING (auth.role() = 'authenticated');
```

---

## Step 8: Verify Deployment

### 8.1 Test Domain
- Visit: `https://your-site.netlify.app`
- Check if homepage loads
- Test navigation

### 8.2 Test Admin Panel
- Go to: `https://your-site.netlify.app/admin/login`
- Try logging in with admin account
- Test adding/editing content

### 8.3 Test Image Uploads
- In admin panel, try uploading an image
- Verify it appears correctly

---

## Troubleshooting

### Issue: "Cannot find Supabase credentials"
**Solution:** Check `.env.local` has correct credentials and Netlify environment variables are set

### Issue: "Admin login not working"
**Solution:** 
- Verify user exists in Supabase Auth
- Check `admin_users` table has correct entry with `is_admin = true`
- Check RLS policies allow the user

### Issue: "Images not uploading"
**Solution:**
- Verify storage buckets exist in Supabase
- Check bucket policies allow uploads
- Verify `VITE_SUPABASE_ANON_KEY` has storage permissions

### Issue: "Netlify build failing"
**Solution:**
- Check build logs in Netlify dashboard
- Verify all dependencies are in `package.json`
- Run `npm run build` locally to test

---

## Final Checklist

- [ ] Supabase project created and configured
- [ ] Database tables created
- [ ] Environment variables set locally
- [ ] `.env.local` created (don't commit!)
- [ ] `.gitignore` includes `.env.local`
- [ ] Code pushed to GitHub
- [ ] Netlify site created and connected
- [ ] Environment variables set in Netlify
- [ ] Deployment successful
- [ ] Admin account created in Supabase
- [ ] Admin login tested
- [ ] Content editing tested
- [ ] Image upload tested

---

## Need Help?

- **Supabase Docs:** https://supabase.com/docs
- **Netlify Docs:** https://docs.netlify.com
- **React Router:** https://reactrouter.com/docs

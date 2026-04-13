# Quick Start: Deploy to Netlify with Your Supabase

## Quick Summary (5 Main Steps)

### Step 1️⃣: Set Up Supabase (5 minutes)
```
1. Create Supabase account at supabase.com
2. Create new project
3. Go to Settings → API and copy:
   - SUPABASE_URL
   - SUPABASE_ANON_KEY
4. Paste database schema from DEPLOYMENT_GUIDE.md
5. Create storage buckets: cards, categories, offers, ads
```

### Step 2️⃣: Add Environment Variables (2 minutes)
Create `.env.local` in project root:
```
VITE_SUPABASE_URL=your_url_here
VITE_SUPABASE_ANON_KEY=your_key_here
```

### Step 3️⃣: Test Locally (2 minutes)
```bash
npm install
npm run dev
# Visit: http://localhost:5173
# Test admin panel: http://localhost:5173/admin/login
```

### Step 4️⃣: Push to GitHub (5 minutes)
```bash
git add .
git commit -m "Setup deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/dynamic-page-builder.git
git push -u origin main
```

### Step 5️⃣: Deploy to Netlify (3 minutes)
1. Visit [netlify.com](https://netlify.com)
2. Sign up with GitHub
3. Click "New site from Git"
4. Select your repository
5. Set environment variables (same as Step 2)
6. Click Deploy

**Done!** Your site is live at `https://your-site.netlify.app`

---

## Admin Access for Your Client

1. Create admin account in Supabase Authentication
2. Set `is_admin = true` in `admin_users` table (or manually in Settings → Users)
3. Share login URL: `https://your-site.netlify.app/admin/login`
4. Client can now manage all content!

---

## Commands for Reference

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run preview         # Preview built version

# Git
git status              # Check changes
git add .               # Stage all changes
git commit -m "message" # Commit
git push                # Push to GitHub
```

---

## File Structure After Setup

```
project-root/
├── .env.local                 ← Keep this SECRET (don't commit)
├── DEPLOYMENT_GUIDE.md        ← Full guide
├── netlify.toml              ← Netlify config
├── package.json              ← Dependencies
├── src/
│   ├── integrations/
│   │   └── supabase/
│   │       └── client.ts     ← Supabase connection
│   └── ...
└── ...
```

---

## Video Steps (If You Need Help)

1. **Supabase Setup:** https://supabase.com/docs/guides/getting-started
2. **GitHub Setup:** https://docs.github.com/en/get-started/quickstart
3. **Netlify Deploy:** https://docs.netlify.com/site-deploys/overview/

---

## Support

- **Stuck?** Check full guide: `DEPLOYMENT_GUIDE.md`
- **Environment Issues?** Make sure `.env.local` is in `.gitignore`
- **Images not working?** Check Storage buckets in Supabase
- **Admin can't login?** Verify in `admin_users` table that `is_admin = true`

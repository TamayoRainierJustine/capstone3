# How to Publish Your Store with a Custom Domain (FREE)

This guide explains how to make your published store accessible via a custom domain without paying for hosting.

## Current Setup

Your stores are currently accessible at:
- `https://structura-eight.vercel.app/published/your-store-name`
- `https://structura-eight.vercel.app/store/your-store-name`

## Free Options for Custom Domains

### Option 1: Use Vercel's Free Subdomain (Easiest - Already Available!)

**What you get:**
- Your store is already live at: `https://structura-eight.vercel.app/published/your-store-name`
- This is a free, professional URL that works immediately
- No configuration needed!

**How customers access it:**
- Share the URL: `https://structura-eight.vercel.app/published/your-store-name`
- Customers can visit and buy products immediately

**Pros:**
- ✅ Completely free
- ✅ Works immediately
- ✅ Professional HTTPS included
- ✅ Fast and reliable

**Cons:**
- ❌ Not a custom domain (uses `.vercel.app`)

---

### Option 2: Add Your Own Custom Domain to Vercel (FREE if you own a domain)

If you already own a domain (e.g., `mystore.com`), you can add it to Vercel for **FREE**.

**Step 1: Get a Domain (if you don't have one)**
- **Free domains:** Freenom (.tk, .ml, .ga, .cf) - Not recommended (unreliable)
- **Cheap domains:** Namecheap, GoDaddy, Google Domains (~$10-15/year)
- **Best option:** Get a `.com` domain from Namecheap or Google Domains

**Step 2: Add Domain to Vercel**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `structura-eight`
3. Go to **Settings** → **Domains**
4. Click **Add Domain**
5. Enter your domain (e.g., `mystore.com`)
6. Follow the DNS configuration instructions

**Step 3: Configure DNS Records**
Vercel will show you what DNS records to add. Typically:
- **A Record:** `@` → `76.76.21.21` (or Vercel's IP)
- **CNAME Record:** `www` → `cname.vercel-dns.com`

**Step 4: Update Your Store Domain**
Once your domain is verified:
- Your store will be accessible at: `https://mystore.com/published/your-store-name`
- Or configure subdomain routing (see Option 3)

**Pros:**
- ✅ Completely free (if you own the domain)
- ✅ Professional custom domain
- ✅ Full control
- ✅ HTTPS included automatically

**Cons:**
- ❌ Requires owning a domain (costs ~$10-15/year for .com)

---

### Option 3: Subdomain Routing (Advanced - FREE)

If you own a domain, you can set up subdomain routing so each store gets its own subdomain:
- `store1.yourdomain.com`
- `store2.yourdomain.com`

**Step 1: Add Wildcard Domain to Vercel**
1. In Vercel Dashboard → Settings → Domains
2. Add: `*.yourdomain.com`
3. Configure DNS: Add CNAME `*` → `cname.vercel-dns.com`

**Step 2: Update Vercel Configuration**
The `vercel.json` already has routing configured. You may need to add:
```json
{
  "rewrites": [
    {
      "source": "/:domain",
      "destination": "/api/index.js?domain=$1"
    }
  ]
}
```

**Step 3: Update Backend to Handle Subdomain**
The backend needs to detect the subdomain and route accordingly.

**Pros:**
- ✅ Each store gets its own subdomain
- ✅ Professional URLs
- ✅ FREE if you own the domain

**Cons:**
- ❌ Requires domain ownership
- ❌ More complex setup

---

## Recommended Approach

**For most users:** Use **Option 1** (Vercel's free subdomain)
- It's free, works immediately, and is professional enough for most stores
- Share the URL: `https://structura-eight.vercel.app/published/your-store-name`

**For professional stores:** Use **Option 2** (Custom domain)
- Buy a `.com` domain (~$10-15/year)
- Add it to Vercel (free)
- Get a professional custom domain

---

## How to Share Your Store URL

Once your store is published, share this URL with customers:
```
https://structura-eight.vercel.app/published/YOUR-DOMAIN-NAME
```

Replace `YOUR-DOMAIN-NAME` with the domain name you entered when creating your store.

---

## Testing Your Store

1. Publish your store in the dashboard
2. Visit: `https://structura-eight.vercel.app/published/your-domain-name`
3. Test ordering products
4. Share the URL with customers!

---

## Need Help?

- **Vercel Domain Setup:** https://vercel.com/docs/concepts/projects/domains
- **DNS Configuration:** Check your domain registrar's documentation
- **Free Domains:** Not recommended, but Freenom offers free .tk/.ml domains (unreliable)

---

## Important Notes

- ✅ Vercel hosting is **FREE** for personal projects
- ✅ Custom domains on Vercel are **FREE** (you just need to own the domain)
- ✅ HTTPS/SSL is **automatically included** and **FREE**
- ✅ No monthly hosting fees
- ❌ Free domain services (Freenom) are unreliable and not recommended for business


## Railway Deployment & Submission Guide

Comprehensive reference para sa kung paano i-deploy ang project na ito gamit ang **Railway** para sa backend (Node + PostgreSQL) at anumang static hosting (S3/Vercel/Netlify) para sa frontend build. Kasama rin ang eksaktong mga hakbang kapag isusubmit na ang trabaho.

1. **Deployment Steps** – mula paghahanda ng repo hanggang sa pag-host ng backend sa Railway at pag-build ng frontend.
2. **Submission Checklist** – para malinaw kung ano ang kailangan i-package at i-upload (kasama ang video demo at dokumentasyon).

> **Nota:** Ang instructions ay naka-base sa kasalukuyang project structure (`backend/` para sa API + `frontend/` para sa React app). Palaging i-update ang `.env` values bago mag-deploy. Ang backend ay naka-host sa Railway, kaya walang kinakailangang AWS account/credit card para sa API.

---

### 1. Prerequisites

- Railway account (free tier ok; mas maganda kung Starter para sa “always on”)
- Git + Node.js 20.x + npm sa local machine
- Supabase account/credentials (ginagamit para sa storage at database access)
- Optional: AWS/Vercel/Netlify account kung saan mo io-host ang frontend build
- Screen recorder (OBS/Loom/Xbox Game Bar) para sa video demo

---

### 2. Environment Variables

1. Gumawa ng `backend/.env` file (sample: `backend/env.example`).
2. Siguraduhing updated ang mga sumusunod:
   - `DATABASE_URL` o individual PG creds (`DB_HOST`, `DB_USER`, etc.)
   - `JWT_SECRET`
   - `SUPABASE_*` keys kung ginagamit pa ang Supabase storage
   - Email SMTP creds para sa verification at notifications
3. Para sa frontend, gamitin ang `frontend/.env` (base sa `frontend/.env.example` kung meron) at i-set ang:
   - `VITE_API_BASE_URL=https://your-backend-domain.com`

---

### 3. Preparing the Backend (Local Build/Test)

```bash
cd backend
npm install
npm run dev   # optional local test
```

Siguraduhing walang error sa console bago mag-deploy.

---

### 4. Preparing the Frontend Build

```bash
cd frontend
npm install
npm run build
```

Output directory: `frontend/dist/` – ito ang i-upload sa S3 (o sa anumang static hosting).

---

### 5. Backend Deployment (Railway)

1. **Create new Railway project/service**
   - Piliin ang “Deploy from GitHub” kung naka-connect ang repo, o “Deploy from Template” tapos manual na `git push`.
2. **Connect repository**
   - Repository: `TamayoRainierJustine/capstone3`
   - Directory: `backend`
   - Build command: `npm install && npm run build` (optional)  
     Start command: `npm start` (nakaset sa `package.json`)
3. **Configure variables**
   - Sa “Variables” tab, idagdag ang lahat ng production secrets (`DATABASE_URL`, `JWT_SECRET`, `SMTP_*`, `SUPABASE_*`, atbp.).
   - Maaari kang mag-“Import from .env” kung may local file.
4. **Database**
   - Gamitin ang Supabase connection string (`DATABASE_URL`) kung doon naka-host ang Postgres.
   - Kung gusto mo ng Railway Postgres add-on, pwede ka ring gumawa at palitan ang `DATABASE_URL`.
5. **Deploy**
   - Sa unang deploy, i-click ang “Deploy” button. Hintayin ang logs hanggang makita ang `Server running on port 8080`.
   - Kung naka-free plan, aasahan ang auto-sleep kapag idle. Pwede kang mag-upgrade sa Starter para sa “Always On”.
6. **Wake/Test**
   - Bago mag-demo, buksan ang `https://<service>.up.railway.app/api/health` para siguradong gising ang container.
   - Monitor ang logs sa “Observability > Logs” habang nagte-test.

---

### 6. Frontend Deployment (Any Static Hosting)

Options:

1. **AWS S3/CloudFront** – sundin pa rin ang dating proseso kung may AWS ka na.
2. **Vercel/Netlify** – pinakamadaling paraan kung wala kang AWS:
   - Connect repo → project root = `frontend`
   - Build command: `npm run build`
   - Output: `dist`
   - Env var: `VITE_API_BASE_URL=https://<railway-app>.up.railway.app`
3. **Manual hosting** – maaari kang mag-serve ng `frontend/dist` sa kahit anong static server (Nginx, GitHub Pages, atbp.)

---

- [ ] Backend endpoint `https://<railway-app>.up.railway.app/api/health` ay nagre-return ng 200
- [ ] Frontend UI reachable via chosen hosting (S3/Vercel/Netlify o local dev server)
- [ ] JWT auth, order flows, Super Admin pages tested
- [ ] Payment QR uploads + email notifications working (check logs sa PM2)
- [ ] Database metrics (orders, stores) tama ang counts

---

### 8. Submission Package

Kapag magsu-submit na:

1. **Railway Deployment Document**
   - Ito mismong file (`AWS_DEPLOYMENT_AND_SUBMISSION_GUIDE.md`) na naglalahad ng Railway setup + screenshots ng Railway dashboard (Variables, Deployments, Logs).
2. **Environment Summary**
   - Tabulate ang mga ginamit na domains/IPs at anong service sila naka-link
3. **Video Demo**
   - Record gamit OBS o Loom; ipakita:
     - Customer flow (published store)
     - Store owner dashboard (orders, payments, shipping, atbp.)
     - Super Admin dashboard (bagong features: Total Orders card, Store Performance, All Orders view)
     - Backend logs/PM2 status (optional pero recommended para patunay na live)
4. **Repository Snapshot**
   - `git status` (clean) + latest commit hash
   - Optional zip ng buong repo kung iyon ang requirement
5. **Deployment Credentials (kung kailangan)**
   - Temporary viewer account para sa panel (wag ibigay admin credentials sa dokumento; gumawa ng test user na safe)

---

### 9. Tips for the Video Demo

- Gumamit ng screen recorder (OBS, Xbox Game Bar, Loom)
- Ipakita lahat ng critical components:
  1. Customer purchasing flow + payment upload
  2. Store owner confirming payment, chatting, configuring shipping
  3. Super Admin viewing analytics, orders, store performance, deleting store (with confirmation modals)
- Kung partial lang ang na-deploy sa AWS (hal. backend lang), sabihin ito sa simula ng video at ipakita ang lokal na parte para sa kulang na component. Dapat malinaw ang explanation kung ano ang hosted vs local.
- **Kung ang requirement ng panel ay “Section C – Super Admin lang”**, malinaw na sabihin sa video intro na Super Admin demo lang ang ipapakita at i-highlight ang mga bagong feature (Total Orders card, Store Performance table, All Orders view). Optional na lang ang customer at store owner flows.

---

### 10. Troubleshooting

- **White screen sa frontend** – siguraduhin tama ang `VITE_API_BASE_URL` at naka-enable ang CORS sa backend
- **Railway container natutulog** – mag-send ng request sa `/api/health` bago mag-demo o mag-upgrade sa Starter plan para “Always On”.
- **API 502/504** – check Railway Logs tab; kung need mo ng shell access, gumamit ng `railway run bash` (kung naka-install ang Railway CLI).
- **Images/QR hindi lumalabas** – verify Supabase/S3 credentials sa backend `.env`
- **Email hindi makapag-send** – double-check SMTP user/password at `from` address

---

Kung may additional requirements (e.g., Kubernetes, Docker, CI/CD), dagdagan lang itong dokumento sa parehong folder para may single source of truth.



---

### 1. Prerequisites

- Railway account (free tier ok; mas maganda kung Starter para sa “always on”)
- Git + Node.js 20.x + npm sa local machine
- Supabase account/credentials (ginagamit para sa storage at database access)
- Optional: AWS/Vercel/Netlify account kung saan mo io-host ang frontend build
- Screen recorder (OBS/Loom/Xbox Game Bar) para sa video demo

---

### 2. Environment Variables

1. Gumawa ng `backend/.env` file (sample: `backend/env.example`).
2. Siguraduhing updated ang mga sumusunod:
   - `DATABASE_URL` o individual PG creds (`DB_HOST`, `DB_USER`, etc.)
   - `JWT_SECRET`
   - `SUPABASE_*` keys kung ginagamit pa ang Supabase storage
   - Email SMTP creds para sa verification at notifications
3. Para sa frontend, gamitin ang `frontend/.env` (base sa `frontend/.env.example` kung meron) at i-set ang:
   - `VITE_API_BASE_URL=https://your-backend-domain.com`

---

### 3. Preparing the Backend (Local Build/Test)

```bash
cd backend
npm install
npm run dev   # optional local test
```

Siguraduhing walang error sa console bago mag-deploy.

---

### 4. Preparing the Frontend Build

```bash
cd frontend
npm install
npm run build
```

Output directory: `frontend/dist/` – ito ang i-upload sa S3 (o sa anumang static hosting).

---

### 5. Backend Deployment (Railway)

1. **Create new Railway project/service**
   - Piliin ang “Deploy from GitHub” kung naka-connect ang repo, o “Deploy from Template” tapos manual na `git push`.
2. **Connect repository**
   - Repository: `TamayoRainierJustine/capstone3`
   - Directory: `backend`
   - Build command: `npm install && npm run build` (optional)  
     Start command: `npm start` (nakaset sa `package.json`)
3. **Configure variables**
   - Sa “Variables” tab, idagdag ang lahat ng production secrets (`DATABASE_URL`, `JWT_SECRET`, `SMTP_*`, `SUPABASE_*`, atbp.).
   - Maaari kang mag-“Import from .env” kung may local file.
4. **Database**
   - Gamitin ang Supabase connection string (`DATABASE_URL`) kung doon naka-host ang Postgres.
   - Kung gusto mo ng Railway Postgres add-on, pwede ka ring gumawa at palitan ang `DATABASE_URL`.
5. **Deploy**
   - Sa unang deploy, i-click ang “Deploy” button. Hintayin ang logs hanggang makita ang `Server running on port 8080`.
   - Kung naka-free plan, aasahan ang auto-sleep kapag idle. Pwede kang mag-upgrade sa Starter para sa “Always On”.
6. **Wake/Test**
   - Bago mag-demo, buksan ang `https://<service>.up.railway.app/api/health` para siguradong gising ang container.
   - Monitor ang logs sa “Observability > Logs” habang nagte-test.

---

### 6. Frontend Deployment (Any Static Hosting)

Options:

1. **AWS S3/CloudFront** – sundin pa rin ang dating proseso kung may AWS ka na.
2. **Vercel/Netlify** – pinakamadaling paraan kung wala kang AWS:
   - Connect repo → project root = `frontend`
   - Build command: `npm run build`
   - Output: `dist`
   - Env var: `VITE_API_BASE_URL=https://<railway-app>.up.railway.app`
3. **Manual hosting** – maaari kang mag-serve ng `frontend/dist` sa kahit anong static server (Nginx, GitHub Pages, atbp.)

---

- [ ] Backend endpoint `https://<railway-app>.up.railway.app/api/health` ay nagre-return ng 200
- [ ] Frontend UI reachable via chosen hosting (S3/Vercel/Netlify o local dev server)
- [ ] JWT auth, order flows, Super Admin pages tested
- [ ] Payment QR uploads + email notifications working (check logs sa PM2)
- [ ] Database metrics (orders, stores) tama ang counts

---

### 8. Submission Package

Kapag magsu-submit na:

1. **Railway Deployment Document**
   - Ito mismong file (`AWS_DEPLOYMENT_AND_SUBMISSION_GUIDE.md`) na naglalahad ng Railway setup + screenshots ng Railway dashboard (Variables, Deployments, Logs).
2. **Environment Summary**
   - Tabulate ang mga ginamit na domains/IPs at anong service sila naka-link
3. **Video Demo**
   - Record gamit OBS o Loom; ipakita:
     - Customer flow (published store)
     - Store owner dashboard (orders, payments, shipping, etc.)
     - Super Admin dashboard (bagong features: Total Orders card, Store Performance, All Orders view)
     - Backend logs/PM2 status (optional pero recommended para patunay na live)
4. **Repository Snapshot**
   - `git status` (clean) + latest commit hash
   - Optional zip ng buong repo kung iyon ang requirement
5. **Deployment Credentials (kung kailangan)**
   - Temporary viewer account para sa panel (wag ibigay admin credentials sa dokumento; gumawa ng test user na safe)

---

### 9. Tips for the Video Demo

- Gumamit ng screen recorder (OBS, Xbox Game Bar, Loom)
- Ipakita lahat ng critical components:
  1. Customer purchasing flow + payment upload
  2. Store owner confirming payment, chatting, configuring shipping
  3. Super Admin viewing analytics, orders, store performance, deleting store (with confirmation modals)
- Kung partial lang ang na-deploy sa AWS (hal. backend lang), sabihin ito sa simula ng video at ipakita ang lokal na parte para sa kulang na component. Dapat malinaw ang explanation kung ano ang hosted vs local.
- **Kung ang requirement ng panel ay “Section C – Super Admin lang”**, malinaw na sabihin sa video intro na Super Admin demo lang ang ipapakita at i-highlight ang mga bagong feature (Total Orders card, Store Performance table, All Orders view). Optional na lang ang customer at store owner flows.

---

### 10. Troubleshooting

- **White screen sa frontend** – siguraduhin tama ang `VITE_API_BASE_URL` at naka-enable ang CORS sa backend
- **Railway container natutulog** – mag-send ng request sa `/api/health` bago mag-demo o mag-upgrade sa Starter plan para “Always On”.
- **API 502/504** – check Railway Logs tab; kung need mo ng shell access, gumamit ng `railway run bash` (kung naka-install ang Railway CLI).
- **Images/QR hindi lumalabas** – verify Supabase/S3 credentials sa backend `.env`
- **Email hindi makapag-send** – double-check SMTP user/password at `from` address

---

Kung may additional requirements (e.g., Kubernetes, Docker, CI/CD), dagdagan lang itong dokumento sa parehong folder para may single source of truth.



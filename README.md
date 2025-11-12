# Structura - E-commerce Store Builder

A modern, full-stack e-commerce store builder that allows users to create and customize their online stores with beautiful templates.

## Features

- 🎨 **5 Beautiful Store Templates** - Pre-designed templates for different business types
- 🛍️ **Store Management** - Create and manage multiple stores
- 📦 **Product Management** - Add products with images, pricing, and inventory
- 🎨 **Visual Editor** - Customize your store with a rich text editor
- 📱 **Responsive Design** - Works on all devices
- 🔐 **User Authentication** - Secure user accounts and store ownership
- 🚀 **Easy Deployment** - Deploy to Vercel with Supabase backend

## Tech Stack

- **Frontend**: React, Vite, React Router
- **Backend**: Node.js, Express, Sequelize
- **Database**: PostgreSQL (Supabase)
- **Storage**: Supabase Storage
- **Deployment**: Vercel (Frontend + API)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Vercel account (for deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd capstone3
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   
   Create `backend/.env`:
   ```env
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
   SUPABASE_URL=https://[PROJECT].supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   JWT_SECRET=your-jwt-secret
   NODE_ENV=development
   PORT=5000
   ```

   Create `frontend/.env.local`:
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_SUPABASE_URL=https://[PROJECT].supabase.co
   ```

4. **Set up database**
   - Create Supabase project
   - Run `supabase/migrations/001_initial_schema.sql` in Supabase SQL Editor
   - Create storage buckets: `products` and `backgrounds` (both public)

5. **Run development servers**
   ```bash
   # Backend
   cd backend
   npm start

   # Frontend (in another terminal)
   cd frontend
   npm run dev
   ```

## Deployment

See `DEPLOYMENT.md` for detailed deployment instructions.

### Quick Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Set environment variables in Vercel dashboard
4. Deploy!

## Project Structure

```
capstone3/
├── api/                 # Vercel serverless functions
├── backend/            # Backend API
│   ├── controllers/   # Route controllers
│   ├── models/        # Database models
│   ├── routes/        # API routes
│   └── utils/         # Utilities
├── frontend/          # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/      # Page components
│   │   ├── utils/      # Frontend utilities
│   │   └── styles/     # CSS files
│   └── public/        # Static assets
├── supabase/          # Database migrations
└── templates/         # HTML templates
```

## Documentation

- `DEPLOYMENT.md` - Complete deployment guide
- `QUICK_START.md` - Quick start guide
- `MIGRATION_SUMMARY.md` - Migration summary
- `VERCEL_DEPLOYMENT_STEPS.md` - Vercel deployment steps

## License

MIT


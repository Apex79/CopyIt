# CopyIt

A modern document publishing platform. Upload or paste formatted documents and text, preview them, and publish one selected document. Public users can then view the published content and copy it with one click.

## Quick Start

### 1. Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) account

### 2. Supabase Setup

#### Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your **Project URL** and **anon public key** from Settings → API

#### Run the Database Migration

1. Go to the **SQL Editor** in your Supabase dashboard
2. Paste the contents of `supabase-setup.sql` and run it
3. This creates the `documents` table, RLS policies, triggers, and storage policies

#### Create the Storage Bucket

1. Go to **Storage** in your Supabase dashboard
2. Click **New Bucket**
3. Name it `documents`
4. Keep it **Private** (not public)

#### Create the Admin User

1. Go to **Authentication** → **Users** in your Supabase dashboard
2. Click **Add User** → **Create New User**
3. Enter your admin email and password
4. This is the only account that can access the admin panel

### 3. Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

> ⚠️ Never expose your `SUPABASE_SERVICE_ROLE_KEY` in frontend code.

### 4. Install & Run

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

## Usage

### Public Website

- Visit `/` to see the currently published document
- Click **"Copy All"** to copy the complete content to clipboard
- Works without any login

### Admin Panel

1. Navigate to `/admin-panel` (or `/admin-panel/login`)
2. Sign in with your admin credentials
3. **Upload** a document (PDF, DOCX, ODT, TXT, MD) or **paste** content
4. **Preview** the document to verify formatting
5. **Publish** to make it live on the public homepage
6. Only one document can be published at a time

## Features

- 📄 **Multi-format support** — PDF, DOCX, ODT, TXT, Markdown
- 🎨 **Rich text editor** — Headings, lists, tables, code blocks, formatting
- 📋 **One-click copy** — Copies both rich HTML and plain text
- 🔄 **Real-time updates** — Public page updates automatically via Supabase Realtime
- 🌓 **Dark mode** — System preference detection + manual toggle
- 📱 **Responsive** — Desktop, tablet, and mobile layouts
- 🔒 **Secure** — Supabase Auth + Row Level Security
- ✨ **macOS-inspired UI** — Rounded corners, soft shadows, glass effects

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS v4
- **Backend:** Supabase (Auth, PostgreSQL, Storage, Realtime)
- **Editor:** TipTap
- **Icons:** Lucide React
- **Document Processing:** mammoth (DOCX), pdfjs-dist (PDF), JSZip (ODT), marked (Markdown)

## Project Structure

```
src/
├── components/
│   ├── admin/          # Admin panel components
│   │   ├── AdminDashboard.tsx
│   │   ├── AdminLogin.tsx
│   │   ├── DocumentEditor.tsx
│   │   ├── DocumentLibrary.tsx
│   │   ├── DocumentPreview.tsx
│   │   └── FileUploader.tsx
│   ├── public/         # Public-facing components
│   │   ├── CopyButton.tsx
│   │   ├── DocumentHeader.tsx
│   │   ├── DocumentViewer.tsx
│   │   ├── EmptyState.tsx
│   │   └── Navbar.tsx
│   └── shared/         # Shared UI components
│       ├── ConfirmDialog.tsx
│       ├── LoadingStates.tsx
│       └── ThemeToggle.tsx
├── hooks/              # Custom React hooks
│   ├── useAuth.tsx
│   ├── useDocuments.ts
│   └── useTheme.tsx
├── lib/                # Utility libraries
│   ├── clipboard.ts
│   ├── documentProcessor.ts
│   └── supabase.ts
├── pages/              # Route pages
│   ├── AdminDashboardPage.tsx
│   ├── AdminLayout.tsx
│   ├── AdminLoginPage.tsx
│   ├── EditDocumentPage.tsx
│   ├── NewDocumentPage.tsx
│   └── PublicHome.tsx
├── types/
│   └── index.ts
├── App.tsx
├── main.tsx
└── index.css
```

## Security

- Only the Supabase **anon key** is used in the frontend (safe for browser)
- Row Level Security (RLS) ensures public users can only read published documents
- Admin routes are protected by Supabase authentication
- The `SUPABASE_SERVICE_ROLE_KEY` is **never** exposed to the client

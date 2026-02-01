# TingoBingo - System Architecture & Design Document

> **Last Updated:** January 30, 2026  
> **Project:** TingoBingo - The Pet's Social Super App  
> **Status:** In Development

---

## 🎯 Project Vision

TingoBingo is a social media platform designed specifically for pet owners to connect, share moments, and build a community around their beloved pets. Think of it as "Instagram meets Tinder for pets" - focusing on social networking, pet playdates, and community building.

---

## 🏗️ System Architecture

### **Architecture Decision: Hybrid Free-Tier Stack**

Due to network restrictions blocking Google Cloud services (Firestore), we've designed a hybrid architecture that maximizes free-tier offerings while maintaining reliability:

```
┌─────────────────────────────────────────────────────┐
│                   TingoBingo App                     │
│                  (Next.js 16 + React)                │
└─────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│  Firebase   │   │  Supabase   │   │ Cloudinary  │
│    Auth     │   │   Database  │   │   Storage   │
│             │   │             │   │             │
│ • Sign Up   │   │ • Profiles  │   │ • Images    │
│ • Login     │   │ • Posts     │   │ • Videos    │
│ • Sessions  │   │ • Chats     │   │ (25GB free) │
│ • Google    │   │ • Realtime  │   │             │
└─────────────┘   └─────────────┘   └─────────────┘
```

### **Why This Stack?**

| Service | Purpose | Why Chosen | Free Tier |
|---------|---------|------------|-----------|
| **Firebase Auth** | User authentication | Industry standard, easy Google login, not blocked by network | 10K users/month |
| **Supabase** | Database & Backend | Postgres-based, not blocked, realtime features, great free tier | 500MB DB, unlimited API requests |
| **Cloudinary** | Media storage | 25GB storage, auto-optimization, CDN, already configured | 25GB storage + bandwidth |

---

## 📊 Data Architecture

### **Database Schema (Supabase - PostgreSQL)**

#### **Users Table**
```sql
users (
  id: uuid PRIMARY KEY (from Firebase Auth)
  email: text UNIQUE NOT NULL
  name: text NOT NULL
  avatar: text (Cloudinary URL)
  bio: text
  breed: text
  age: text
  gender: text
  location: text
  created_at: timestamptz
  updated_at: timestamptz
)
```

#### **Posts Table**
```sql
posts (
  id: uuid PRIMARY KEY
  user_id: uuid REFERENCES users(id)
  content: text
  image_url: text (Cloudinary URL)
  likes_count: integer DEFAULT 0
  created_at: timestamptz
)
```

#### **Chats Table**
```sql
chats (
  id: uuid PRIMARY KEY
  participant_1: uuid REFERENCES users(id)
  participant_2: uuid REFERENCES users(id)
  last_message: text
  updated_at: timestamptz
)

messages (
  id: uuid PRIMARY KEY
  chat_id: uuid REFERENCES chats(id)
  sender_id: uuid REFERENCES users(id)
  content: text
  created_at: timestamptz
)
```

---

## 🔐 Authentication Flow

```
User → Sign Up/Login (Firebase Auth)
         ↓
   Get Firebase UID
         ↓
   Create/Update User Profile (Supabase)
         ↓
   Session Active
```

**Implementation:**
- Firebase handles all auth (email/password, Google OAuth)
- On successful auth, sync user data to Supabase `users` table
- Use Firebase ID token for Supabase Row Level Security (RLS)

---

## 🖼️ Media Upload Flow

```
User selects image/video
         ↓
   Compress media (browser-side)
         ↓
   Upload to Cloudinary
         ↓
   Get secure_url
         ↓
   Save URL to Supabase
```

**Current Setup:**
- ✅ Cloudinary preset: `tingobingo_uploads`
- ✅ Cloudinary cloud name: `danhvu5xb`
- ✅ Compression via `compressImage()` utility
- ✅ Unsigned uploads (no server-side needed)

---

## 📁 Current Project Structure

```
TingoBingo/
├── src/
│   ├── app/
│   │   ├── page.tsx           # Landing page
│   │   ├── auth/
│   │   │   ├── login/         # Login page
│   │   │   └── signup/        # Signup page
│   │   ├── profile/
│   │   │   ├── page.tsx       # Profile view
│   │   │   └── edit/          # Edit profile
│   │   ├── messages/          # Chat system
│   │   └── globals.css        # Global styles
│   ├── components/
│   │   ├── feed/
│   │   │   └── FeedView.tsx   # Main feed (Cloudinary integrated)
│   │   ├── profile/
│   │   │   └── ProfileView.tsx # Profile display
│   │   └── navigation/        # Bottom nav
│   ├── context/
│   │   ├── AuthContext.tsx    # Firebase Auth state
│   │   ├── SocialContext.tsx  # Posts management
│   │   └── ChatContext.tsx    # Chat state
│   ├── lib/
│   │   ├── firebase.ts        # Firebase config (Auth only)
│   │   ├── supabase.ts        # TODO: Supabase client
│   │   ├── cloudinary.ts      # Cloudinary helper
│   │   └── utils.ts           # compressImage(), etc.
│   └── ...
├── .env.local                 # Environment variables
├── ARCHITECTURE.md            # This file
└── package.json
```

---

## 🔧 Technology Stack

### **Frontend**
- **Framework:** Next.js 16 (App Router, React 18)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Custom CSS
- **Icons:** Lucide React

### **Backend Services**
- **Authentication:** Firebase Auth v10
- **Database:** Supabase (PostgreSQL 15)
- **Storage:** Cloudinary
- **Hosting:** Vercel (recommended) or Netlify

### **Key Libraries**
```json
{
  "firebase": "^10.x",
  "@supabase/supabase-js": "^2.x", // TODO: Install
  "cloudinary": "^2.x",
  "next": "16.1.6",
  "react": "^18"
}
```

---

## ⚠️ Known Issues & Solutions

### **Issue 1: Firestore Connection Blocked**
- **Problem:** Network blocks `firestore.googleapis.com` (404 errors)
- **Root Cause:** ISP/firewall blocking Google Cloud APIs
- **Solution:** Migrate from Firestore to Supabase (in progress)

### **Issue 2: Profile Updates Timeout**
- **Problem:** Profile save hangs indefinitely
- **Root Cause:** Firestore connection failure
- **Status:** Will be resolved after Supabase migration

### **Issue 3: Firebase Storage Billing**
- **Problem:** Firebase Storage required billing info
- **Solution:** ✅ Migrated to Cloudinary (completed)

---

## 🚀 Implementation Roadmap

### **Phase 1: Supabase Migration** (Next Step)
- [ ] Create Supabase project
- [ ] Set up database schema (users, posts, chats)
- [ ] Install `@supabase/supabase-js`
- [ ] Create `src/lib/supabase.ts`
- [ ] Update contexts to use Supabase
- [ ] Migrate profile edit to Supabase
- [ ] Test profile save functionality

### **Phase 2: Core Features**
- [ ] User profile management (view, edit) - Using Supabase
- [ ] Post creation with images - Using Cloudinary
- [ ] Feed with infinite scroll
- [ ] Like/comment system
- [ ] Real-time chat - Using Supabase Realtime

### **Phase 3: Social Features**
- [ ] Pet discovery (swipe/match)
- [ ] Pet playdate scheduling
- [ ] Location-based pet finder
- [ ] Notifications system

### **Phase 4: Polish & Deploy**
- [ ] PWA support
- [ ] Performance optimization
- [ ] SEO optimization
- [ ] Deploy to production (Vercel)

---

## 🔑 Environment Variables

**Required in `.env.local`:**

```bash
# Firebase (Auth only)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC-_ZmW6ctI0Yf0AJ-WCnAqSrwSGpoOpk4
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tingo-bingo.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tingo-bingo

# Cloudinary (Storage)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=danhvu5xb
NEXT_PUBLIC_CLOUDINARY_API_KEY=769878515449197
CLOUDINARY_API_SECRET=uHxlyttpnDHYm2ywmSPvzHq_6rQ

# Supabase (Database) - TODO: Add after setup
NEXT_PUBLIC_SUPABASE_URL=<your-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

---

## 🎨 Design System

### **Color Palette**
- Primary: `#FF4458` (Vibrant Pink)
- Secondary: `#8B5CF6` (Purple)
- Background: `#F8F9FA` (Light Gray)
- Text: `#1F2937` (Dark Gray)

### **Typography**
- Font: System Sans-Serif
- Headings: Bold, tracking-tight
- Body: Regular, readable

### **Components**
- Neubrutalism design language
- Bold borders, vibrant colors
- High contrast, fun aesthetic

---

## 📝 Next Session Checklist

When you return to this project:

1. **Read this file first** to understand the architecture
2. **Check `.env.local`** - ensure all keys are present
3. **Review `src/lib/firebase.ts`** - Firebase Auth only (not Firestore)
4. **Review `src/lib/cloudinary.ts`** - Image uploads working
5. **TODO:** Set up Supabase if not done yet
6. **Run:** `npm run dev` to start development server
7. **Known blocker:** Profile saves don't work until Supabase is set up

---

## 🤝 Contributing

This is a solo project by the user. When working on features:

1. Always check this ARCHITECTURE.md first
2. Follow the hybrid stack pattern (Firebase Auth + Supabase + Cloudinary)
3. Keep code clean and TypeScript strict
4. Test on localhost:3000 before deploying

---

## 📞 Support Resources

- **Firebase Console:** [console.firebase.google.com/project/tingo-bingo](https://console.firebase.google.com/project/tingo-bingo)
- **Cloudinary Dashboard:** [console.cloudinary.com](https://console.cloudinary.com)
- **Supabase Dashboard:** TODO: Add after setup
- **Deployment:** Vercel (recommended)

---

**End of Architecture Document** 🎉

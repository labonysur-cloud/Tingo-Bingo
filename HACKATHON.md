# TingoBingo — Hackathon Submission

<div align="center">
  <img src="./public/logo.png" alt="TingoBingo Logo" width="120"/>

  ### A Feature-Rich Social Platform for Pet Lovers
  
  **Live Demo**: https://tingo-bingo.vercel.app/  
  **Repository**: https://github.com/labonysur-cloud/Tingo-Bingo
</div>

---

## Project Overview

**TingoBingo** is a full-stack social media and marketplace platform built exclusively for pet owners and animal lovers. It combines social networking, real-time communication, e-commerce, AI-powered tools, emergency services, and gamification into a single cohesive experience.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + TypeScript + Tailwind CSS 4 |
| Database | Supabase (PostgreSQL + Realtime) |
| Authentication | Firebase Auth |
| Media Storage | Cloudinary |
| AI | HuggingFace Inference API |
| Email | Resend |
| Deployment | Vercel |

---

## Key Features & Updates

### 🔐 Security Architecture — Custom JWT Bridge
- Firebase Auth tokens are verified server-side and a Supabase-compatible JWT is minted
- All database queries and real-time subscriptions are secured with Row Level Security (RLS)
- `auth.uid()` in RLS policies maps to Firebase UID — true per-user data isolation
- Merged dual realtime subscriptions into single channel to prevent binding mismatches

### 📱 Social Feed
- Create, like, comment, and share posts with photos/videos
- Nested comment replies with null-safety guards
- Saved posts (Moodboard) in Pinterest-style grid layout
- Real-time like and comment count triggers

### 📖 Stories & Highlights
- 24-hour ephemeral stories
- Permanent highlight collections (curated story archives)
- Story viewer with navigation

### 🎬 Tangii (Reels / Short Videos)
- Upload and watch short-form videos
- Like, comment, and share reels
- Reel link previews in chat
- Tangii videos on profile pages with full interaction support

### 💬 Real-Time Chat & Messaging
- Private 1-to-1 messaging with Supabase Realtime
- Message history with search
- Typing indicators and online status
- Media sharing in messages
- Rich chat link previews (reels, posts)

### 🐾 Pet Profiles
- Multi-pet management per user
- Detailed pet info: breed, age, gender, medical records
- Primary pet designation
- Rich media uploads for pet photos

### 👤 User Profiles
- Customizable bio, location, avatar
- Follow / unfollow system with follower/following counts
- Profile navigation with follow button in Tangii feed
- Profile pages display all Tangii videos and posts

### 🛒 Shop / Marketplace
- Product listings with images, descriptions, and prices
- Create and manage listings
- Shopping cart functionality
- Seller profiles and reviews
- Coming-soon overlay for unreleased features

### 🚨 Emergency SOS
- Location-based emergency vet services finder
- Interactive map (react-leaflet)
- Community safety alerts: create, respond, update
- Alert detail modals with full information

### 🤖 AI Integration — Zoothopilia
- AI-powered pet care recommendations
- Image analysis for pets (HuggingFace)
- Chat-style interface for pet queries

### 🎮 Gaming Hub
- **TamagotchiGame** — virtual pet with pixel art sprites, particle effects
- **TingoJump** — platformer mini-game
- **CatchTheLazr** — catch the laser dot mini-game
- Game context for shared state management

### 🔔 Notifications
- Real-time notification bell with unread count badge
- Notification dropdown with history
- Database triggers auto-generate notifications for likes, comments, follows

### 📧 Email System
- Welcome emails on signup (Resend)
- Login notification emails
- Password reset emails
- Account deletion confirmation emails

### 🗺️ Onboarding
- First-run onboarding flow with username setup
- Profile completion guidance

### 🔎 Search
- User and content search

### ⚙️ Settings
- Account preferences management (v2.0.0)
- Account deletion with CASCADE cleanup
- Privacy controls

### 🌐 SEO & Discoverability
- Google site verification
- Dynamic sitemap generation (`/sitemap.ts`)
- Open Graph and meta tags

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                        Client (Next.js)                       │
│  React 19 + TypeScript + Tailwind CSS + Firebase Auth SDK    │
└─────────────────────────────┬────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
  ┌─────────────────────┐         ┌─────────────────────┐
  │   Firebase Auth     │         │   Next.js API Routes │
  │  (Email / Google)   │────────►│  /api/auth/supabase- │
  └─────────────────────┘  token  │  token (JWT minting) │
                                  └──────────┬────────────┘
                                             │
                              ┌──────────────▼──────────────┐
                              │         Supabase             │
                              │  PostgreSQL + RLS + Realtime │
                              └─────────────────────────────┘
                                             │
              ┌──────────────────────────────┤
              ▼                              ▼
  ┌─────────────────────┐       ┌─────────────────────────┐
  │     Cloudinary      │       │       HuggingFace AI     │
  │  Images + Videos    │       │    Pet Analysis + Chat   │
  └─────────────────────┘       └─────────────────────────┘
```

---

## Database Schema Highlights

- **profiles** — User accounts with bio, location, avatar, follow counts
- **posts** — Social feed posts with likes, comments, save counts
- **stories / highlights** — Ephemeral and permanent story collections
- **reels** — Short video content with interactions
- **chats / messages** — Real-time messaging with media support
- **pets** — Multi-pet profiles per user
- **products** — Marketplace listings with cart support
- **notifications** — Event-driven notification system
- **emergency_alerts** — Community safety alerts
- **tamagotchi** — Virtual pet game state
- **follows** — Social graph (follower/following relationships)

All tables are protected by Row Level Security (RLS) policies ensuring data privacy and integrity.

---

## Running Locally

```bash
# 1. Clone
git clone https://github.com/labonysur-cloud/Tingo-Bingo.git
cd Tingo-Bingo

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Fill in Supabase, Firebase, Cloudinary, Resend credentials

# 4. Set up Supabase database
# Run supabase-final-schema.sql in the Supabase SQL Editor
# Then run complete-fix-posts-products-save.sql

# 5. Start development server
npm run dev
```

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_JWT_SECRET=

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Resend (Email)
RESEND_API_KEY=
```

---

## Recent Updates (Hackathon Sprint)

| Commit | Update |
|--------|--------|
| Fix realtime | Merged dual subscriptions into single channel — fixes binding mismatch |
| Fix RLS | Use `auth.jwt() sub` instead of `auth.uid()` for Firebase UID compatibility |
| Fix auth flow | Move `setAuth` before subscribe; add `supabaseReady` guards |
| Fix token | Decode Firebase token directly (removed deprecated Google API call) |
| Fix env | Add Firebase API key to environment configuration |
| Security | Custom JWT bridge: Firebase → Supabase with full RLS enforcement |
| Feature | Supabase Custom JWT security for messaging — authenticated client, strict RLS |
| Feature | Tangii videos on profile pages with full interaction support |
| Feature | Profile navigation and follow button in Tangii feed |
| Feature | Slide-out side menu navigation |
| Feature | Share functionality and rich chat previews |
| Feature | Real-time notification system with bell, dropdown, and database triggers |
| Feature | Account deletion with CASCADE deletes and confirmation email |
| Feature | Email notification system (welcome, login, reset) |
| Feature | Forgot password with email reset |
| Feature | Multi-pet system with profile redesign |
| Feature | Tamagotchi virtual pet game |
| Feature | Emergency SOS with location-based services |

---

<div align="center">
  Made with ❤️ for pet lovers everywhere — TingoBingo Hackathon 2026
</div>

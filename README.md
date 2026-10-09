# NutriTrack AI — Multi-User AI Calorie & Nutrition Tracking Platform

NutriTrack AI is a full-stack, production-grade nutrition and macronutrient tracking web application powered by **Google Gemini AI** and **Firebase Cloud Firestore**. It provides multi-item visual food recognition from photos, conversational nutrition intelligence, personalized meal recommendations, and a validated **Mifflin-St Jeor** metabolic calculation engine with specialized support for Asian and Filipino cuisine.

---

## 🌟 Key Features

1. **Closed Member Architecture & RBAC (Role-Based Access Control)**
   - **No public user registration**. User accounts are strictly provisioned by an administrator.
   - Distinct roles: `ADMIN` and `USER` enforced via Firebase Authentication & Cloud Firestore Security Rules.
   - Administrators can create accounts with temporary credentials, deactivate/reactivate users, and trigger password resets.

2. **First-Time User Onboarding Wizard**
   - 6-step wizard collecting biological sex, age, height, weight, activity multiplier, target goal, dietary preferences, and allergies.
   - Automatically calculates BMR, TDEE, goal-adjusted calorie target, and protein/carb/fat/fiber splits.
   - Clinical safety floors (minimum 1,200 kcal for females, 1,500 kcal for males) with safety alerts against unsafe extreme deficits.

3. **Modern Daily Calorie & Macro Dashboard**
   - Interactive circular calorie progress gauge showing Target, Consumed, and Remaining kcal.
   - Real-time macro progress bars for Protein, Carbohydrates, Fat, and Dietary Fiber.
   - Categorized meal breakdowns (Breakfast, Lunch, Dinner, Snacks) with immediate inline editing and deletion.

4. **Multi-Item AI Food Photo Analysis**
   - Direct camera snap or file upload with automatic client-side image compression.
   - Server-side multi-modal analysis using Google's `gemini-3.8-flash` model.
   - Identifies multiple individual dishes and portions (e.g. Chicken Adobo + Steamed Rice).
   - Returns structured JSON with estimated serving weights (g), calories, and macros with confidence ratings.
   - Required medical disclaimer: *"AI nutrition estimates are approximate. Please verify serving sizes and nutrition information when accuracy is important."*
   - Interactive review screen: edit portion weights and values before saving to the daily log.

5. **Conversational AI Nutrition Assistant**
   - Real-time dietary advisor grounded with live context (today's consumed calories/macros, remaining budget, user goals, and allergies).
   - Prompt suggestions: *"I have 700 calories left. What should I eat?"*, *"Give me a high-protein Filipino meal under 600 calories."*
   - Strict medical safety guardrails: clearly informs users it is an educational tool, not a medical diagnosis system.

6. **Smart Meal Recommendations**
   - Generates tailored meal ideas matching remaining macro targets and dietary preferences.
   - Complete with ingredient checklists, preparation instructions, and 1-click **Log Meal** integration.

7. **Rich Asian & Filipino Food Catalogue**
   - Pre-loaded database including Chicken Adobo, Pork Sinigang, Tinola, Sisig, Kare-Kare, Pancit Canton, Lumpia Shanghai, Tapsilog, Bangusilog, Sinangag (Garlic Rice), Pinakbet, Bicol Express, Champorado, and more.

8. **Weight Tracking & Analytics**
   - Log weigh-ins with date and notes.
   - Interactive SVG progress chart showing trajectory against target weight baseline.
   - Long-term nutrition history with 7-day, 30-day, and custom date range filters.

---

## 🏗️ Project Architecture

```
├── .env.example                     # Environment template (NO SECRETS)
├── .gitignore                       # Git ignore file
├── firebase-blueprint.json          # Firestore Schema Intermediate Representation
├── firebase.json                    # Firebase deployment config (Firestore, Hosting, Functions, Storage)
├── firestore.rules                  # Hardened Firestore Security Rules (RBAC, PII isolation)
├── firestore.indexes.json           # Composite database indexes
├── storage.rules                    # Firebase Storage security rules
├── functions/                       # Firebase Cloud Functions (Admin user provisioning)
│   ├── package.json
│   ├── tsconfig.json
│   └── src/index.ts
├── index.html                       # Application HTML entry point
├── metadata.json                    # Google AI Studio metadata
├── package.json                     # Dependencies & execution scripts
├── server.ts                        # Fullstack Express entry point (Gemini AI proxy & Vite middlewares)
├── src/
│   ├── main.tsx                     # React root mount
│   ├── App.tsx                      # Main app coordinator & view routing
│   ├── index.css                    # Tailwind CSS & theme definitions
│   ├── types/
│   │   └── index.ts                 # TypeScript types (UserAccount, FoodLogEntry, etc.)
│   ├── services/
│   │   ├── firebase.ts              # Firebase client SDK initialization & error handlers
│   │   ├── dataService.ts           # Unified data access layer (Firestore & Local reactive store)
│   │   ├── nutritionCalculator.ts   # Mifflin-St Jeor engine, TDEE, & macro calculations
│   │   └── nutritionCalculator.test.ts # Automated test suite for calculation engine
│   ├── data/
│   │   └── foodDatabase.ts          # Asian & Filipino nutritional food catalogue
│   ├── context/
│   │   └── AuthContext.tsx          # Authentication & RBAC state management
│   ├── components/
│   │   ├── Navbar.tsx               # Responsive header, brand, and navigation
│   │   └── OnboardingWizard.tsx     # 6-step profile setup wizard
│   └── pages/
│       ├── LoginPage.tsx            # Member login & forgot password flow
│       ├── DashboardPage.tsx        # Calorie gauges, macros, & meals list
│       ├── FoodLogPage.tsx          # Manual logger & food search
│       ├── AnalyzePhotoPage.tsx     # AI camera analysis & portion verification
│       ├── AiAssistantPage.tsx      # Conversational nutrition chatbot
│       ├── MealRecommendationsPage.tsx # Recipe cards matching remaining macros
│       ├── WeightPage.tsx           # Weigh-in tracker & trend chart
│       ├── HistoryPage.tsx          # Adherence bar chart & historical analytics
│       ├── ProfilePage.tsx          # Profile & target recalculator
│       └── AdminDashboardPage.tsx   # User management portal (Admin only)
├── tsconfig.json
└── vite.config.ts
```

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Node.js version 20+ installed.
- npm or yarn.

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/your-username/nutritrack-ai.git
cd nutritrack-ai

# Install root dependencies
npm install
```

### 3. Environment Setup
Copy the example environment configuration:
```bash
cp .env.example .env
```
Open `.env` and fill in:
1. `GEMINI_API_KEY`: Obtain from [Google AI Studio](https://aistudio.google.com/).
2. `VITE_FIREBASE_*`: Your Firebase Web App configuration (see section below).

> **Note**: Even before you configure your own Firebase keys, NutriTrack AI runs immediately out-of-the-box in local development mode with instant test accounts (`admin@nutritrack.ai` and `user@nutritrack.ai`).

### 4. Run the Automated Tests
Verify that the Mifflin-St Jeor formula, TDEE multipliers, macro splits, and safety floors pass all assertions:
```bash
npm test
```

### 5. Launch the Full-Stack Dev Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔥 Firebase Setup & Deployment Guide

### 1. Create a Firebase Project
1. Navigate to the [Firebase Console](https://console.firebase.google.com/) and click **Add Project**.
2. Name your project (e.g., `nutritrack-prod`).
3. Enable **Google Analytics** (optional).

### 2. Enable Authentication
1. In the left sidebar, go to **Build -> Authentication**.
2. Click **Get Started**, choose **Email/Password**, and enable it. (Do not enable public registration in your client application; only administrators will create user accounts).

### 3. Provision Cloud Firestore
1. Go to **Build -> Firestore Database** -> **Create Database**.
2. Select your preferred Cloud Region (e.g., `asia-southeast1` or `us-central1`).
3. Start in **Production mode**.

### 4. Enable Firebase Storage
1. Go to **Build -> Storage** -> **Get Started**.
2. Select default security rules and your chosen region.

### 5. Obtain Web App Credentials
1. Go to **Project Settings** (gear icon) -> **General**.
2. Under **Your apps**, click the **Web (`</>`)** icon.
3. Register your app (e.g., `nutritrack-web`).
4. Copy the `firebaseConfig` keys and place them into your `.env` file:
   ```env
   VITE_FIREBASE_API_KEY="AIzaSy..."
   VITE_FIREBASE_AUTH_DOMAIN="nutritrack-prod.firebaseapp.com"
   VITE_FIREBASE_PROJECT_ID="nutritrack-prod"
   VITE_FIREBASE_STORAGE_BUCKET="nutritrack-prod.firebasestorage.app"
   VITE_FIREBASE_MESSAGING_SENDER_ID="123456789012"
   VITE_FIREBASE_APP_ID="1:123456789012:web:..."
   ```

### 6. Deploy Security Rules & Indexes
Install the Firebase CLI globally if you haven't already:
```bash
npm install -g firebase-tools
firebase login
firebase use --add nutritrack-prod

# Deploy Firestore Security Rules & Indexes
firebase deploy --only firestore:rules,firestore:indexes

# Deploy Storage Security Rules
firebase deploy --only storage
```

### 7. Deploy Firebase Cloud Functions (Admin Provisioning)
```bash
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions
```

---

## 🛡️ Creating the First Administrator Account

Because public registration is disabled, the first administrator is bootstrapped securely:

1. In the **Firebase Console**, go to **Authentication -> Users** -> **Add user**.
2. Enter the admin email (e.g. `admin@nutritrack.ai`) and a strong password.
3. Go to **Cloud Firestore** -> **Start collection** -> Collection ID: `users` -> Document ID: `<The UID generated in Auth>`.
4. Add the following fields:
   - `uid`: `string` = `<The UID>`
   - `email`: `string` = `admin@nutritrack.ai`
   - `displayName`: `string` = `System Administrator`
   - `role`: `string` = `ADMIN`
   - `status`: `string` = `active`
   - `createdAt`: `timestamp` = Current timestamp
   - `updatedAt`: `timestamp` = Current timestamp
5. Also create a document in the `admins` collection with ID `<The UID>`:
   - `email`: `admin@nutritrack.ai`
   - `assignedAt`: Current timestamp
6. Now log in at [http://localhost:3000](http://localhost:3000). As an administrator, you can now access the **Admin Portal** to create user accounts directly from the UI without touching Firestore manually!

---

## 🤖 Google Gemini AI Setup

1. Visit [Google AI Studio](https://aistudio.google.com/).
2. Create a new API key.
3. Set the key in your `.env` file:
   ```env
   GEMINI_API_KEY="AIzaSyYourGeminiApiKeyHere"
   ```
4. **Security Notice**: `GEMINI_API_KEY` is strictly accessed on the backend inside `server.ts`. It is **never** bundled or exposed to the client browser.

---

## 📦 Production Deployment

### Option A: Full-Stack Container (Google Cloud Run / Render / Railway)
1. Build the frontend bundle:
   ```bash
   npm run build
   ```
2. Start the fullstack Node/Express server:
   ```bash
   npm start
   ```
3. Set production environment variables in your hosting provider's secrets panel:
   - `GEMINI_API_KEY`
   - `PORT=3000`
   - `NODE_ENV=production`
   - `VITE_FIREBASE_*` variables

### Option B: Firebase Hosting + Cloud Functions
```bash
npm run build
firebase deploy
```

---

## 🧪 Testing

Run the automated test runner:
```bash
npm test
```
Tests verify:
- Mifflin-St Jeor BMR calculations for male and female profiles.
- Activity level TDEE multipliers (sedentary, light, moderate, very active, extra active).
- Goal adjustments (mild, standard, aggressive weight loss; maintenance; surplus).
- Clinical safety floors (clamping to 1,200 kcal for women and 1,500 kcal for men).
- Macronutrient distributions and fiber calculation.
- Daily consumed sums and remaining budget calculations.

---

## 📋 Security Architecture

- **Zero-Trust ABAC**: Subcollection data (`foodLogs`, `weightLogs`, `aiChats`) enforces `request.auth.uid == userId`.
- **Role Isolation**: Users cannot promote themselves to `ADMIN` or alter RBAC documents.
- **PII Protection**: User lists are restricted to administrators.
- **Content-Type & File Size Safeguards**: Food photo uploads are compressed client-side and verified server-side.

---

## 📝 License
Apache-2.0

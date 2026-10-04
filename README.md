# 🩸 HemoGo — 24/7 Emergency Blood & Platelet Donor Network

A production-ready, full-stack emergency blood connection platform built with **React / TypeScript**, **Tailwind CSS**, **Firebase (Auth & Firestore)**, **Firebase Cloud Functions**, and **Razorpay Payments**.

---

## 🚀 Overview of Completed Phases

### 🛡️ Phase 1: Database & Security (Backend Focus)
- **Firebase Authentication**: Phone/SMS OTP login with reCAPTCHA verifier and simulation test mode.
- **Database Schemas**: Strictly typed Firestore collections:
  - `/users/{uid}`: Profile, role, PIN code, `premiumStatus`, and expiry timestamps.
  - `/donors/{uid}`: Blood group, live availability, 90-day cooldown state, PIN code location, and protected contact info.
  - `/subscriptions/{id}`: ₹299/year Razorpay order tracking, cryptographic signatures, and status.
  - `/bloodRequests/{id}`: Real-time emergency requests (`#HG10245`) with hospital PIN code and urgency classification.
  - `/matches/{id}`: Multi-tier location & priority scoring (`SAME_PIN` vs `NEIGHBOR_PIN`) and 6-question preliminary medical screening records.
  - `/auditLogs/{id}`: Comprehensive security & access audit logs.
- **Security Rules (`firestore.rules`)**:
  - Strict zero-scrape donor privacy (normal users cannot query or browse donor directory).
  - Donor phone numbers are only unlocked in `/matches` after the donor explicitly accepts and completes medical screening.
  - Subscription writes restricted exclusively to Cloud Functions / Firebase Admin SDK.

### ⚡ Phase 2: Core Cloud Functions & Razorpay Backend Focus
- **Donor Availability & 90-Day Cooldown Engine (`functions/src/donor/donorLogic.ts`)**:
  - `toggleDonorAvailability`: Enforces medical recovery cooldown (cannot be available if `< 90 days` from last whole blood donation).
  - Multi-tier matching algorithm (Priority 1: Same PIN Premium $\rightarrow$ Priority 2: Neighbor PIN Premium $\rightarrow$ Priority 3: Same PIN Regular $\rightarrow$ Priority 4: Neighbor PIN Regular).
  - `acceptBloodRequest`: Validates 6 preliminary screening questions, shares mutual contact info, and marks request as `CONTACT_SHARED`.
  - `rejectBloodRequest`: Records rejection and prevents duplicate notifications.
- **Razorpay Subscription Engine (`functions/src/razorpay/subscriptionEngine.ts`)**:
  - `createRazorpayOrder`: Generates cryptographically signed Razorpay order for ₹299/year annual plan.
  - `verifyRazorpayPayment`: Validates HMAC-SHA256 signature using `RAZORPAY_KEY_SECRET`, atomically updates `subscriptions` status to `paid`, and upgrades `users/{uid}` to `premiumStatus = true`.
  - `razorpayWebhook`: Handles asynchronous background payment events (`payment.captured`, `order.paid`).

### 💻 Phase 3: Frontend Implementation (React / Next.js / Vite / Tailwind)
- **Home Landing Page**: *"When Every Drop Matters."*, "How It Works", Safety disclaimer, and prominent **Request Blood** / **Become a Donor** CTAs.
- **Emergency Request Flow**: 2-step flow with mandatory summary confirmation screen (`"Blood Group: O+ | Hospital: XYZ Hospital | PIN Code: 530016 | Units: 2"` $\rightarrow$ **RAISE EMERGENCY REQUEST**).
- **Requester Real-Time Dispatch Status**: Live tracking for `#HG10245`, notified count, and real-time accepted donor cards with direct **Call Donor** dialer button!
- **Donor Dashboard**: Live availability switch, real-time incoming emergency alerts with `[ ACCEPT ]` and `[ REJECT ]`, 6-question preliminary screening questionnaire, and request history.
- **Admin Command Center**: Database filters by blood group and PIN code, requests monitor, matching telemetry, and audit logs.
- **HemoGo Premium Upgrade**: ₹299/year Razorpay checkout integration with instant confetti activation.

---

## 🛠️ Project Structure

```
hemogo-app/
├── package.json               # Frontend dependencies & scripts
├── vite.config.ts             # Vite configuration with Tailwind CSS plugin
├── firestore.rules            # Strict Firestore zero-scrape security rules
├── firestore.indexes.json     # Compound indexes for fast blood & location queries
├── firebase.json              # Hosting, Functions & Firestore configs
├── .env.example               # Environment variables template
├── functions/                 # Firebase Cloud Functions backend
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts
│       ├── config/firebase.ts
│       ├── donor/donorLogic.ts
│       └── razorpay/subscriptionEngine.ts
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css              # Tailwind CSS & glassmorphism styling
    ├── types/database.ts      # TypeScript interfaces
    ├── config/firebase.ts     # Firebase client SDK initialization
    ├── services/
    │   ├── authService.ts     # Phone Auth & OTP confirmation
    │   ├── donorService.ts    # Availability, Cooldowns & Blood Matching
    │   ├── emergencyService.ts# Emergency request creation & matching dispatch
    │   └── razorpayService.ts # Razorpay order & signature verification
    └── components/
        ├── common/Navbar.tsx
        ├── home/LandingPage.tsx
        ├── auth/PhoneAuthModal.tsx
        ├── onboarding/DonorRegisterModal.tsx
        ├── onboarding/EmergencyRequestModal.tsx
        ├── dashboard/DonorDashboard.tsx
        ├── emergency/RequesterLiveStatus.tsx
        ├── admin/AdminDashboard.tsx
        └── premium/PremiumModal.tsx
```

---

## 🚀 Running the App Locally

### 1. Start the Frontend Web App
```bash
npm install
npm run dev
```

### 2. Deploy Cloud Functions & Security Rules to Firebase
```bash
# Deploy Firestore rules, indexes, and Cloud Functions
firebase deploy --only firestore,functions
```

---

## 🧪 Built-in Test Personas (Instant 1-Click Testing)
1. **Rahul Sharma** (O+ Active Donor - Eligible & Available)
2. **Pooja Varma** (A+ Donor - In 90-Day Medical Cooldown)
3. **Anil Kumar** (Emergency Requester tracking #HG10245)
4. **Dr. Siddharth Sen** (HemoGo Super Administrator)

# 🩸 HemoGo — 24/7 Emergency Blood & Platelet Donor Network

A full-stack, real-time blood emergency dispatch application built with **React / TypeScript**, **Firebase (Auth & Firestore)**, **Firebase Cloud Functions**, and **Razorpay Payments**.

---

## 🚀 Overview of Completed Phases

### 🛡️ Phase 1: Database & Security (Backend Focus)
- **Firebase Authentication**: Phone/SMS OTP login with reCAPTCHA verifier and simulation test mode.
- **Database Schemas**: Strictly typed Firestore collections:
  - `/users/{uid}`: Profile, role, `premiumStatus`, and expiry timestamps.
  - `/donors/{uid}`: Blood group, live availability, 90-day cooldown state, geocoded location, medical eligibility, and protected contact info.
  - `/subscriptions/{id}`: Razorpay order tracking, cryptographic signatures, and status.
  - `/emergency_requests/{id}`: Real-time SOS alerts with hospital coordinates and urgency classification.
  - `/donations_history/{id}`: Tamper-proof digital donation records and certificates.
- **Security Rules (`firestore.rules`)**:
  - Protected donor phone numbers and WhatsApp info.
  - Users cannot self-escalate `premiumStatus` or modify cooldown timestamps directly.
  - Subscription collection write access restricted exclusively to Cloud Functions / Firebase Admin SDK.

### ⚡ Phase 2: Core Cloud Functions & Razorpay Backend Focus
- **Donor Availability & 90-Day Cooldown Engine (`functions/src/donor/donorLogic.ts`)**:
  - `toggleDonorAvailability`: Enforces medical recovery cooldown (cannot be available if `< 90 days` from last whole blood donation).
  - `recordDonation`: Generates unique certificate ID, updates metrics, turns OFF live availability, and calculates `cooldownUntil = now + 90 days`.
- **Razorpay Subscription Engine (`functions/src/razorpay/subscriptionEngine.ts`)**:
  - `createRazorpayOrder`: Generates cryptographically signed Razorpay order in INR.
  - `verifyRazorpayPayment`: Validates HMAC-SHA256 signature using `RAZORPAY_KEY_SECRET`, atomically updates `subscriptions` status to `paid`, and upgrades `users/{uid}` to `premiumStatus = true`.
  - `razorpayWebhook`: Handles asynchronous background payment events (`payment.captured`, `order.paid`).

### 💻 Phase 3: Frontend Implementation (React / Next.js / Vite)
- **Authentication UI**: Phone number input (+91 country picker), invisible/visible reCAPTCHA, and 6-digit OTP verification keypad with quick test personas.
- **Registration Flows**:
  - Multi-step **Donor Registration**: Blood group card grid, City/Location selector, and Medical eligibility checklist.
  - Fast **Emergency Request Broadcast**: Urgency levels (Critical <2h, Urgent <12h, Routine), hospital picker, and unit counter.
- **Dashboards**:
  - **Donor Dashboard**: Live "Available to Donate" toggle switch with animated pulses, 90-day cooldown circular progress ring, and digital certificates timeline.
  - **Emergency Feed & Donor Search**: Filter available donors by blood group compatibility and city; contact numbers protected with 1-click **HemoGo Premium** unmasking.
  - **HemoGo Premium Checkout**: Razorpay payment modal with instant confetti celebration and perk unlock.

---

## 🛠️ Project Structure

```
hemogo-app/
├── package.json               # Frontend dependencies & scripts
├── vite.config.ts             # Vite configuration
├── firestore.rules            # Strict Firestore field-level security rules
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
    ├── index.css              # Glassmorphism & blood emergency styling
    ├── types/database.ts      # TypeScript interfaces
    ├── config/firebase.ts     # Firebase client SDK initialization
    ├── services/
    │   ├── authService.ts     # Phone Auth & OTP confirmation
    │   ├── donorService.ts    # Availability, Cooldowns & Blood Matching
    │   ├── emergencyService.ts# SOS alerts broadcast & response pledge
    │   └── razorpayService.ts # Razorpay order & signature verification
    └── components/
        ├── common/Navbar.tsx
        ├── auth/PhoneAuthModal.tsx
        ├── onboarding/DonorRegisterModal.tsx
        ├── onboarding/EmergencyRequestModal.tsx
        ├── dashboard/DonorDashboard.tsx
        ├── emergency/EmergencyFeed.tsx
        └── premium/PremiumModal.tsx
```

---

## 🚀 Running the App Locally

### 1. Start the Frontend Web App
```bash
cd hemogo-app
npm run dev
```

### 2. Deploy Cloud Functions & Security Rules to Firebase
```bash
# Set your Razorpay secret keys in Firebase Functions config
firebase functions:config:set razorpay.key_id="rzp_live_xxx" razorpay.key_secret="xxx"

# Deploy Firestore rules, indexes, and Cloud Functions
firebase deploy --only firestore,functions
```

---

## 🧪 Built-in Test Personas (Instant 1-Click Testing)
For fast developer preview without needing SMS credits or payment cards:
1. **Rahul Sharma** (O+ Active Donor - Eligible & Available)
2. **Pooja Varma** (A+ Donor - In 90-Day Medical Cooldown)
3. **Anil Kumar** (Emergency Requester)
4. **Dr. Siddharth Sen** (HemoGo Hero Premium Subscriber - All Contacts Unmasked)

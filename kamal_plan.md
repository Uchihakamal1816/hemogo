# HemoGo — Full-Stack Implementation Plan (Kamal)

## Role: Feature Lead — Users, Donors & Premium Systems
Instead of a strict frontend/backend split, you and Rakesh will both work across the stack. Your primary focus is on **User Identity, Donor Management, and Monetization**. 

> [!IMPORTANT]
> **Priority: Backend & Database First**
> Focus entirely on Phase 1 & 2 before starting any frontend UI work.

---

## Phase 1: Database & Security (Backend Focus)
1. **Firebase Authentication**: Set up Phone/OTP authentication in the Firebase console and write the initial connection scripts.
2. **Database Schemas**: Design and implement the Firestore collections for:
   - `users`
   - `donors`
   - `subscriptions`
3. **Security Rules**: Write strict Firestore rules ensuring donor profiles (and phone numbers) are protected from public access and only editable by the owner.

## Phase 2: Core Cloud Functions (Backend Focus)
1. **Donor Verification Logic**: Write the backend logic to handle donor availability status toggles.
2. **Premium Subscription Engine**: Integrate the Razorpay backend API. Write the Cloud Functions/Webhooks to verify payments and update the user's `subscriptions` document and `premiumStatus`.

## Phase 3: Frontend Implementation (React/Next.js)
1. **Authentication UI**: Build the login and OTP verification components.
2. **Registration Flows**: Build the Donor and Requester onboarding forms, binding them to your backend schemas.
3. **Dashboards**: 
   - Build the Donor Dashboard (availability toggles, history).
   - Build the "HemoGo Premium" upgrade checkout flow.

## Coordination with Rakesh
* Ensure your `donors` schema clearly exposes the fields Rakesh needs for his Matching Algorithm (e.g., `bloodGroup`, `pinCode`, `premiumStatus`, `availability`).
* You will both share the same Next.js repository (`hemogo-web`) and Firebase project. Establish a clear Git branching strategy (e.g., feature branches) to avoid conflicts.

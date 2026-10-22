# HemoGo — Phase 4 Task Sheet

Following the completion of Phase 1, Phase 2, and Phase 3, tasks are allocated between Kamal and Rakesh according to their respective functional responsibilities.

---

## Kamal's Tasks (User Identity, Donor Management & Premium)
**Focus:** Enhancing user profiles, premium features, and administrative controls.

1. **Donor Profile & Settings**
   - Implement the frontend UI for donors to edit their profiles, update their location (PIN code), and manage notification preferences (`DonorSettingsModal.tsx`).
   - Bind these updates to the `users` and `donors` Firestore collections and local persistence (`donorService.ts`).

2. **Razorpay Live Integration & Invoicing**
   - Transition Razorpay integration with support for live test/production orders.
   - Implement an automated GST tax invoice generation and printable/downloadable receipt system for Premium subscriptions (`PremiumReceiptModal.tsx`, `razorpayService.ts`).

3. **Admin Verification Dashboard**
   - Enhance the React Admin Dashboard (`AdminDashboard.tsx`) with a dedicated **Donor Verification & Compliance Queue** to inspect and verify donor profiles (updating `verificationStatus`).
   - Implement a real-time **Subscriptions & Revenue** monitor for administrators to audit active subscriptions and view tax invoices.

4. **Premium Search Analytics**
   - Build a telemetry and impact analytics section in the Donor Dashboard (`PremiumAnalyticsWidget.tsx`) where premium users can see their Priority 1 search boost appearances, response speeds, and lifesaver badges.

---

## Rakesh's Tasks (Emergency Engine, Matching & Notifications)
**Focus:** Real-time communications, deep linking, and advanced request handling.

1. **In-App Chat System**
   - Implement a secure, real-time chat feature between the Requester and the Donor (`EmergencyChatModal.tsx`, `chatService.ts`).
   - Chat unlocks *after* the donor accepts the request and passes screening.

2. **FCM Deep Linking & Payload Routing**
   - Configure Firebase Cloud Messaging payload generator with deep links (`deepLinkService.ts`).
   - Implement deep-link routing on launch in `App.tsx` to directly open specific emergency or dashboard screens.

3. **Request History & Logs & Certificates**
   - Build a "Past Emergencies" screen for requesters to view past emergency logs (`PastEmergenciesModal.tsx`).
   - Build a "Donation History" screen for donors to track verified blood donations and generate lifesaver certificates (`DonationHistoryModal.tsx`, `historyService.ts`).

4. **Location/GPS Tracking**
   - Add real-time location and distance tracking using the Haversine formula to compute ETA and display live transit progress (`DonorLiveTracker.tsx`, `locationService.ts`).

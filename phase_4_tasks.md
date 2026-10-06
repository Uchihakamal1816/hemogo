# HemoGo — Phase 4 Task Sheet

Now that Phase 1, Phase 2, and Phase 3 are complete, the following tasks are divided between Kamal and Rakesh based on their respective core responsibilities.

---

## Kamal's Tasks (User Identity, Donor Management & Premium)
**Focus:** Enhancing user profiles, premium features, and administrative controls.

1. **Donor Profile & Settings**
   - Implement the frontend UI for donors to edit their profiles, update their location (PIN code), and manage notification preferences.
   - Bind these updates to the `users` and `donors` Firestore collections.

2. **Razorpay Live Integration & Invoicing**
   - Migrate the Razorpay integration from Test mode to Live mode.
   - Implement an automated invoice generation and email receipt system for Premium subscriptions.

3. **Admin Verification Dashboard**
   - Enhance the React Admin Dashboard (`AdminDashboard.tsx`) to allow administrators to manually verify donor profiles (updating `verificationStatus`).
   - Implement a view for administrators to monitor active premium subscriptions.

4. **Premium Analytics**
   - Build a mini-analytics section in the Donor Dashboard where premium users can see how many times their profile appeared in emergency searches.

---

## Rakesh's Tasks (Emergency Engine, Matching & Notifications)
**Focus:** Real-time communications, deep linking, and advanced request handling.

1. **In-App Chat System**
   - Implement a secure, real-time chat feature between the Requester and the Donor.
   - The chat should only unlock *after* the donor accepts the request and passes screening.

2. **FCM Deep Linking & Payload Routing**
   - Configure Firebase Cloud Messaging to send data payloads.
   - Implement deep linking in the Flutter app so that tapping an emergency notification directly opens the specific `EmergencyFeed` or `RequesterLiveStatus` screen.

3. **Request History & Logs**
   - Build a "Past Emergencies" screen for requesters to view their history.
   - Build a "Donation History" screen for donors to track the requests they have successfully fulfilled.

4. **Location/GPS Tracking (Optional/Advanced)**
   - Add real-time location sharing so requesters can see how far away the matched donor is (only after acceptance).

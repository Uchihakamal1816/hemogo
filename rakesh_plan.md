# HemoGo — Full-Stack Implementation Plan (Rakesh)

## Role: Feature Lead — Requests, Matching & Notifications
Instead of a strict frontend/backend split, you and Kamal will both work across the stack. Your primary focus is on the **Core Emergency Engine**: creating requests, finding donors, and handling the notification lifecycle.

> [!IMPORTANT]
> **Priority: Backend & Database First**
> Focus entirely on Phase 1 & 2 before starting any frontend UI work.

---

## Phase 1: Database & Security (Backend Focus)
1. **Database Schemas**: Design and implement the Firestore collections for:
   - `bloodRequests`
   - `matches`
   - `notifications`
2. **Security Rules**: Write strict Firestore rules ensuring that Requesters can only read their own requests, and can only see Donor contact information *after* a match has been explicitly accepted.

## Phase 2: Core Cloud Functions (Backend Focus)
1. **The Matching Engine**: This is the heart of HemoGo. Write a robust Cloud Function triggered on new `bloodRequests`.
   - It must query Kamal's `donors` collection.
   - It must prioritize based on exact Blood Group compatibility.
   - It must sort by Location (Same PIN -> Neighboring PINs).
   - It must bump up users with `premiumStatus == true`.
2. **Push Notifications**: Integrate Firebase Cloud Messaging (FCM) to trigger alerts to the matched donors.
3. **Accept/Reject Lifecycle**: Write the backend handlers that update the `matches` collection when a donor accepts, and securely triggers the contact-sharing mechanism.

## Phase 3: Frontend Implementation (React/Next.js)
1. **Emergency Request UI**: Build the prominent "Request Blood" flow (Hospital info, PIN, Units needed).
2. **Real-Time Dashboards**: Build the live-updating screen where requesters see the status of their emergency (e.g., "Notified 18 donors", "2 Accepted").
3. **Screening Flow**: Build the preliminary eligibility questionnaire for donors who press "Accept".

## Coordination with Kamal
* You will rely heavily on the `users` and `donors` database schemas created by Kamal. Communicate early to agree on the exact field names (e.g., `pinCode` vs `zipCode`).
* You will both share the same Next.js repository (`hemogo-web`) and Firebase project. Establish a clear Git branching strategy (e.g., feature branches) to avoid conflicts.

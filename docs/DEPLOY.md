# Deploying HemoGo

## Before the first deploy
1. Upgrade the Firebase project `hemogo-emergency` to the Blaze plan (needed for functions, schedules and SMS).
2. Authentication: enable Phone sign-in, add your domain to Authorized domains, and set an SMS region policy allowing India.
3. Create the Firestore database, ideally in `asia-south1`. The location cannot be changed later.
4. Cloud Messaging: generate a Web Push certificate and put the key in `VITE_FIREBASE_VAPID_KEY`.
5. Copy `.env.example` to `.env.production` and fill in the Firebase web config.
6. Payments are off by default. To turn them on, set the Razorpay secrets (use `rzp_test_` keys first), add `hemogo-emergency` to `PAYMENTS_ENABLED_PROJECTS` in `functions/src/index.ts`, and redeploy functions:
   ```bash
   firebase functions:secrets:set RAZORPAY_KEY_ID
   firebase functions:secrets:set RAZORPAY_KEY_SECRET
   firebase functions:secrets:set RAZORPAY_WEBHOOK_SECRET
   ```
7. In Razorpay, add a webhook for `payment.captured` and `order.paid` pointing at the deployed `razorpayWebhook` URL.
8. Make the first admin: set `role` to `admin` on their `users/{uid}` document in the Firebase console. The app cannot do this.

## Checks
Pull requests run `.github/workflows/ci.yml`: web build and lint, backend unit tests, and end-to-end tests on the Firebase emulators.

## Deploy
```bash
npm --prefix functions test
npm run build
firebase deploy
```
Indexes can take several minutes to build. Requests will fail until they finish.

## Check on real phones before going public
- [ ] Real SMS sign-in on two phones
- [ ] A request alerts a donor whose app is closed
- [ ] Accept, call, chat and location sharing
- [ ] Find hospitals near me returns sensible results
- [ ] A Razorpay test payment activates Premium, and a real webhook arrives
- [ ] Turn on App Check, then watch for rejected traffic
- [ ] Budget alerts on Firebase and SMS spend

## Rollback
- Hosting: `firebase hosting:rollback`
- Functions and rules: redeploy the previous commit

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();

/**
 * Cloud Function triggered when a new Blood Request is created.
 * Responsible for matching donors and creating match documents.
 */
export const onBloodRequestCreated = functions.firestore
  .document("bloodRequests/{requestId}")
  .onCreate(async (snap, context) => {
    const requestData = snap.data();
    const requestId = context.params.requestId;

    const requiredBloodGroup = requestData.bloodGroup;
    const hospitalPinCode = requestData.hospitalPinCode;

    console.log(`Starting matching engine for Request ${requestId} (Blood Group: ${requiredBloodGroup}, PIN: ${hospitalPinCode})`);

    try {
      // 1. Primary Condition: Blood Group Compatibility
      // (Simplified to exact match for the scaffold. You will need to implement full compatibility logic).
      const donorsRef = db.collection("donors");
      const matchedDonorsSnapshot = await donorsRef
        .where("bloodGroup", "==", requiredBloodGroup)
        .where("availability", "==", true)
        .get();

      if (matchedDonorsSnapshot.empty) {
        console.log("No compatible donors found.");
        // Implement logic to expand search radius or notify requester
        return;
      }

      const matches = [];

      matchedDonorsSnapshot.forEach((doc) => {
        const donor = doc.data();
        let priorityScore = 0;

        // 2. Location Priority
        if (donor.pinCode === hospitalPinCode) {
          priorityScore += 50;
        } else if (Math.abs(parseInt(donor.pinCode) - parseInt(hospitalPinCode)) <= 5) {
          // Mock neighboring PINs logic: numerical difference is small
          priorityScore += 25;
        }

        // 3. Premium Priority
        if (donor.premiumStatus === true) {
          priorityScore += 100;
        }

        matches.push({
          donorId: donor.donorId || doc.id,
          priorityScore: priorityScore,
          donorData: donor, // Temporary for sorting
        });
      });

      // Sort matches by highest priority score
      matches.sort((a, b) => b.priorityScore - a.priorityScore);

      console.log(`Found ${matches.length} matches. Creating match documents...`);

      // Create match documents and trigger notifications
      const batch = db.batch();
      matches.forEach((match) => {
        const matchRef = db.collection("matches").doc();
        batch.set(matchRef, {
          matchId: matchRef.id,
          requestId: requestId,
          requesterId: requestData.requesterId,
          donorId: match.donorId,
          priorityScore: match.priorityScore,
          status: "NOTIFIED", // OPEN, NOTIFIED, ACCEPTED, REJECTED
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Implement Push Notification trigger via FCM here
        // MOCK: In a real app we'd use admin.messaging().sendToDevice(...)
        console.log(`[MOCK FCM] Sending push notification to donor ${match.donorId} for match ${matchRef.id}`);
        
        // Also create a notification document
        const notificationRef = db.collection("notifications").doc();
        batch.set(notificationRef, {
          userId: match.donorId,
          title: "Urgent Blood Request",
          body: `An urgent request for ${requiredBloodGroup} blood near your location.`,
          matchId: matchRef.id,
          requestId: requestId,
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      await batch.commit();
      console.log("Matching complete and match documents created.");

    } catch (error) {
      console.error("Error running matching engine:", error);
    }
  });

/**
 * Cloud Function triggered when a match document is updated.
 * Handles the Accept/Reject lifecycle and secure contact sharing.
 */
export const onMatchStatusUpdated = functions.firestore
  .document("matches/{matchId}")
  .onUpdate(async (change, context) => {
    const newValue = change.after.data();
    const previousValue = change.before.data();
    const matchId = context.params.matchId;

    if (previousValue.status === newValue.status) {
      return null;
    }

    console.log(`Match ${matchId} status changed from ${previousValue.status} to ${newValue.status}`);

    if (newValue.status === "ACCEPTED") {
      try {
        // Fetch donor details securely
        const donorSnapshot = await db.collection("donors").doc(newValue.donorId).get();
        if (!donorSnapshot.exists) return;
        const donorData = donorSnapshot.data();

        // 1. Notify the requester that a donor accepted
        console.log(`[MOCK FCM] Sending push notification to requester ${newValue.requesterId}`);
        await db.collection("notifications").add({
          userId: newValue.requesterId,
          title: "Donor Found!",
          body: `${donorData?.name || 'A donor'} has accepted your blood request.`,
          matchId: matchId,
          requestId: newValue.requestId,
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // 2. The match is already ACCEPTED, so the requester can now read the match.
        // The requester will pull contact info either from the match (if duplicated) 
        // or through a separate secure mechanism. For now, the rule allows read.
        console.log(`Secure contact sharing enabled for match ${matchId}.`);

      } catch (error) {
        console.error("Error processing accepted match:", error);
      }
    }
    
    return null;
  });

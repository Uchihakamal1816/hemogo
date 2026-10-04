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
        } else {
          // Implement logic for neighboring PINs
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
        
        // TODO: Implement Push Notification trigger via FCM here
      });

      await batch.commit();
      console.log("Matching complete and match documents created.");

    } catch (error) {
      console.error("Error running matching engine:", error);
    }
  });

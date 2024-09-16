import { ethers } from "ethers";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as dotenv from "dotenv";

admin.initializeApp();
dotenv.config();

const INFURA_PROJECT_ID = functions.config().infura.project_id;
const provider = new ethers.InfuraProvider("mainnet", INFURA_PROJECT_ID);

export const checkSubscriptions = functions.pubsub.schedule("every 24 hours").onRun(async (context) => {
  const db = admin.firestore();
  const now = admin.firestore.Timestamp.now();

  const expiredSubscriptions = await db
    .collection("users")
    .where("isPaidUser", "==", true)
    .where("subscriptionExpiry", "<=", now)
    .get();

  const batch = db.batch();

  expiredSubscriptions.docs.forEach((doc) => {
    batch.update(doc.ref, { isPaidUser: false });
  });

  await batch.commit();
});

export const verifyTransactions = functions.pubsub.schedule("every 5 minutes").onRun(async (context) => {
  const db = admin.firestore();
  const pendingTxs = await db.collection("pendingTransactions").get();

  for (const doc of pendingTxs.docs) {
    const tx = doc.data();
    const receipt = await provider.getTransactionReceipt(tx.hash);

    if (receipt && receipt.status === 1) {
      const userDoc = await db.collection("users").doc(tx.userAddress).get();
      const userData = userDoc.data();

      let newExpiryDate;
      if (userData && userData.subscriptionExpiry && userData.subscriptionExpiry.toDate() > new Date()) {
        newExpiryDate = new Date(userData.subscriptionExpiry.toDate());
      } else {
        newExpiryDate = new Date();
      }

      if (tx.duration === "month") {
        newExpiryDate.setMonth(newExpiryDate.getMonth() + 1);
      } else {
        newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 1);
      }

      await db
        .collection("users")
        .doc(tx.userAddress)
        .update({
          isPaidUser: true,
          subscriptionExpiry: admin.firestore.Timestamp.fromDate(newExpiryDate),
        });

      await doc.ref.delete();
    }
  }
});

export const updateYieldTimestamp = functions.firestore
  .document("yieldOpportunities/{opportunityId}")
  .onWrite(async (change, context) => {
    const db = admin.firestore();
    const metadataRef = db.collection("metadata").doc("yieldData");

    await metadataRef.set(
      {
        yieldLastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });

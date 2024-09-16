import { ethers } from "ethers";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as dotenv from "dotenv";

admin.initializeApp();
dotenv.config();

const INFURA_PROJECT_ID = functions.config().infura.project_id;
const provider = new ethers.InfuraProvider("mainnet", INFURA_PROJECT_ID);

const logEvent = (eventName: string, data?: any) => {
  console.log(
    JSON.stringify({
      event: eventName,
      timestamp: new Date().toISOString(),
      ...data,
    })
  );
};

export const checkSubscriptions = functions.pubsub.schedule("every 24 hours").onRun(async (context) => {
  const db = admin.firestore();
  const now = admin.firestore.Timestamp.now();

  try {
    const expiredSubscriptions = await db
      .collection("users")
      .where("isPaidUser", "==", true)
      .where("subscriptionExpiry", "<=", now)
      .get();

    if (expiredSubscriptions.empty) {
      logEvent("checkSubscriptions", { message: "No expired subscriptions found" });
      return null;
    }

    const batch = db.batch();
    let updateCount = 0;

    expiredSubscriptions.docs.forEach((doc) => {
      batch.update(doc.ref, {
        isPaidUser: false,
        subscriptionExpiredAt: now,
      });
      updateCount++;
    });

    await batch.commit();
    logEvent("checkSubscriptions", { message: `Updated ${updateCount} expired subscriptions` });
    return null;
  } catch (error) {
    console.error("Error in checkSubscriptions:", error);
    throw new functions.https.HttpsError("internal", "Failed to check subscriptions");
  }
});

export const verifyTransactions = functions.pubsub.schedule("every 5 minutes").onRun(async (context) => {
  const db = admin.firestore();

  try {
    const pendingTxs = await db.collection("pendingTransactions").where("status", "==", "pending").get();

    if (pendingTxs.empty) {
      logEvent("verifyTransactions", { message: "No pending transactions found" });
      return null;
    }

    const batch = db.batch();
    let processedCount = 0;

    for (const doc of pendingTxs.docs) {
      const tx = doc.data();
      try {
        const receipt = await provider.getTransactionReceipt(tx.hash);

        if (receipt && receipt.status === 1) {
          const userRef = db.collection("users").doc(tx.userAddress);
          const userDoc = await userRef.get();
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

          batch.update(userRef, {
            isPaidUser: true,
            subscriptionExpiry: admin.firestore.Timestamp.fromDate(newExpiryDate),
          });

          batch.update(doc.ref, { status: "completed", processedAt: admin.firestore.FieldValue.serverTimestamp() });
          processedCount++;
        } else if (receipt && receipt.status === 0) {
          batch.update(doc.ref, { status: "failed", processedAt: admin.firestore.FieldValue.serverTimestamp() });
          processedCount++;
        }
      } catch (error) {
        console.error(`Error processing transaction ${tx.hash}:`, error);
        // Don't update the transaction status here, it will be retried in the next run
      }
    }

    if (processedCount > 0) {
      await batch.commit();
      logEvent("verifyTransactions", { message: `Processed ${processedCount} transactions` });
    }
    return null;
  } catch (error) {
    console.error("Error in verifyTransactions:", error);
    throw new functions.https.HttpsError("internal", "Failed to verify transactions");
  }
});

export const updateYieldTimestamp = functions.firestore
  .document("yieldOpportunities/{opportunityId}")
  .onWrite(async (change, context) => {
    const db = admin.firestore();
    const metadataRef = db.collection("metadata").doc("yieldData");

    try {
      await metadataRef.set(
        {
          yieldLastUpdated: admin.firestore.FieldValue.serverTimestamp(),
          updatedOpportunityId: context.params.opportunityId,
        },
        { merge: true }
      );
      logEvent("updateYieldTimestamp", { opportunityId: context.params.opportunityId });
      return null;
    } catch (error) {
      console.error("Error updating yield timestamp:", error);
      throw new functions.https.HttpsError("internal", "Failed to update yield timestamp");
    }
  });

export const cleanupOldTransactions = functions.pubsub.schedule("every 24 hours").onRun(async (context) => {
  const db = admin.firestore();
  const oneWeekAgo = admin.firestore.Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

  try {
    const oldTransactions = await db.collection("pendingTransactions").where("createdAt", "<", oneWeekAgo).get();

    if (oldTransactions.empty) {
      logEvent("cleanupOldTransactions", { message: "No old transactions to clean up" });
      return null;
    }

    const batch = db.batch();
    oldTransactions.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    logEvent("cleanupOldTransactions", { message: `Deleted ${oldTransactions.size} old transactions` });
    return null;
  } catch (error) {
    console.error("Error in cleanupOldTransactions:", error);
    throw new functions.https.HttpsError("internal", "Failed to clean up old transactions");
  }
});

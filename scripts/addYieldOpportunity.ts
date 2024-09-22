import * as admin from "firebase-admin";
import * as serviceAccount from "./key.json";

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

const db = admin.firestore();

// Define the structure of a Yield Opportunity
interface YieldOpportunity {
  name: string;
  estimatedApy: number;
  network: string;
  tvl: number;
  relativeRisk: "Low" | "Medium" | "High";
  notes: string;
  category: "stablecoin" | "volatileAsset";
  link: string;
  isBenchmark: boolean;
  dateAdded: admin.firestore.Timestamp;
}

// Define constants for categories and risk levels
const CATEGORIES = {
  STABLECOIN: "stablecoin" as const,
  VOLATILE_ASSET: "volatileAsset" as const
};

const RISK_LEVELS = {
  LOW: "Low" as const,
  MEDIUM: "Medium" as const,
  HIGH: "High" as const,
};

// Function to create a yield opportunity
const createYieldOpportunity = (
  name: string,
  estimatedApy: number,
  network: string,
  tvl: number,
  relativeRisk: YieldOpportunity["relativeRisk"],
  notes: string,
  category: YieldOpportunity["category"],
  link: string,
  isBenchmark: boolean
): YieldOpportunity => ({
  name,
  estimatedApy,
  network,
  tvl,
  relativeRisk,
  notes,
  category,
  link,
  isBenchmark,
  dateAdded: admin.firestore.Timestamp.now(),
});

// Array of yield opportunities
const yieldOpportunities: YieldOpportunity[] = [];

// Batch write to Firestore
const batch = db.batch();

yieldOpportunities.forEach((opportunity) => {
  const ref = db.collection("yieldOpportunities").doc();
  batch.set(ref, opportunity);
});

// Commit the batch
batch
  .commit()
  .then(() => {
    console.log("Successfully added yield opportunities to Firestore.");
  })
  .catch((error: any) => {
    console.error("Error adding yield opportunities to Firestore: ", error);
  });

// Update the last updated timestamp
db.collection("metadata")
  .doc("yieldData")
  .set(
    {
      yieldLastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  )
  .then(() => {
    console.log("Successfully updated last updated timestamp.");
  })
  .catch((error: any) => {
    console.error("Error updating last updated timestamp: ", error);
  });

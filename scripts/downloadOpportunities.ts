import * as admin from "firebase-admin";
import { createObjectCsvWriter } from "csv-writer";
import * as path from "path";

// Initialize Firebase Admin SDK
const serviceAccount = require("./key.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

interface YieldOpportunity {
  id: string;
  name: string;
  estimatedApy: number;
  network: string;
  tvl: number;
  relativeRisk: "Low" | "Medium" | "High";
  notes: string;
  category: "stablecoin" | "volatileAsset" | "advancedStrategies";
  link: string;
  isBenchmark: boolean;
  dateAdded: admin.firestore.Timestamp;
}

async function downloadOpportunities() {
  try {
    const snapshot = await db.collection("yieldOpportunities").get();
    const opportunities: YieldOpportunity[] = [];

    snapshot.forEach((doc) => {
      opportunities.push({ id: doc.id, ...doc.data() } as YieldOpportunity);
    });

    const csvWriter = createObjectCsvWriter({
      path: path.resolve(__dirname, "yield_opportunities.csv"),
      header: [
        { id: "id", title: "ID" },
        { id: "name", title: "Name" },
        { id: "estimatedApy", title: "Estimated APY" },
        { id: "network", title: "Network" },
        { id: "tvl", title: "TVL" },
        { id: "relativeRisk", title: "Relative Risk" },
        { id: "notes", title: "Notes" },
        { id: "category", title: "Category" },
        { id: "link", title: "Link" },
        { id: "isBenchmark", title: "Is Benchmark" },
        { id: "dateAdded", title: "Date Added" },
      ],
    });

    await csvWriter.writeRecords(
      opportunities.map((opp) => ({
        ...opp,
        dateAdded: opp.dateAdded.toDate().toISOString(),
        isBenchmark: opp.isBenchmark.toString(),
      }))
    );

    console.log("CSV file has been written successfully");
  } catch (error) {
    console.error("Error downloading opportunities:", error);
  } finally {
    admin.app().delete();
  }
}

downloadOpportunities();

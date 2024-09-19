import * as admin from "firebase-admin";
import { parse } from "csv-parse";
import * as fs from "fs";
import * as path from "path";

// Initialize Firebase Admin SDK
const serviceAccount = require("./key.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

interface YieldOpportunity {
  id?: string;
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

const csvToPropertyMap: { [key: string]: keyof YieldOpportunity } = {
  ID: "id",
  Name: "name",
  "Estimated APY": "estimatedApy",
  Network: "network",
  TVL: "tvl",
  "Relative Risk": "relativeRisk",
  Notes: "notes",
  Category: "category",
  Link: "link",
  "Is Benchmark": "isBenchmark",
  "Date Added": "dateAdded",
};

function convertCsvToOpportunity(csvRecord: any): any {
  const convertedRecord: any = {};
  for (const [csvKey, propKey] of Object.entries(csvToPropertyMap)) {
    if (csvRecord[csvKey] !== undefined) {
      convertedRecord[propKey] = csvRecord[csvKey];
    }
  }
  return convertedRecord;
}

function validateOpportunity(data: any): YieldOpportunity {
  if (typeof data.name !== "string" || data.name.trim() === "") {
    throw new Error("Invalid name");
  }
  if (isNaN(parseFloat(data.estimatedApy))) {
    throw new Error("Invalid estimatedApy");
  }
  if (typeof data.network !== "string" || data.network.trim() === "") {
    throw new Error("Invalid network");
  }
  if (isNaN(parseFloat(data.tvl))) {
    throw new Error("Invalid tvl");
  }
  if (!["Low", "Medium", "High"].includes(data.relativeRisk)) {
    throw new Error("Invalid relativeRisk");
  }
  if (typeof data.notes !== "string") {
    throw new Error("Invalid notes");
  }
  if (!["stablecoin", "volatileAsset", "advancedStrategies"].includes(data.category)) {
    throw new Error("Invalid category");
  }
  if (typeof data.link !== "string" || data.link.trim() === "") {
    throw new Error("Invalid link");
  }
  if (typeof data.isBenchmark !== "boolean" && data.isBenchmark !== "TRUE" && data.isBenchmark !== "FALSE") {
    throw new Error("Invalid isBenchmark");
  }
  if (isNaN(Date.parse(data.dateAdded))) {
    throw new Error("Invalid dateAdded");
  }

  return {
    id: data.id,
    name: data.name,
    estimatedApy: parseFloat(data.estimatedApy),
    network: data.network,
    tvl: parseFloat(data.tvl),
    relativeRisk: data.relativeRisk as "Low" | "Medium" | "High",
    notes: data.notes,
    category: data.category as "stablecoin" | "volatileAsset" | "advancedStrategies",
    link: data.link,
    isBenchmark: data.isBenchmark === "TRUE",
    dateAdded: admin.firestore.Timestamp.fromDate(new Date(data.dateAdded)),
  };
}

async function uploadOpportunities() {
  const csvFilePath = path.resolve(__dirname, "yield_opportunities.csv");
  const fileContent = fs.readFileSync(csvFilePath, { encoding: "utf-8" });

  parse(
    fileContent,
    {
      columns: true,
      skip_empty_lines: true,
    },
    async (err, records) => {
      if (err) {
        console.error("Error parsing CSV:", err);
        return;
      }

      const batch = db.batch();

      for (const record of records) {
        try {
          const convertedRecord = convertCsvToOpportunity(record);
          const opportunity = validateOpportunity(convertedRecord);
          const { id, ...data } = opportunity;

          if (id) {
            // Update existing document
            const docRef = db.collection("yieldOpportunities").doc(id);
            batch.update(docRef, data);
          } else {
            // Create new document
            const docRef = db.collection("yieldOpportunities").doc();
            batch.set(docRef, data);
          }
        } catch (error) {
          console.error(`Error processing record:`, record, error);
        }
      }

      try {
        await batch.commit();
        console.log("Batch write successful");
      } catch (error) {
        console.error("Error writing to Firestore:", error);
      } finally {
        admin.app().delete();
      }
    }
  );
}

uploadOpportunities();

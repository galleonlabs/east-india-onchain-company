import * as admin from "firebase-admin";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

// Initialize Firebase Admin SDK
const serviceAccount = require("./key");
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
  category: OpportunityCategory;
  link: string;
  isBenchmark: boolean;
  dateAdded: admin.firestore.Timestamp;
}

type OpportunityCategory = "stablecoin" | "volatileAsset" | "advancedStrategies";

const COLORS = {
  NAVY: "#27272A",
  SKY: "#0072B5",
  CHAMPAGNE: "#F4EEE8",
};

const categoryTitles: { [K in OpportunityCategory]: string } = {
  stablecoin: "Stablecoin Yield",
  volatileAsset: "Volatile Asset Yield",
  advancedStrategies: "Advanced Strategies",
};

async function generateYieldPDF() {
  try {
    const snapshot = await db.collection("yieldOpportunities").get();
    const opportunities: YieldOpportunity[] = [];

    snapshot.forEach((doc) => {
      opportunities.push({ id: doc.id, ...doc.data() } as YieldOpportunity);
    });

    // Group opportunities by category
    const groupedOpportunities = opportunities.reduce((acc, opp) => {
      if (!acc[opp.category]) {
        acc[opp.category] = [];
      }
      acc[opp.category].push(opp);
      return acc;
    }, {} as Record<OpportunityCategory, YieldOpportunity[]>);

    // Create a new PDF document
    const doc = new PDFDocument({ margin: 20, size: "A4" });
    const publicDir = path.resolve(__dirname, "..", "public");
    const pdfPath = path.join(publicDir, "yield_opportunities.pdf");

     if (!fs.existsSync(publicDir)) {
       fs.mkdirSync(publicDir, { recursive: true });
    }
    
    doc.pipe(fs.createWriteStream(pdfPath));

    // Set background color
    doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLORS.CHAMPAGNE);

    // Add title
    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .fillColor(COLORS.NAVY)
      .text("Yield Opportunities", { align: "center" })
      .fontSize(8)
      .text(`Generated on: ${new Date().toLocaleDateString()}`, { align: "center" })
      .moveDown(2);
  

    const categories: OpportunityCategory[] = ["stablecoin", "volatileAsset", "advancedStrategies"];

    categories.forEach((category, index) => {
      const opportunities = groupedOpportunities[category] || [];

      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor(COLORS.SKY)
        .text(categoryTitles[category], { continued: true })
        .fontSize(8)
        .fillColor(COLORS.NAVY)
        .text(` (${opportunities.length})`, { align: "left" })
        .moveDown(0.2);

      opportunities.forEach((opp, oppIndex) => {
        doc.font("Helvetica").fontSize(7).fillColor(COLORS.NAVY);

        // Left side: Name, network, risk
        const leftSide = `${opp.name} - ${opp.network} - Risk: ${opp.relativeRisk}`;

        // Right side: TVL, APY
        const rightSide = `TVL: $${opp.tvl.toLocaleString()} - APY: ${opp.estimatedApy.toFixed(2)}%`;

        doc.text(leftSide, { continued: true });
        doc.text(rightSide, { align: "right" });

        if (opp.notes) {
          doc.fontSize(6).text(`${opp.notes}`, { indent: 10 });
        }

        if (oppIndex < opportunities.length - 1) {
          doc.moveDown(0.5);
        }
      });

      if (index < categories.length - 1) {
        doc.moveDown(1.5); // Increased gap between categories
      }
    });

    // Add footer with website link
    const bottomMargin = 50;
    doc
      .fontSize(8)
      .fillColor(COLORS.SKY)
      .text("eastindiaonchaincompany.com", doc.page.margins.left, doc.page.height - bottomMargin, {
        align: "center",
        link: "https://eastindiaonchaincompany.com",
      });

    // Finalize the PDF
    doc.end();

    console.log("PDF has been generated successfully");
  } catch (error) {
    console.error("Error generating PDF:", error);
  } finally {
    admin.app().delete();
  }
}

generateYieldPDF();

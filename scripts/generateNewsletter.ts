// @ts-nocheck
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as fs from "fs";

// Initialize Firebase Admin SDK
const serviceAccount = require("./key.json");
initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

async function generateNewsletter() {
  const categories = ["stablecoin", "volatileAsset", "advancedStrategies"];
  let newsletterContent = `Welcome to this week's drop of The Trade Winds. Below is a snapshot of the yield data we currently have on deck, a curated sample of actionable opportunities, and a brief overview of what is influencing the market this week.

Market Insights
[Insert brief market commentary or insights here]

`;

  const categoryTitles = {
    stablecoin: "Stablecoin Opportunities",
    volatileAsset: "Volatile Asset Opportunities",
    advancedStrategies: "Advanced Strategies",
  };

  for (const category of categories) {
    const categoryOpportunities = await db
      .collection("yieldOpportunities")
      .where("category", "==", category)
      .where("isBenchmark", "==", false)
      .orderBy("estimatedApy", "desc")
      .limit(1)
      .get();

    if (!categoryOpportunities.empty) {
      const opportunity = categoryOpportunities.docs[0].data();
      newsletterContent += `${categoryTitles[category]}
${opportunity.name}

• Estimated APY: ${opportunity.estimatedApy.toFixed(2)}%
• Network: ${opportunity.network}
• TVL: $${formatTVL(opportunity.tvl)}
• Risk Level: ${opportunity.relativeRisk}

${opportunity.notes}

Go to opportunity: ${opportunity.link}

`;
    }
  }

  newsletterContent += `Explore all yield data

For more yield opportunities and detailed analysis, visit East India Onchain Company: https://eastindiaonchaincompany.com 

Yield Data Metrics`;

 // Fetch all opportunities for analysis
  const allOpportunities = await db.collection("yieldOpportunities").get();
  const opportunities = allOpportunities.docs.map((doc) => doc.data());

  // Calculate highlight metrics
  const networkDistribution = calculateDistribution(opportunities, "network");
  const riskDistribution = calculateDistribution(opportunities, "relativeRisk");
  const yieldDistribution = calculateNumericDistribution(opportunities, "estimatedApy");
  const tvlDistribution = calculateNumericDistribution(opportunities, "tvl");

  newsletterContent += `
Total Yield Opportunities: ${opportunities.length}
Network Distribution: ${formatDistribution(networkDistribution)}
Risk Distribution: ${formatDistribution(riskDistribution)}
Yield Distribution: ${formatNumericDistribution(yieldDistribution)}%
TVL Distribution: $${formatNumericDistribution(tvlDistribution, true)}

`;

newsletterContent += `Resources
• Twitter: https://twitter.com/galleonlabs
• GitHub: https://github.com/galleonlabs

Remember, all investments carry risk. Always do your own research before investing. This is not financial advice but rather educative content designed to help you better understand the crypto markets and products.`;

  // Write the newsletter content to a file
  fs.writeFileSync(`weekly_newsletter_${Date.now()}.txt`, newsletterContent);
  console.log("Newsletter generated successfully!");
}

function calculateDistribution(data, key) {
  return data.reduce((acc, item) => {
    acc[item[key]] = (acc[item[key]] || 0) + 1;
    return acc;
  }, {});
}

function calculateNumericDistribution(data, key) {
  const sorted = data.map((item) => item[key]).sort((a, b) => a - b);
  const len = sorted.length;
  return {
    min: sorted[0],
    max: sorted[len - 1],
    median: len % 2 === 0 ? (sorted[len / 2 - 1] + sorted[len / 2]) / 2 : sorted[Math.floor(len / 2)],
  };
}

function formatDistribution(distribution) {
  return Object.entries(distribution)
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");
}

function formatNumericDistribution(distribution, isCurrency = false) {
  const format = isCurrency ? formatTVL : (num) => num.toFixed(2);
  return `Min: ${format(distribution.min)}, Max: ${format(distribution.max)}, Median: ${format(distribution.median)}`;
}

function formatTVL(tvl: number): string {
  if (tvl >= 1e12) return `${(tvl / 1e12).toFixed(2)}T`;
  if (tvl >= 1e9) return `${(tvl / 1e9).toFixed(2)}B`;
  if (tvl >= 1e6) return `${(tvl / 1e6).toFixed(2)}M`;
  if (tvl >= 1e3) return `${(tvl / 1e3).toFixed(2)}K`;
  return tvl.toFixed(2);
}

generateNewsletter().catch(console.error);

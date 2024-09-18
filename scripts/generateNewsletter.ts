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
  let newsletterContent = `Welcome to this week's drop of **The Trade Winds**. Below is a snapshot of the yield data we currently have on deck, a curated sample of actionable opportunities, and a brief overview of what is influencing the market this week.

Market Influences
[Insert market influences here, e.g.:
* FED interest rate decision at 18:00 UTC 18/09/2024 (expected cut to 5.25%).
* FOMC press conference for economic outlook at 18:00 UTC 18/09/2024.
* US presidential election.]

[Insert market sentiment analysis here, e.g.:
The sentiment of the above is that the beginning of an orderly rate-cutting cycle (-0.25%) with a dovish FED stance is a bullish tailwind that might be further catalysed by a Trump win in the US election due to being significantly more pro-crypto than the opposition. In contrast, dramatic rate cuts representing more panic measures could signify hard-landing recessionary risks and be short to mid-term headwinds for risk assets alongside a democratic win in the upcoming election.]

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
* Estimated APY: ${opportunity.estimatedApy.toFixed(2)}%
* Network: ${opportunity.network}
* TVL: $${formatTVL(opportunity.tvl)}
* Risk Level: ${opportunity.relativeRisk}
${opportunity.notes ? `* Note: ${opportunity.notes}\n` : ""}
Go to opportunity → ${opportunity.link}

`;
    }
  }

  newsletterContent += `Explore All Yield Data
For more yield opportunities and analysis, visit our premium data yield dashboard at the East India Onchain Company.

`;

  // Fetch all opportunities for analysis
  const allOpportunities = await db.collection("yieldOpportunities").get();
  const opportunities = allOpportunities.docs.map((doc) => doc.data());

  // Calculate highlight metrics
  const networkDistribution = calculateDistribution(opportunities, "network");
  const riskDistribution = calculateDistribution(opportunities, "relativeRisk");
  const yieldDistribution = calculateNumericDistribution(opportunities, "estimatedApy");
  const tvlDistribution = calculateNumericDistribution(opportunities, "tvl");

  newsletterContent += `Total Yield Opportunities
${opportunities.length}

Network Distribution 
${formatDistributionAsList(networkDistribution)}

Risk Distribution
${formatDistributionAsList(riskDistribution)}

**Yield Distribution**
${formatNumericDistribution(yieldDistribution)}%

TVL Distribution
$${formatNumericDistribution(tvlDistribution, true)}

Resources
Twitter - GitHub - Email - Newsletter

Thanks for reading The Trade Winds! Subscribe for free to receive new posts and support my work.

*Remember, all investments carry risk. Always do your own research before investing. This is not financial advice but rather educative content designed to help you better understand the crypto markets and products.*`;

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

function formatDistributionAsList(distribution) {
  return Object.entries(distribution)
    .map(([key, value]) => `* ${key}: ${value}`)
    .join("\n");
}

function formatNumericDistribution(distribution, isCurrency = false) {
  const format = isCurrency ? formatTVL : (num) => num.toFixed(2);
  return `* Min: ${format(distribution.min)} 
* Max: ${format(distribution.max)}
* Median: ${format(distribution.median)}`;
}

function formatTVL(tvl: number): string {
  if (tvl >= 1e12) return `${(tvl / 1e12).toFixed(2)}T`;
  if (tvl >= 1e9) return `${(tvl / 1e9).toFixed(2)}B`;
  if (tvl >= 1e6) return `${(tvl / 1e6).toFixed(2)}M`;
  if (tvl >= 1e3) return `${(tvl / 1e3).toFixed(2)}K`;
  return tvl.toFixed(2);
}

generateNewsletter().catch(console.error);

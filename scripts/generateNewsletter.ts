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
  let newsletterContent = `Welcome to this week's drop of **The Trade Winds**. Below is a snapshot of the yield data we currently have on deck, a curated sample of actionable opportunities, and a brief overview of what is influencing the market this week.

Market Influences
[Insert market influences here, e.g.:
* Renewed energy from Token2049 in Singapore & Solana Breakpoint
* Tailwinds from FED 0.5% rate cut and dovish FOMC.]

[Insert market sentiment analysis here, e.g.:
Token2049 showed that despite recent general apathy across the market in primarily anything beyond BTC, there is undoubtedly a significant drive to progress the industry forward, with a larger community of builders and advocates every year. Raises for new projects are still in full swing, with an expected wave of existing projects preparing to deploy their highly anticipated tokens in Q4 this year (e.g. EigenLayer & Hyperliquid).

The FED cutting interest rates by 0.5%, communicating things are on track whilst pointing at a soft landing, and the BOJ keeping rates steady have given the markets the beginnings of a beneficial tailwind that could snowball, providing recession fears stay muted. Over six trillion dollars in money market funds are taking advantage of the current high interest rate environment, and everyone is betting on a portion of that to migrate into risk assets over the next few years.]

`;

  const categories = ["stablecoin", "volatileAsset"];
  const categoryTitles = {
    stablecoin: "Stablecoin Yield Opportunity",
    volatileAsset: "ETH Yield Opportunity",
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
* Estimated APY: **${opportunity.estimatedApy.toFixed(2)}%**
* Network: ${opportunity.network}
* TVL: $${formatTVL(opportunity.tvl)}
* Risk Level: ${opportunity.relativeRisk}
${opportunity.notes ? `* ${opportunity.notes}\n` : ""}
Go to opportunity → ${opportunity.link}

`;
    }
  }

  newsletterContent += `Explore All Yield Data
For more yield opportunities and analysis, visit our public data yield dashboard at the East India Onchain Company. While you can enjoy the platform for free, we offer a premium tier that includes Telegram alerts, PDF generation, and early access to new yield opportunities.

`;

  // Fetch all opportunities for analysis
  const allOpportunities = await db.collection("yieldOpportunities").get();
  const opportunities = allOpportunities.docs.map((doc) => doc.data());

  // Calculate highlight metrics
  const networkDistribution = calculateDistribution(opportunities, "network");
  const riskDistribution = calculateDistribution(opportunities, "relativeRisk");
  const stablecoinYieldDistribution = calculateNumericDistribution(
    opportunities.filter((x) => x.category === "stablecoin"),
    "estimatedApy"
  );
  const ethYieldDistribution = calculateNumericDistribution(
    opportunities.filter((x) => x.category === "volatileAsset"),
    "estimatedApy"
  );

  newsletterContent += `Our curated yield landscape showcases ${opportunities.length} ${Object.keys(
    networkDistribution
  ).join(
    ", "
  )} network opportunities. The risk profile of these opportunities is balanced to cater to all risk tolerances, with the majority (${
    riskDistribution.Medium || 0
  }) falling into the medium-risk category, ${riskDistribution.Low || 0} low-risk options, and ${
    riskDistribution.High || 0
  } high-risk options. Below are the yield highlights for both the Stablecoin and ETH categories.

Stablecoin Yield:
${formatNumericDistribution(stablecoinYieldDistribution)}

ETH Yield:
${formatNumericDistribution(ethYieldDistribution)}

Weekly DeFi Concept
[Insert weekly DeFi concept here, e.g.:
Yield Farming
Yield farming involves lending or staking cryptocurrency assets to generate returns. Users provide liquidity to DeFi protocols and earn rewards, often through the platform's native tokens. 
**Example:** A user deposits USDC into a lending protocol like Aave. They earn interest on their USDC and receive additional AAVE tokens as an incentive, potentially increasing their overall yield.]

Resources
Website - Twitter - GitHub - Email - Newsletter

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

function formatNumericDistribution(distribution) {
  return `* Minimum: ${distribution.min.toFixed(2)}%
* Maximum: ${distribution.max.toFixed(2)}%
* Median: ${distribution.median.toFixed(2)}%`;
}

function formatTVL(tvl: number): string {
  if (tvl >= 1e12) return `${(tvl / 1e12).toFixed(2)}T`;
  if (tvl >= 1e9) return `${(tvl / 1e9).toFixed(2)}B`;
  if (tvl >= 1e6) return `${(tvl / 1e6).toFixed(2)}M`;
  if (tvl >= 1e3) return `${(tvl / 1e3).toFixed(2)}K`;
  return tvl.toFixed(2);
}

generateNewsletter().catch(console.error);

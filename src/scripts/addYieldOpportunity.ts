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
  category: "stablecoin" | "volatileAsset" | "advancedStrategies";
  link: string;
  isBenchmark: boolean;
  dateAdded: admin.firestore.Timestamp;
}

// Define constants for categories and risk levels
const CATEGORIES = {
  STABLECOIN: "stablecoin" as const,
  VOLATILE_ASSET: "volatileAsset" as const,
  ADVANCED_STRATEGIES: "advancedStrategies" as const,
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
const yieldOpportunities: YieldOpportunity[] = [
  // Stablecoin Opportunities
  createYieldOpportunity(
    "USDC Lending on Aave",
    3.5,
    "Ethereum",
    2_300_000_000,
    RISK_LEVELS.LOW,
    "",
    CATEGORIES.STABLECOIN,
    "https://app.aave.com/reserve-overview/?underlyingAsset=0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48&marketName=proto_mainnet_v3",
    true
  ),
  createYieldOpportunity(
    "USDT Lending on Compound",
    8.73,
    "Ethereum",
    109_000_000,
    RISK_LEVELS.LOW,
    "",
    CATEGORIES.STABLECOIN,
    "https://app.compound.finance/markets/usdt-mainnet",
    false
  ),
  createYieldOpportunity(
    "sUSD/crvUSD LP on Convex",
    9.33,
    "Ethereum",
    1_200_000,
    RISK_LEVELS.MEDIUM,
    "",
    CATEGORIES.STABLECOIN,
    "https://curve.convexfinance.com/stake/ethereum/335",
    false
  ),
  createYieldOpportunity(
    "GHO Staking on Aave",
    18.79,
    "Ethereum",
    108_430_000,
    RISK_LEVELS.MEDIUM,
    "",
    CATEGORIES.STABLECOIN,
    "https://app.aave.com/staking/",
    false
  ),
  createYieldOpportunity(
    "sDAI/USDC Yield Loop on Summer.fi",
    9.28,
    "Ethereum",
    583_132_000,
    RISK_LEVELS.MEDIUM,
    "",
    CATEGORIES.STABLECOIN,
    "https://summer.fi/ethereum/spark/multiply/SDAI-USDT",
    false
  ),
  createYieldOpportunity(
    "CrvUSD V3 Pool on Gearbox",
    43.47,
    "Ethereum",
    1_820_000,
    RISK_LEVELS.MEDIUM,
    "",
    CATEGORIES.STABLECOIN,
    "https://app.gearbox.fi/pools/0x8ef73f036feec873d0b2fd20892215df5b8bdd72",
    false
  ),
  createYieldOpportunity(
    "GHO/USDT/USDC Pool on Aura",
    74.17,
    "Ethereum",
    744_150,
    RISK_LEVELS.MEDIUM,
    "",
    CATEGORIES.STABLECOIN,
    "https://app.aura.finance/#/1/pool/1572",
    false
  ),
  createYieldOpportunity(
    "CrvUSD Omnipool on Conic",
    16.22,
    "Ethereum",
    2_220_000,
    RISK_LEVELS.HIGH,
    "",
    CATEGORIES.STABLECOIN,
    "https://conic.finance/",
    false
  ),
  createYieldOpportunity(
    "USDC Farm on Stargate",
    7.43,
    "Scroll",
    2_220_000,
    RISK_LEVELS.HIGH,
    "",
    CATEGORIES.STABLECOIN,
    "https://stargate.finance/farm/scroll:0xd240a859efc77b7455ad1b1402357784a2d72a1b:0x1ea77149dfd4c80a753aaa39aafc22453aefcc99",
    false
  ),
  // Volatile Asset Opportunities
  createYieldOpportunity(
    "ETH Staking on Lido",
    2.9,
    "Ethereum",
    22_337_062_000,
    RISK_LEVELS.LOW,
    "",
    CATEGORIES.VOLATILE_ASSET,
    "https://lido.fi/",
    true
  ),
  createYieldOpportunity(
    "Staked cvxCRV on Convex",
    16.28,
    "Ethereum",
    103_259_000,
    RISK_LEVELS.HIGH,
    "Stablecoin rewards",
    CATEGORIES.VOLATILE_ASSET,
    "https://curve.convexfinance.com/stake",
    false
  ),
  createYieldOpportunity(
    "DYDX Staking",
    11.81,
    "DYDX Chain",
    500_000_000,
    RISK_LEVELS.MEDIUM,
    "Stablecoin rewards",
    CATEGORIES.VOLATILE_ASSET,
    "https://dydx.trade",
    false
  ),
  createYieldOpportunity(
    "ETH Omnipool on Conic",
    11.12,
    "Ethereum",
    551_000,
    RISK_LEVELS.HIGH,
    "",
    CATEGORIES.VOLATILE_ASSET,
    "https://conic.finance/",
    false
  ),
  createYieldOpportunity(
    "stETH Yield Layer on CIAN",
    7.51,
    "Ethereum",
    60_590_000,
    RISK_LEVELS.MEDIUM,
    "Mellow + Symbiotic + Cian points",
    CATEGORIES.VOLATILE_ASSET,
    "https://yieldlayer.cian.app/vaults/0xB13aa2d0345b0439b064f26B82D8dCf3f508775d?chainId=1",
    false
  ),
  createYieldOpportunity(
    "WETH/USDC LP on Beefy",
    47.94,
    "Base",
    21_620_000,
    RISK_LEVELS.MEDIUM,
    "",
    CATEGORIES.VOLATILE_ASSET,
    "https://app.beefy.com/vault/aero-cow-weth-usdc-vault",
    false
  ),
  // Advanced Strategies
  createYieldOpportunity(
    "PT sUSDe on Pendle",
    11.32,
    "Ethereum",
    467_000_000,
    RISK_LEVELS.MEDIUM,
    "Matures 26 Dec 2024",
    CATEGORIES.ADVANCED_STRATEGIES,
    "https://www.ethena.fi/",
    true
  ),
  createYieldOpportunity(
    "weETH Harvest on Derive",
    20.87,
    "Arbitrum",
    4_924_500,
    RISK_LEVELS.HIGH,
    "DRV + EtherFi + EigenLayer points",
    CATEGORIES.ADVANCED_STRATEGIES,
    "https://www.derive.xyz/yield/weethc",
    false
  ),
];

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
  .catch((error) => {
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
  .catch((error) => {
    console.error("Error updating last updated timestamp: ", error);
  });

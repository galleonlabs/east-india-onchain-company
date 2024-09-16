export const OPPORTUNITY_CATEGORIES = ["stablecoin", "volatileAsset", "advancedStrategies"] as const;
export type OpportunityCategory = (typeof OPPORTUNITY_CATEGORIES)[number];

export interface YieldOpportunity {
  id: string;
  name: string;
  estimatedApy: string;
  network: string;
  tvl: string;
  relativeRisk: "Low" | "Medium" | "High";
  notes: string;
  category: OpportunityCategory;
  link: string;
  isBenchmark: boolean;
  dateAdded: string;
}

export interface User {
  address: string;
  isPaidUser: boolean;
  lastPaymentTimestamp?: number;
  subscriptionExpiryDate?: number;
}

export type CryptoPaymentType = "ETH" | "USDC" | "DAI" | "USDT";

export interface CryptoPayment {
  type: CryptoPaymentType;
  amount: string;
  address: string;
}

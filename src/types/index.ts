import { Timestamp } from "firebase/firestore";

export const OPPORTUNITY_CATEGORIES = ["stablecoin", "volatileAsset", "advancedStrategies"] as const;
export type OpportunityCategory = (typeof OPPORTUNITY_CATEGORIES)[number];

export interface YieldOpportunity {
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
  dateAdded: Timestamp;
}

export interface User {
  address: string;
  isPaidUser: boolean;
  subscriptionExpiryDate?: number;
  telegramNotificationsEnabled: boolean;
  telegramChatId?: string;
}

export type CryptoPaymentType = "ETH" | "USDC" | "DAI" | "USDT";

export interface CryptoPayment {
  type: CryptoPaymentType;
  amount: string;
  address: string;
}

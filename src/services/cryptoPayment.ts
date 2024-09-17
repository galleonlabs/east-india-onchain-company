import { db } from "./firebase";
import { addDoc, collection, Timestamp, updateDoc, getDocs, query, where } from "firebase/firestore";
import { updateUserSubscription } from "./firebase";
import { NetworkConfig } from "../config/networks";

export interface PaymentDetails {
  amount: string;
  duration: "month" | "year";
  network: NetworkConfig;
}

export const MONTH_PRICE = "0.01";
export const YEAR_PRICE = "0.10";

export const getPaymentDetails = (duration: "month" | "year", network: NetworkConfig): PaymentDetails => {
  return {
    amount: duration === "month" ? MONTH_PRICE : YEAR_PRICE,
    duration,
    network,
  };
};

export const storePendingTransaction = async (
  hash: `0x${string}`,
  userAddress: string,
  amount: string,
  duration: "month" | "year",
  chainId: string
): Promise<void> => {
  try {
    await addDoc(collection(db, "pendingTransactions"), {
      hash,
      userAddress,
      amount,
      duration,
      chainId,
      createdAt: Timestamp.now(),
      status: "pending",
    });
  } catch (error) {
    console.error("Error storing pending transaction:", error);
    throw new Error("Failed to store pending transaction");
  }
};

export const updateTransactionStatus = async (
  transactionHash: `0x${string}`,
  status: "completed" | "failed"
): Promise<void> => {
  try {
    const txQuery = await getDocs(query(collection(db, "pendingTransactions"), where("hash", "==", transactionHash)));

    if (!txQuery.empty) {
      const txDoc = txQuery.docs[0];
      const txData = txDoc.data();

      await updateDoc(txDoc.ref, { status });

      if (status === "completed") {
        await updateUserSubscription(txData.userAddress, txData.duration);
      }
    }
  } catch (error) {
    console.error("Error updating transaction status:", error);
    throw new Error("Failed to update transaction status");
  }
};

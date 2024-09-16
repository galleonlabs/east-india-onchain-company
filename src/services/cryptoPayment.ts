// src/services/cryptoPayment.ts

import { ethers } from "ethers";
import { User } from "../types";
import { db } from "./firebase";
import { addDoc, collection, Timestamp, updateDoc, getDocs, query, where } from "firebase/firestore";
import { updateUserSubscription } from "./firebase";

const RECEIVER_ADDRESS = "0x30B0D5758c79645Eb925825E1Ee8A2c448812F37";

export interface PaymentDetails {
  amount: string;
  duration: "month" | "year";
}

export const getPaymentDetails = (duration: "month" | "year"): PaymentDetails => {
  return {
    amount: duration === "month" ? "0.01" : "0.10",
    duration,
  };
};

export const initiatePayment = async (user: User, paymentDetails: PaymentDetails): Promise<string> => {
  if (typeof window.ethereum === "undefined") {
    throw new Error("Ethereum object not found. Do you have MetaMask installed?");
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x1" }], // Mainnet
    });

    await window.ethereum.request({ method: "eth_requestAccounts" });
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const tx = await signer.sendTransaction({
      to: RECEIVER_ADDRESS,
      value: ethers.parseEther(paymentDetails.amount),
    });

    await storePendingTransaction(tx.hash, user.address, paymentDetails.amount, paymentDetails.duration);

    return tx.hash;
  } catch (error) {
    console.error("Payment failed:", error);
    throw new Error(`Payment failed: ${(error as Error).message}`);
  }
};

const storePendingTransaction = async (
  hash: string,
  userAddress: string,
  amount: string,
  duration: "month" | "year"
): Promise<void> => {
  try {
    await addDoc(collection(db, "pendingTransactions"), {
      hash,
      userAddress,
      amount,
      duration,
      createdAt: Timestamp.now(),
      status: "pending",
    });
  } catch (error) {
    console.error("Error storing pending transaction:", error);
    throw new Error("Failed to store pending transaction");
  }
};

export const checkPaymentStatus = async (transactionHash: string): Promise<boolean> => {
  if (typeof window.ethereum === "undefined") {
    throw new Error("Ethereum object not found. Do you have MetaMask installed?");
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const receipt = await provider.getTransactionReceipt(transactionHash);

    if (receipt && receipt.status === 1) {
      // Transaction was successful
      await updateTransactionStatus(transactionHash, "completed");
      return true;
    } else if (receipt && receipt.status === 0) {
      // Transaction failed
      await updateTransactionStatus(transactionHash, "failed");
      return false;
    }
    // Transaction is still pending
    return false;
  } catch (error) {
    console.error("Error checking payment status:", error);
    throw new Error("Failed to check payment status");
  }
};

const updateTransactionStatus = async (transactionHash: string, status: "completed" | "failed"): Promise<void> => {
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

export const getPendingTransactions = async (userAddress: string): Promise<any[]> => {
  try {
    const txQuery = query(
      collection(db, "pendingTransactions"),
      where("userAddress", "==", userAddress),
      where("status", "==", "pending")
    );
    const txSnapshot = await getDocs(txQuery);
    return txSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching pending transactions:", error);
    throw new Error("Failed to fetch pending transactions");
  }
};

export const retryPendingTransactions = async (userAddress: string): Promise<void> => {
  const pendingTxs = await getPendingTransactions(userAddress);

  for (const tx of pendingTxs) {
    try {
      const status = await checkPaymentStatus(tx.hash);
      if (status) {
        console.log(`Transaction ${tx.hash} has been confirmed and processed.`);
      }
    } catch (error) {
      console.error(`Error processing transaction ${tx.hash}:`, error);
    }
  }
};

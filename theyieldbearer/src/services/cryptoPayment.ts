// src/services/cryptoPayment.ts
import { ethers } from "ethers";
import { db } from "./firebase";
import { addDoc, collection } from "firebase/firestore";
import { User } from "../types";

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

export const initiatePayment = async (user: User, paymentDetails: PaymentDetails) => {
  if (typeof window.ethereum === "undefined") {
    throw new Error("Ethereum object not found. Do you have MetaMask installed?");
  }

  await window.ethereum.request({
    method: "wallet_switchEthereumChain",
    params: [{ chainId: "0x1" }],
  });

  await window.ethereum.request({ method: "eth_requestAccounts" });
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  try {
    const tx = await signer.sendTransaction({
      to: RECEIVER_ADDRESS,
      value: ethers.parseEther(paymentDetails.amount),
    });

    await storePendingTransaction(tx.hash, user.address, paymentDetails.amount, paymentDetails.duration);

    return tx.hash;
  } catch (error) {
    console.error("Payment failed:", error);
    throw error;
  }
};

const storePendingTransaction = async (
  hash: string,
  userAddress: string,
  amount: string,
  duration: "month" | "year"
) => {
  await addDoc(collection(db, "pendingTransactions"), {
    hash,
    userAddress,
    amount,
    duration,
    createdAt: new Date(),
  });
};

export const checkPaymentStatus = async (transactionHash: string): Promise<boolean> => {
  if (typeof window.ethereum === "undefined") {
    throw new Error("Ethereum object not found. Do you have MetaMask installed?");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const receipt = await provider.getTransactionReceipt(transactionHash);

  return receipt !== null && receipt.status === 1;
};

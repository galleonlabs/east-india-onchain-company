// src/services/blockchain.ts
import { ethers } from "ethers";
import { db } from "./firebase";
import { addDoc, collection } from "firebase/firestore";

const RECEIVER_ADDRESS = "0x30B0D5758c79645Eb925825E1Ee8A2c448812F37";

export const createTransaction = async (amount: string): Promise<ethers.TransactionResponse> => {
  try {
    if (typeof window.ethereum === "undefined") {
      throw new Error("Ethereum object not found. Do you have MetaMask installed?");
    }

    await window.ethereum.request({ method: "eth_requestAccounts" });
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const tx = await signer.sendTransaction({
      to: RECEIVER_ADDRESS,
      value: ethers.parseEther(amount),
    });

    return tx;
  } catch (error) {
    console.error("Transaction failed:", error);
    throw new Error("Failed to create transaction. Please try again.");
  }
};

export const storePendingTransaction = async (
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

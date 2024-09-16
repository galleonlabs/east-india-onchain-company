// src/services/walletAuth.ts
import { ethers } from "ethers";
import { User } from "../types";
import { db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export const connectWallet = async (): Promise<string> => {
  if (typeof window.ethereum !== "undefined") {
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      return await signer.getAddress();
    } catch (error) {
      console.error("User rejected connection:", error);
      throw error;
    }
  } else {
    console.error("Ethereum object not found, do you have MetaMask installed?");
    throw new Error("No crypto wallet found. Please install MetaMask.");
  }
};

export const getOrCreateUser = async (address: string): Promise<User> => {
  const userRef = doc(db, "users", address);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data() as User;
  } else {
    const newUser: User = {
      address,
      isPaidUser: false,
    };
    await setDoc(userRef, newUser);
    return newUser;
  }
};

export const isAdmin = (address: string): boolean => {
  return address.toLowerCase() === "0x30B0D5758c79645Eb925825E1Ee8A2c448812F37".toLowerCase();
};

export const updateUserSubscription = async (address: string, subscriptionData: Partial<User>) => {
  const userRef = doc(db, "users", address);
  await setDoc(userRef, subscriptionData, { merge: true });
};

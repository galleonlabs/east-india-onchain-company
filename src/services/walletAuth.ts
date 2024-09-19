// src/services/walletAuth.ts
import { User } from "../types";
import { db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export const getOrCreateUser = async (address: string): Promise<User> => {
  const userRef = doc(db, "users", address);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data() as User;
  } else {
    const newUser: User = {
      address,
      isPaidUser: false,
      telegramNotificationsEnabled: false
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

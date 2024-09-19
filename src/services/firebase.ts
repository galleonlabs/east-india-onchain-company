// src/services/firebase.ts

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  getDoc,
  Timestamp,
  runTransaction,
} from "firebase/firestore";
import { User, YieldOpportunity } from "../types";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CachedData {
  timestamp: number;
  data: YieldOpportunity[];
  userStatus: "public" | "free" | "paid";
  recentCount: number;
}

interface YieldOpportunitiesResponse {
  opportunities: YieldOpportunity[];
  recentOpportunitiesCount: number;
}

const cache: { [key: string]: CachedData } = {};

async function getUserStatus(userAddress: string): Promise<"free" | "paid"> {
  const userDoc = await getDoc(doc(db, "users", userAddress));
  const userData = userDoc.data() as User | undefined;
  return userData?.isPaidUser ? "paid" : "free";
}

export const addYieldOpportunity = async (opportunity: Omit<YieldOpportunity, "id">): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, "yieldOpportunities"), {
      ...opportunity,
      dateAdded: Timestamp.now(),
    });
    await updateYieldLastUpdated();
    return docRef.id;
  } catch (error) {
    console.error("Error adding yield opportunity:", error);
    throw new Error("Failed to add yield opportunity");
  }
};

export const updateYieldOpportunity = async (id: string, opportunity: Partial<YieldOpportunity>): Promise<void> => {
  try {
    await updateDoc(doc(db, "yieldOpportunities", id), opportunity);
    await updateYieldLastUpdated();
  } catch (error) {
    console.error("Error updating yield opportunity:", error);
    throw new Error("Failed to update yield opportunity");
  }
};

export const deleteYieldOpportunity = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "yieldOpportunities", id));
    await updateYieldLastUpdated();
  } catch (error) {
    console.error("Error deleting yield opportunity:", error);
    throw new Error("Failed to delete yield opportunity");
  }
};

export const getYieldOpportunities = async (userAddress?: string): Promise<YieldOpportunitiesResponse> => {
  try {
    const now = Date.now();
    const cacheKey = userAddress || "public";
    let currentUserStatus: "public" | "free" | "paid" = "public";

    if (userAddress) {
      currentUserStatus = await getUserStatus(userAddress);
    }

    // Check if we have valid cached data for the current user status
    if (
      cache[cacheKey] &&
      now - cache[cacheKey].timestamp < CACHE_DURATION &&
      cache[cacheKey].userStatus === currentUserStatus
    ) {
      return {
        opportunities: cache[cacheKey].data,
        recentOpportunitiesCount: cache[cacheKey].recentCount,
      };
    }

    let opportunities: YieldOpportunity[];
    let recentOpportunitiesCount = 0;

    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - 48);

    const allOpportunitiesQuery = query(collection(db, "yieldOpportunities"));
    const allOpportunitiesSnapshot = await getDocs(allOpportunitiesQuery);

    const allOpportunities = allOpportunitiesSnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as YieldOpportunity)
    );

    if (currentUserStatus === "public" || currentUserStatus === "free") {
      opportunities = allOpportunities.filter((opp) => opp.dateAdded.toDate() <= cutoffDate);
      recentOpportunitiesCount = allOpportunities.length - opportunities.length;
    } else {
      opportunities = allOpportunities;
      recentOpportunitiesCount = 0;
    }

    // Update the cache
    cache[cacheKey] = {
      timestamp: now,
      data: opportunities,
      userStatus: currentUserStatus,
      recentCount: recentOpportunitiesCount,
    };

    return { opportunities, recentOpportunitiesCount };
  } catch (error) {
    console.error("Error fetching yield opportunities:", error);
    throw new Error("Failed to fetch yield opportunities");
  }
};

export const checkUserSubscriptionStatus = async (userAddress: string): Promise<boolean> => {
  try {
    const userDocRef = doc(db, "users", userAddress);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();

      if (!userData.isPaidUser) {
        return false;
      }

      const subscriptionExpiry = userData.subscriptionExpiry as Timestamp;
      if (subscriptionExpiry && subscriptionExpiry.toDate() > new Date()) {
        return true;
      } else {
        // Subscription has expired, update user status
        await updateDoc(userDocRef, { isPaidUser: false });
        return false;
      }
    } else {
      return false;
    }
  } catch (error) {
    console.error("Error checking user subscription status:", error);
    throw new Error("Failed to check user subscription status");
  }
};

export const getYieldLastUpdated = async (): Promise<Timestamp | null> => {
  try {
    const metadataRef = doc(db, "metadata", "yieldData");
    const metadataSnap = await getDoc(metadataRef);

    if (metadataSnap.exists()) {
      return metadataSnap.data().yieldLastUpdated as Timestamp;
    }
    return null;
  } catch (error) {
    console.error("Error fetching last updated timestamp:", error);
    throw new Error("Failed to fetch last updated timestamp");
  }
};

const updateYieldLastUpdated = async (): Promise<void> => {
  try {
    const metadataRef = doc(db, "metadata", "yieldData");
    await updateDoc(metadataRef, {
      yieldLastUpdated: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error updating last updated timestamp:", error);
    throw new Error("Failed to update last updated timestamp");
  }
};

export const updateUserSubscription = async (userAddress: string, duration: "month" | "year"): Promise<void> => {
  try {
    await runTransaction(db, async (transaction) => {
      const userDocRef = doc(db, "users", userAddress);
      const userDoc = await transaction.get(userDocRef);

      if (!userDoc.exists()) {
        throw new Error("User does not exist");
      }

      const userData = userDoc.data();
      let newExpiryDate: Date;

      if (userData.subscriptionExpiry && userData.subscriptionExpiry.toDate() > new Date()) {
        newExpiryDate = userData.subscriptionExpiry.toDate();
      } else {
        newExpiryDate = new Date();
      }

      if (duration === "month") {
        newExpiryDate.setMonth(newExpiryDate.getMonth() + 1);
      } else {
        newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 1);
      }

      transaction.update(userDocRef, {
        isPaidUser: true,
        subscriptionExpiry: Timestamp.fromDate(newExpiryDate),
      });
    });
  } catch (error) {
    console.error("Error updating user subscription:", error);
    throw new Error("Failed to update user subscription");
  }
};

export const clearYieldOpportunitiesCache = (userAddress?: string) => {
  if (userAddress) {
    delete cache[userAddress];
  } else {
    Object.keys(cache).forEach((key) => delete cache[key]);
  }
};

export const updateUserTelegramSettings = async (
  userAddress: string,
  telegramNotificationsEnabled: boolean,
  telegramChatId?: string
) => {
  const userRef = doc(db, "users", userAddress);
  await updateDoc(userRef, {
    telegramNotificationsEnabled,
    telegramChatId,
  });
};
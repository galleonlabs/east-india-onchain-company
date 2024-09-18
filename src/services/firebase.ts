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
  where,
  getCountFromServer,
  query,
  limit,
  getDoc,
  Timestamp,
  runTransaction,
} from "firebase/firestore";
import { OpportunityCategory, YieldOpportunity } from "../types";

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

const CACHE_KEY = "yieldOpportunities";

const getFromCache = (): YieldOpportunity[] | null => {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const parsedCache = JSON.parse(cached);
    if (!Array.isArray(parsedCache)) {
      return null;
    }
    return parsedCache;
  } catch (error) {
    console.error("Error reading from cache:", error);
    return null;
  }
};

const setCache = (data: YieldOpportunity[]) => {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Error setting cache:", error);
  }
};

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

export const getYieldOpportunities = async (): Promise<YieldOpportunity[]> => {
  const cached = getFromCache();
  if (cached) {
    return cached;
  }

  try {
    const q = query(collection(db, "yieldOpportunities"));
    const querySnapshot = await getDocs(q);
    const opportunities = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as YieldOpportunity));
    setCache(opportunities);
    return opportunities;
  } catch (error) {
    console.error("Error fetching yield opportunities:", error);
    throw new Error("Failed to fetch yield opportunities");
  }
};

export const getYieldOpportunitiesSample = async () => {
  const cached = getFromCache();
  if (cached) {
    const sampleOpportunities = cached.filter((opp) => opp.category !== "advancedStrategies").slice(0, 4);
    const counts: Record<OpportunityCategory, number> = cached.reduce((acc, opp) => {
      acc[opp.category] = (acc[opp.category] || 0) + 1;
      return acc;
    }, {} as Record<OpportunityCategory, number>);
    return { opportunities: sampleOpportunities, counts };
  }

  try {
    const sampleOpportunities: YieldOpportunity[] = [];
    const counts: Record<OpportunityCategory, number> = {
      stablecoin: 0,
      volatileAsset: 0,
      advancedStrategies: 0,
    };

    const categoriesToFetch: OpportunityCategory[] = ["stablecoin", "volatileAsset"];

    for (const category of categoriesToFetch) {
      // Fetch benchmark record
      const benchmarkQuery = query(
        collection(db, "yieldOpportunities"),
        where("category", "==", category),
        where("isBenchmark", "==", true),
        limit(1)
      );
      const benchmarkSnapshot = await getDocs(benchmarkQuery);

      // Fetch random non-benchmark record
      const randomQuery = query(
        collection(db, "yieldOpportunities"),
        where("category", "==", category),
        where("isBenchmark", "==", false),
        limit(1)
      );
      const randomSnapshot = await getDocs(randomQuery);

      // Get total count for the category
      const countQuery = query(collection(db, "yieldOpportunities"), where("category", "==", category));
      const countSnapshot = await getCountFromServer(countQuery);
      counts[category] = countSnapshot.data().count;

      // Add benchmark record if exists
      if (!benchmarkSnapshot.empty) {
        sampleOpportunities.push({
          id: benchmarkSnapshot.docs[0].id,
          ...benchmarkSnapshot.docs[0].data(),
        } as YieldOpportunity);
      }

      // Add random record if exists
      if (!randomSnapshot.empty) {
        sampleOpportunities.push({
          id: randomSnapshot.docs[0].id,
          ...randomSnapshot.docs[0].data(),
        } as YieldOpportunity);
      }
    }

    // Get count for advancedStrategies
    const advancedCountQuery = query(
      collection(db, "yieldOpportunities"),
      where("category", "==", "advancedStrategies")
    );
    const advancedCountSnapshot = await getCountFromServer(advancedCountQuery);
    counts.advancedStrategies = advancedCountSnapshot.data().count;

    // Cache the full set of opportunities
    const allOpportunities = await getYieldOpportunities();
    setCache(allOpportunities);

    return { opportunities: sampleOpportunities, counts };
  } catch (error) {
    console.error("Error fetching yield opportunities sample:", error);
    throw new Error("Failed to fetch yield opportunities sample");
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

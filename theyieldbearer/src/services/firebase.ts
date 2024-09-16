// src/services/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, getDocs, where, getCountFromServer, query, limit, getDoc, Timestamp } from "firebase/firestore";
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

export const addYieldOpportunity = async (opportunity: Omit<YieldOpportunity, "id">) => {
  const docRef = await addDoc(collection(db, "yieldOpportunities"), opportunity);
  return docRef.id;
};

export const updateYieldOpportunity = async (id: string, opportunity: Partial<YieldOpportunity>) => {
  await updateDoc(doc(db, "yieldOpportunities", id), opportunity);
};

export const deleteYieldOpportunity = async (id: string) => {
  await deleteDoc(doc(db, "yieldOpportunities", id));
};

export const getYieldOpportunities = async (): Promise<YieldOpportunity[]> => {
  const querySnapshot = await getDocs(collection(db, "yieldOpportunities"));
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as YieldOpportunity));
};

export const getYieldOpportunitiesSample = async () => {
  const sampleOpportunities: YieldOpportunity[] = [];
  const counts: Record<OpportunityCategory, number> = {
    stablecoin: 0,
    volatileAsset: 0,
    advancedStrategies: 0,
  };

  for (const category of Object.keys(counts) as OpportunityCategory[]) {
    const querySnapshot = await getDocs(
      query(collection(db, "yieldOpportunities"), where("category", "==", category), limit(1))
    );
    const countSnapshot = await getCountFromServer(
      query(collection(db, "yieldOpportunities"), where("category", "==", category))
    );

    counts[category] = countSnapshot.data().count;

    if (!querySnapshot.empty) {
      sampleOpportunities.push({ id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as YieldOpportunity);
    }
  }

  return { opportunities: sampleOpportunities, counts };
};

export const checkUserSubscriptionStatus = async (userAddress: string): Promise<boolean> => {
  try {
    const userDocRef = doc(db, "users", userAddress);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();

      // Check if user is marked as a paid user
      if (!userData.isPaidUser) {
        return false;
      }

      // Check if subscription has expired
      const subscriptionExpiry = userData.subscriptionExpiry as Timestamp;
      if (subscriptionExpiry && subscriptionExpiry.toDate() > new Date()) {
        return true;
      } else {
        // Subscription has expired
        return false;
      }
    } else {
      // User document doesn't exist
      return false;
    }
  } catch (error) {
    console.error("Error checking user subscription status:", error);
    // In case of error, we assume the user is not subscribed
    return false;
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
    return null;
  }
};

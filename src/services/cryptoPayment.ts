import { ethers } from "ethers";
import { User } from "../types";
import { db } from "./firebase";
import { addDoc, collection, Timestamp, updateDoc, getDocs, query, where } from "firebase/firestore";
import { updateUserSubscription } from "./firebase";
import { NetworkConfig, networks} from "../config/networks";

const RECEIVER_ADDRESS = "0x30B0D5758c79645Eb925825E1Ee8A2c448812F37";

export interface PaymentDetails {
  amount: string;
  duration: "month" | "year";
  network: NetworkConfig;
}

export const getPaymentDetails = (duration: "month" | "year", network: NetworkConfig): PaymentDetails => {
  return {
    amount: duration === "month" ? "0.01" : "0.10",
    duration,
    network,
  };
};

export const initiatePayment = async (
  user: User,
  paymentDetails: PaymentDetails,
  network: NetworkConfig
): Promise<string> => {
  if (typeof window.ethereum === "undefined") {
    throw new Error("Ethereum object not found. Do you have MetaMask installed?");
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: network.chainId }],
    });

    await window.ethereum.request({ method: "eth_requestAccounts" });
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const tx = await signer.sendTransaction({
      to: RECEIVER_ADDRESS,
      value: ethers.parseEther(paymentDetails.amount),
    });

    await storePendingTransaction(
      tx.hash,
      user.address,
      paymentDetails.amount,
      paymentDetails.duration,
      network.chainId
    );

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

export const checkPaymentStatus = async (transactionHash: string, chainId: string): Promise<boolean> => {
  if (typeof window.ethereum === "undefined") {
    throw new Error("Ethereum object not found. Do you have MetaMask installed?");
  }

  try {
    const network = networks.find((n) => n.chainId === chainId);
    if (!network) {
      throw new Error("Invalid network");
    }

    const provider = new ethers.JsonRpcProvider(network.rpcUrl);
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

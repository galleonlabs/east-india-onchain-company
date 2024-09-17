import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  getPaymentDetails,
  MONTH_PRICE,
  storePendingTransaction,
  updateTransactionStatus,
  YEAR_PRICE,
} from "../services/cryptoPayment";
import { checkUserSubscriptionStatus } from "../services/firebase";
import { networks } from "../config/networks";
import TransactionDetails from "../components/TransactionDetails";
import { useSendTransaction, useWaitForTransactionReceipt, useChainId } from "wagmi";
import { parseEther, toHex } from "viem";

const Subscribe: React.FC = () => {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionHash, setTransactionHash] = useState<`0x${string}` | undefined>();
  const [message, setMessage] = useState<{ type: "info" | "success" | "error"; content: string } | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const chainId = useChainId();
  const { sendTransactionAsync } = useSendTransaction();

  const { isLoading: _, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: transactionHash,
  });

  const checkStatus = useCallback(async () => {
    if (user) {
      try {
        const status = await checkUserSubscriptionStatus(user.address);
        setIsSubscribed(status);
      } catch (error) {
        console.error("Error checking subscription status:", error);
        setMessage({ type: "error", content: "Failed to check subscription status. Please try again." });
      }
    }
  }, [user]);

  useEffect(() => {
    checkStatus();
    const intervalId = setInterval(checkStatus, 30000); // Check every 30 seconds
    return () => clearInterval(intervalId);
  }, [checkStatus]);

  useEffect(() => {
    if (isConfirmed && transactionHash) {
      updateTransactionStatus(transactionHash, "completed")
        .then(() => {
          setMessage({
            type: "success",
            content: "Your subscription has been activated. Enjoy full access!",
          });
          checkStatus();
        })
        .catch((error) => {
          console.error("Error updating transaction status:", error);
          setMessage({
            type: "error",
            content: "Failed to update transaction status. Please contact support.",
          });
        });
    }
  }, [isConfirmed, transactionHash, checkStatus]);

  const handleSubscribe = async (duration: "month" | "year") => {
    if (!user || !chainId) {
      setMessage({ type: "error", content: "Please connect your wallet and select a network first" });
      return;
    }

    const network = networks.find((n) => n.chainId === toHex(chainId));
    if (!network) {
      setMessage({ type: "error", content: "Unsupported network" });
      return;
    }

    setIsProcessing(true);
    try {
      const details = getPaymentDetails(duration, network);
      const tx = await sendTransactionAsync({
        to: import.meta.env.VITE_PAYMENT_WALLET as `0x${string}`,
        value: parseEther(details.amount),
      });
      setTransactionHash(tx);
      await storePendingTransaction(tx, user.address, details.amount, details.duration, toHex(chainId));
      setMessage({
        type: "info",
        content: "Transaction initiated. Please wait for confirmation...",
      });
    } catch (error) {
      console.error("Subscription failed:", error);
      setMessage({ type: "error", content: `Subscription failed: ${(error as Error).message}` });
    } finally {
      setIsProcessing(false);
    }
  };

  const renderSubscriptionOption = (duration: "month" | "year", amount: string) => (
    <div className="bg-theme-pan-champagne border border-theme-pan-navy p-4 text-theme-pan-navy">
      <h3 className="text-xl mb-2 font-bold">{duration.toUpperCase()} ACCESS</h3>
      <p className="mb-4">Access all yield opportunities for one {duration}</p>
      <p className="text-2xl mb-4">{amount} ETH</p>
      <button
        onClick={() => handleSubscribe(duration)}
        disabled={isProcessing || isSubscribed}
        className="w-full bg-theme-pan-navy/10 hover:bg-theme-pan-navy/20 text-theme-pan-navy font-bold py-2 px-4 disabled:opacity-50"
      >
        {isProcessing ? "Processing..." : `Unlock ${duration.charAt(0).toUpperCase() + duration.slice(1)} Access`}
      </button>
    </div>
  );

  return (
    <div className="">
      <h1 className="text-2xl font-bold mb-8 text-theme-pan-navy">UNLOCK ACCESS</h1>
      {message && (
        <div
          className={`p-4 mb-4 text-theme-pan-navy ${
            message.type === "error"
              ? "bg-red-800/30"
              : message.type === "success"
              ? "bg-theme-pan-navy/10"
              : "bg-theme-pan-sky/10"
          }`}
        >
          <p>{message.content}</p>
          <button onClick={() => setMessage(null)} className="mt-2 text-md underline">
            Dismiss
          </button>
        </div>
      )}

      {isSubscribed ? (
        <div className="bg-theme-pan-champagne border border-theme-pan-navy bg-theme-pan-sky/10 text-theme-pan-navy p-6 mb-8">
          <h2 className="text-xl mb-4 terminal-prompt">You have already unlocked access</h2>
          <p>Enjoy viewing all of our curated yield opportunities.</p>
        </div>
      ) : (
        <div className="bg-theme-pan-navy/10 text-theme-pan-navy p-6 mb-8">
          <h2 className="text-xl mb-4">Choose access duration</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderSubscriptionOption("month", MONTH_PRICE)}
            {renderSubscriptionOption("year", YEAR_PRICE)}
          </div>
        </div>
      )}

      {transactionHash && chainId && (
        <TransactionDetails transactionHash={transactionHash} networkChainId={toHex(chainId)} />
      )}
    </div>
  );
};

export default Subscribe;

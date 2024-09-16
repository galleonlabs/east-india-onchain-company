// src/pages/Subscribe.tsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getPaymentDetails, initiatePayment, PaymentDetails } from "../services/cryptoPayment";
import { checkUserSubscriptionStatus } from "../services/firebase"; // Assuming this function exists

const Subscribe: React.FC = () => {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "info" | "success" | "error"; content: string } | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      if (user) {
        const status = await checkUserSubscriptionStatus(user.address);
        setIsSubscribed(status);
      }
    };

    checkStatus();
    const intervalId = setInterval(checkStatus, 30000); // Check every 30 seconds

    return () => clearInterval(intervalId);
  }, [user]);

  useEffect(() => {
    if (transactionHash) {
      setMessage({
        type: "info",
        content:
          "Your transaction has been initiated. It may take up to 5 minutes for your subscription to be enabled. Please wait...",
      });
    }
  }, [transactionHash]);

  const handleSubscribe = async (duration: "month" | "year") => {
    if (!user) {
      setMessage({ type: "error", content: "Please connect your wallet first" });
      return;
    }

    setIsProcessing(true);
    try {
      const paymentDetails: PaymentDetails = getPaymentDetails(duration);
      const txHash = await initiatePayment(user, paymentDetails);
      setTransactionHash(txHash);
    } catch (error) {
      console.error("Subscription failed:", error);
      setMessage({ type: "error", content: "Subscription failed. Please try again." });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="terminal-content">
      <h1 className="text-2xl font-bold mb-8 terminal-prompt text-terminal">UNLOCK_ACCESS</h1>

      {message && (
        <div
          className={`p-4 mb-4 text-terminal ${
            message.type === "error"
              ? "bg-red-800/30"
              : message.type === "success"
              ? "bg-terminal/30"
              : "bg-gray-800/30"
          }`}
        >
          <p>### {message.content}</p>
          <button onClick={() => setMessage(null)} className="mt-2 text-md underline">
            Dismiss
          </button>
        </div>
      )}

      {isSubscribed ? (
        <div className="bg-black border border-terminal text-terminal p-6 mb-8">
          <h2 className="text-xl mb-4 terminal-prompt">You have already unlocked access</h2>
          <p>### Enjoy viewing all of our curated yield opportunities.</p>
        </div>
      ) : (
        <div className="bg-terminal/30 text-terminal p-6 mb-8">
          <h2 className="text-xl mb-4">### Choose access duration</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-black border border-terminal p-4 text-terminal ">
              <h3 className="text-xl mb-2 font-bold">MONTH_ACCESS</h3>
              <p className="mb-4">Access all yield opportunities for one month</p>
              <p className="text-2xl mb-4">0.01 ETH</p>
              <button
                onClick={() => handleSubscribe("month")}
                disabled={isProcessing}
                className="w-full bg-terminal hover:bg-terminal/70 text-black font-bold py-2 px-4 disabled:opacity-50"
              >
                {isProcessing ? "Processing..." : "Unlock One Month Access"}
              </button>
            </div>

            <div className="bg-black border border-terminal p-4 text-terminal ">
              <h3 className="text-xl mb-2 font-bold">YEAR_ACCESS</h3>
              <p className="mb-4">Access all yield opportunities for one year</p>
              <p className="text-2xl mb-4">0.10 ETH</p>
              <button
                onClick={() => handleSubscribe("year")}
                disabled={isProcessing}
                className="w-full bg-terminal hover:bg-terminal/70 text-black font-bold py-2 px-4 disabled:opacity-50"
              >
                {isProcessing ? "Processing..." : "Unlock One Year Access"}
              </button>
            </div>
          </div>
        </div>
      )}

      {transactionHash && (
        <div className="bg-terminal/30 text-terminal p-6 ">
          <h2 className="text-xl mb-4 terminal-prompt">Transaction Details</h2>
          <p className="font-mono break-all">Transaction Hash: {transactionHash}</p>
        </div>
      )}
    </div>
  );
};

export default Subscribe;

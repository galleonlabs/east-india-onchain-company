// src/components/PaymentPrompt.tsx
import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { createTransaction, storePendingTransaction } from "../services/blockchain";

const PaymentPrompt: React.FC = () => {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: "info" | "success" | "error"; content: string } | null>(null);

  const handlePayment = async (amount: string, duration: "month" | "year") => {
    if (!user) {
      setMessage({ type: "error", content: "Please connect your wallet first" });
      return;
    }

    setIsProcessing(true);
    try {
      const tx = await createTransaction(amount);
      const receipt = await tx.wait();
      if (!receipt) {
        throw new Error("Transaction failed");
      }
      await storePendingTransaction(receipt.hash, user.address, amount, duration);
      setMessage({
        type: "success",
        content:
          "Payment sent! Your access will be activated once the transaction is confirmed. This may take up to 5 minutes.",
      });
    } catch (error) {
      console.error("Payment failed:", error);
      setMessage({ type: "error", content: "Payment failed. Please try again." });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 bg-gray-800  text-terminal">
      <h2 className="text-xl mb-4 terminal-prompt">UNLOCK_ACCESS</h2>

      {message && (
        <div
          className={`p-4  mb-4  ${
            message.type === "error" ? "bg-red-800/30" : message.type === "success" ? "bg-terminal/30" : "bg-red-800/30"
          }`}
        >
          <p>### {message.content}</p>
          <button onClick={() => setMessage(null)} className="mt-2 text-sm underline">
            Dismiss
          </button>
        </div>
      )}

      <button
        onClick={() => handlePayment("0.01", "month")}
        disabled={isProcessing}
        className="bg-terminal hover:bg-terminal/30 text-black font-bold py-2 px-4 rounded mr-4 disabled:opacity-50"
      >
        {isProcessing ? "Processing..." : "Pay 0.01 ETH for 1 Month"}
      </button>
      <button
        onClick={() => handlePayment("0.10", "year")}
        disabled={isProcessing}
        className="bg-terminal hover:bg-terminal/30 text-black font-bold py-2 px-4 rounded disabled:opacity-50"
      >
        {isProcessing ? "Processing..." : "Pay 0.10 ETH for 1 Year"}
      </button>
    </div>
  );
};

export default PaymentPrompt;

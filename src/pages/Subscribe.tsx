import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  getPaymentDetails,
  MONTH_PRICE,
  storePendingTransaction,
  updateTransactionStatus,
  YEAR_PRICE,
} from "../services/cryptoPayment";
import { checkUserSubscriptionStatus, updateUserTelegramSettings } from "../services/firebase";
import { networks } from "../config/networks";
import TransactionDetails from "../components/TransactionDetails";
import { useSendTransaction, useWaitForTransactionReceipt, useChainId } from "wagmi";
import { parseEther, toHex } from "viem";
import TelegramInstructions from "../components/TelegramInstructions";

const Subscribe: React.FC = () => {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionHash, setTransactionHash] = useState<`0x${string}` | undefined>();
  const [message, setMessage] = useState<{ type: "info" | "success" | "error"; content: string } | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [telegramNotificationsEnabled, setTelegramNotificationsEnabled] = useState(false);
  const [telegramChatId, setTelegramChatId] = useState("");
  const chainId = useChainId();
  const { sendTransactionAsync } = useSendTransaction();

  const { isLoading: _, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: transactionHash,
  });

  useEffect(() => {
    if (user) {
      setTelegramNotificationsEnabled(user.telegramNotificationsEnabled || false);
      setTelegramChatId(user.telegramChatId || "");
    }
  }, [user]);

  const checkStatus = useCallback(async () => {
    if (user) {
      try {
        const status = await checkUserSubscriptionStatus(user.address);
        setIsSubscribed(status);
      } catch (error) {
        console.error("Error checking access status:", error);
        setMessage({ type: "error", content: "Failed to check access status. Please try again." });
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
            content: "Your access has been activated!",
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

  const handleTelegramOptIn = async () => {
    if (!user) return;

    try {
      await updateUserTelegramSettings(user.address, telegramNotificationsEnabled, telegramChatId);
      setMessage({ type: "success", content: "Telegram notification settings updated successfully." });
    } catch (error) {
      console.error("Error updating Telegram settings:", error);
      setMessage({ type: "error", content: "Failed to update Telegram settings. Please try again." });
    }
  };

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
      console.error("Access failed:", error);
      setMessage({ type: "error", content: `Access failed: ${(error as Error).message}` });
    } finally {
      setIsProcessing(false);
    }
  };

  const renderSubscriptionOption = (duration: "month" | "year", amount: string) => (
    <div className="rounded-md p-4 text-theme-navy border border-theme-navy   bg-theme-oldlace shadow-md">
      <h3 className="text-xl mb-2 ">{duration.charAt(0).toUpperCase() + duration.slice(1)} Access</h3>
      <p className="mb-4">Access all yield opportunities for one {duration}</p>
      <p className="text-2xl mb-4 font-morion font-semibold">{amount} ETH</p>
      <button
        onClick={() => handleSubscribe(duration)}
        disabled={isProcessing || isSubscribed}
        className="w-full bg-theme-navy text-theme-oldlace hover:opacity-70   py-2 px-4 disabled:opacity-50 rounded-md"
      >
        {isProcessing ? "Processing..." : `Unlock ${duration.charAt(0).toUpperCase() + duration.slice(1)} Access`}
      </button>
    </div>
  );

  return (
    <div className="text-theme-pan-navy  max-w-4xl mx-auto bg-[url('/Frame.png')]  bg-no-repeat bg-cover bg-center">
      <h1 className="text-3xl font-morion font-semibold mb-6">Join the Crew</h1>

      {!isSubscribed && (
        <div className=" text-theme-navy bg-theme-champagne/40  bg-no-repeat bg-cover bg-center px-6 mb-8 rounded-md">
          <h2 className="text-2xl mb-4">Unlocking Full Access</h2>
          <ul className="list-disc list-inside text-md space-y-2">
            <li>Choose your preferred access duration (month or year).</li>
            <li>Click the desired button to initiate a payment request.</li>
            <li>Confirm the transaction in your wallet (MetaMask, Rabby, etc.).</li>
            <li>On blockchain confirmation, your account will be automatically upgraded to full access.</li>
            <li>Enjoy no 48-hour delay on new opportunities, PDF reports & Telegram alerts.</li>
            <li>Access all future new crew benefits as they develop.</li>
          </ul>
        </div>
      )}

      {message && !isSubscribed && (
        <div
          className={`p-4 mb-8 ${
            message.type === "error"
              ? "text-theme-pan-champagne  bg-theme-navy rounded-md"
              : message.type === "success"
              ? "text-theme-pan-champagne  bg-theme-navy rounded-md"
              : "text-theme-pan-champagne  bg-theme-navy rounded-md"
          }`}
        >
          <p>{message.content}</p>
          <button onClick={() => setMessage(null)} className="mt-2 text-md underline">
            Dismiss
          </button>
        </div>
      )}

      {isSubscribed ? (
        <div className=" rounded-md bg-theme-sky border border-theme-navy text-theme-oldlace p-6 mb-8 shadow-md">
          <h2 className="text-xl mb-4 terminal-prompt">You have joined the crew</h2>
          <p>Enjoy immediate access to all new yield opportunities.</p>
        </div>
      ) : (
        <div className="bg-theme-oldlace border border-theme-navy text-theme-navy  bg-center p-6 mb-8 rounded-md shadow-md">
          <h2 className="text-2xl mb-4">Choose your duration</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderSubscriptionOption("month", MONTH_PRICE)}
            {renderSubscriptionOption("year", YEAR_PRICE)}
          </div>
        </div>
      )}

      {transactionHash && chainId && (
        <TransactionDetails transactionHash={transactionHash} networkChainId={toHex(chainId)} />
      )}

      <div
        className={`bg-theme-oldlace rounded-md text-theme-navy border border-theme-navy p-6 mb-8  shadow-md ${
          !isSubscribed ? "opacity-50" : ""
        }`}
      >
        <h2 className="text-xl mb-4">Telegram Notifications</h2>
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="telegramNotifications"
            checked={telegramNotificationsEnabled}
            onChange={(e) => setTelegramNotificationsEnabled(e.target.checked)}
            className="mr-2 "
            disabled={!isSubscribed}
          />
          <label htmlFor="telegramNotifications">Enable Telegram notifications for new yield opportunities</label>
        </div>
        <div className="mb-4">
          <label htmlFor="telegramChatId" className="block mb-2">
            Telegram Chat ID:
          </label>
          <input
            type="text"
            id="telegramChatId"
            value={telegramChatId}
            onChange={(e) => setTelegramChatId(e.target.value)}
            className="w-full p-2 rounded-md text-theme-navy border-theme-copper border-2"
            placeholder="Enter your Telegram Chat ID"
            disabled={!isSubscribed}
          />
        </div>
        <TelegramInstructions />
        <button
          onClick={handleTelegramOptIn}
          className="bg-theme-sky text-theme-oldlace border border-theme-navy px-4 py-2 rounded mt-4 hover:opacity-70"
          disabled={!isSubscribed}
        >
          Save Telegram Settings
        </button>
        {!isSubscribed && (
          <p className="mt-4 text-theme-navy">
            Join the crew to enable Telegram notifications for instant updates on new yield opportunities.
          </p>
        )}
      </div>
    </div>
  );
};

export default Subscribe;

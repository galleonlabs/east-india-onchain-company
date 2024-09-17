// Subscribe.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getPaymentDetails, initiatePayment, PaymentDetails, checkPaymentStatus } from "../services/cryptoPayment";
import { checkUserSubscriptionStatus } from "../services/firebase";
import { NetworkConfig, networks } from "../config/networks";
import TransactionDetails from "../components/TransactionDetails";

const Subscribe: React.FC = () => {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "info" | "success" | "error"; content: string } | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkConfig | null>(null);

  const handleNetworkChange = async (networkId: string) => {
    const network = networks.find((n) => n.chainId === networkId);
    if (network) {
      setSelectedNetwork(network);
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: network.chainId }],
        });
      } catch (error: any) {
        if (error.code === 4902) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: network.chainId,
                  chainName: network.name,
                  nativeCurrency: network.nativeCurrency,
                  rpcUrls: [network.rpcUrl],
                  blockExplorerUrls: [network.blockExplorerUrl],
                },
              ],
            });
          } catch (addError) {
            console.error("Error adding network:", addError);
          }
        }
        console.error("Error switching network:", error);
      }
    }
  };

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
    if (transactionHash) {
      const checkTransaction = async () => {
        try {
          const status = await checkPaymentStatus(transactionHash, selectedNetwork?.chainId || "");
          if (status) {
            setMessage({
              type: "success",
              content: "Your subscription has been activated. Enjoy full access!",
            });
            checkStatus(); // Recheck subscription status
          } else {
            setMessage({
              type: "info",
              content: "Transaction is still processing. Please wait...",
            });
            setTimeout(checkTransaction, 30000); // Check again after 30 seconds
          }
        } catch (error) {
          console.error("Error checking transaction status:", error);
          setMessage({
            type: "error",
            content: "Failed to verify transaction. Please contact support if this persists.",
          });
        }
      };
      checkTransaction();
    }
  }, [transactionHash, checkStatus]);

  const handleSubscribe = async (duration: "month" | "year") => {
    if (!user || !selectedNetwork) {
      setMessage({ type: "error", content: "Please connect your wallet and select a network first" });
      return;
    }

    setIsProcessing(true);
    try {
      const paymentDetails: PaymentDetails = getPaymentDetails(duration, selectedNetwork);
      const txHash = await initiatePayment(user, paymentDetails, selectedNetwork);
      setTransactionHash(txHash);
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

      <div className="mb-4">
        <label htmlFor="network-select" className="block mb-2">
          Select Network:
        </label>
        <select
          id="network-select"
          value={selectedNetwork?.chainId || ""}
          onChange={(e) => handleNetworkChange(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="">Select a network</option>
          {networks.map((network) => (
            <option key={network.chainId} value={network.chainId}>
              {network.name}
            </option>
          ))}
        </select>
      </div>

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
            {renderSubscriptionOption("month", "0.01")}
            {renderSubscriptionOption("year", "0.10")}
          </div>
        </div>
      )}

      {transactionHash && selectedNetwork && (
        <TransactionDetails transactionHash={transactionHash} networkChainId={selectedNetwork.chainId} />
      )}
    </div>
  );
};

export default Subscribe;

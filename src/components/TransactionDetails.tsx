import React from "react";
import { networks } from "../config/networks";

interface TransactionDetailsProps {
  transactionHash: string;
  networkChainId: string;
}

const TransactionDetails: React.FC<TransactionDetailsProps> = ({ transactionHash, networkChainId }) => {
  const getNetworkExplorerUrl = (chainId: string): string => {
    const network = networks.find((n) => n.chainId === chainId);
    return network ? network.blockExplorerUrl : "https://etherscan.io";
  };

  const explorerUrl = getNetworkExplorerUrl(networkChainId);

  return (
    <div className="bg-theme-pan-navy/10 text-terminal p-6">
      <h2 className="text-xl mb-4 terminal-prompt">Transaction Details</h2>
      <p className="break-all">
        Transaction:{" "}
        <a
          className="text-theme-pan-sky"
          target="_blank"
          rel="noopener noreferrer"
          href={`${explorerUrl}/tx/${transactionHash}`}
        >
          {transactionHash}
        </a>
      </p>
    </div>
  );
};

export default TransactionDetails;

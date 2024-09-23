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
    <div className=" text-terminal border-l border-theme-navy px-6 mx-12 mb-8 pb-2 ">
      <h2 className="text-lg mb-2 terminal-prompt">Transaction Details</h2>
      <p className="break-all">
        Explorer:{" "}
        <a
          className="text-theme-sky"
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

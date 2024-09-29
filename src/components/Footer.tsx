// src/components/Footer.tsx
import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-theme-navy text-theme-navy p-4">
      <div className="container mx-auto flex justify-center items-center">
        <a href="https://x.com/galleonlabs" className="mx-2 hover:text-theme-sky" target="_blank">
          Twitter
        </a>
        <a href="https://github.com/galleonlabs" className="mx-2 hover:text-theme-sky" target="_blank">
          GitHub
        </a>
        <a href="https://blog.eastindiaonchaincompany.com" className="mx-2 hover:text-theme-sky" target="_blank">
          Newsletter
        </a>
        <a className="mx-2 hover:text-theme-sky"
            href="mailto:gm@galleonlabs.io"
        >
          Contact
        </a>
      </div>
      <div className="opacity-75 text-sm mt-4 max-w-7xl mx-auto text-center">
        All information provided on this website, including by the East India Onchain Company and its operator, Galleon
        Labs, is intended for educational purposes only and does not constitute financial advice. You are solely
        responsible for your financial decisions. The cryptocurrency market is highly volatile and carries significant
        risk. Conduct thorough research and consult with a licensed financial advisor before making any financial
        decisions.
      </div>
    </footer>
  );
};

export default Footer;

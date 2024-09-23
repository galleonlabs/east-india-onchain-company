// src/pages/Fund.tsx

import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { updateUserFundInterest } from "../services/firebase";
import ResourcesIcon from "../assets/brand/Treasury-Icon.png";

const Fund: React.FC = () => {
  const { user } = useAuth();
  const [isInterested, setIsInterested] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; content: string } | null>(null);

  const handleRegisterInterest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setMessage({ type: "error", content: "Please connect your wallet to register interest." });
      return;
    }

    try {
      await updateUserFundInterest(user.address, true, email);
      setIsInterested(true);
      setMessage({ type: "success", content: "Your interest has been registered successfully!" });
    } catch (error) {
      console.error("Error registering interest:", error);
      setMessage({ type: "error", content: "Failed to register interest. Please try again." });
    }
  };

  return (
    <div className="max-w-4xl mx-auto text-theme-navy bg-[url('/Frame.png')]  bg-no-repeat bg-cover bg-center">
      <h1 className="text-3xl mb-6 font-morion font-semibold">Self-Managed Fund Program</h1>

      <section className="mb-8">
        <div className="flex">
          <h2 className="text-2xl mb-4 bg-theme-champagne/40">About the Program</h2>
          <img src={ResourcesIcon} alt="Feature icon" className="w-10 h-10 -translate-y-1 ml-4 flex-shrink-0" />
        </div>
        <p className="mb-4 bg-theme-champagne/40">
          Our self-managed fund program is designed to guide users in best practices for securing and executing changes
          to their portfolio on-chain. This initiative focuses on stablecoin yield portfolios, taking advantage of high
          yield opportunities whilst managing risk in the decentralized finance ecosystem.
        </p>
      </section>

      <section className="mb-8 border border-theme-navy bg-theme-oldlace text-theme-navy rounded-md  p-6 shadow-md">
        <h2 className="text-2xl mb-4">How does it work</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>Guidance on best practices for on-chain portfolio management</li>
          <li>Portfolio parameters and risk guidelines for stablecoin yield strategies</li>
          <li>Alerts and execution guidance to enter yield opportunities via Telegram and email</li>
          <li>Support contact for self-managing your portfolio</li>
          <li>Educational content on safer decision-making with digital assets</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl mb-4 bg-theme-champagne/40">Register Your Interest</h2>
        {isInterested ? (
          <p className="text-theme-pan-navy bg-theme-champagne/40">
            Thank you for your interest! We'll be in touch soon.
          </p>
        ) : (
          <form onSubmit={handleRegisterInterest} className="space-y-4">
            <div>
              <label htmlFor="email" className="block mb-2">
                Email Address:
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full p-2 border-2 border-theme-copper rounded-md"
              />
            </div>
            <button
              type="submit"
              className="bg-theme-sky border border-theme-navy text-theme-pan-champagne px-4 py-2 rounded-md hover:bg-opacity-70 transition-colors shadow-md"
            >
              Register Interest
            </button>
          </form>
        )}
        {message && (
          <p className={`mt-4 ${message.type === "success" ? "text-theme-sky" : "text-theme-copper"}`}>
            {message.content}
          </p>
        )}
        <p className="mb-4 mt-4 opacity-75 text-theme-navy">
          This program provides strictly educational content to help guide you in making safer decisions with your
          digital assets. It is not financial advice. By registering your interest, you agree to our Terms of Service
          and Privacy Policy. We will never share your email address with third parties.
        </p>
      </section>
    </div>
  );
};

export default Fund;

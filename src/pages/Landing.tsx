// src/pages/Landing.tsx
import React from "react";
import { Link } from "react-router-dom";

const Landing: React.FC = () => {
  return (
    <div className="text-theme-pan-navy">
      <h1 className="text-4xl font-bold mb-6 underline underline-offset-8">
        Yield merchants and traders of natural crypto resources
      </h1>

      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Discover Yield Opportunities</h2>
        <p className="mb-4 text-lg">
          Every week, the East India Onchain Company team curates a selection of yield opportunities in the DeFi sector,
          providing you with insights to make informed decisions about your digital assets.
        </p>
        <p className="mb-4 italic opacity-75">
          "In the vast ocean of DeFi, we are your trusted navigators, charting courses through both familiar and
          unexplored waters."
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-theme-pan-navy/10 p-6 transition-transform duration-300 hover:scale-105">
          <h3 className="text-2xl font-bold mb-3">Stablecoin Yield</h3>
          <p>
            Discover opportunities for your stablecoin holdings. Navigate through strategies designed for stability and
            consistency.
          </p>
        </div>
        <div className="bg-theme-pan-navy/10 p-6 transition-transform duration-300 hover:scale-105">
          <h3 className="text-2xl font-bold mb-3">Volatile Asset Yield</h3>
          <p>
            Explore yield prospects across liquidity pools, staking, and yield farms. Understand the dynamics of
            volatile asset strategies.
          </p>
        </div>
        <div className="bg-theme-pan-navy/10 p-6 transition-transform duration-300 hover:scale-105">
          <h3 className="text-2xl font-bold mb-3">Advanced Strategies</h3>
          <p>
            Access sophisticated yield strategies for seasoned DeFi users. Explore complex territories including options
            and beyond.
          </p>
        </div>
      </div>

      <div className="bg-theme-pan-navy/10 p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">Why sail with us?</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>Weekly curated selection of yield opportunities</li>
          <li>Comprehensive risk assessments and market insights</li>
          <li>Strategies categorized for various risk tolerances</li>
          <li>Continuous monitoring and updates on market trends</li>
        </ul>
      </div>

      <div className="text-center mb-4">
        <p className="text-lg mb-2">Ready to explore the landscape of DeFi yield opportunities?</p>
        <Link
          to="/yield"
          className="hover:bg-theme-pan-navy mx-2 text-lg border border-theme-pan-navy hover:text-theme-pan-champagne py-2 px-6 hover:bg-opacity-90 transition-colors duration-200 inline-block"
        >
          Explore Yield Opportunities
        </Link>
        <Link
          to="/subscribe"
          className="border border-theme-pan-sky mx-2 text-lg text-theme-pan-sky hover:bg-theme-pan-sky hover:text-theme-pan-champagne py-2 px-6 hover:bg-opacity-90 transition-colors duration-200 inline-block mt-4 md:mt-0"
        >
          Unlock Full Access
        </Link>
      </div>

      <div className="text-center text-sm opacity-75 ">
        <p>The East India Onchain Company is operated by Galleon Labs</p>
      </div>
    </div>
  );
};

export default Landing;

import React from "react";
import { Link } from "react-router-dom";
import { Coins, TrendingUp, Bot } from "lucide-react";

// Import icons
import AboutIcon from "../assets/brand/About-Icon.png";
import ApplicationIcon from "../assets/brand/Application-Icon.png";
import CommunityIcon from "../assets/brand/Community-Icon.png";
import ResourcesIcon from "../assets/brand/Resources-Icon.png";

const Landing: React.FC = () => {
  return (
    <div className="text-theme-pan-navy max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <header className="text-center py-8">
        <h1 className="text-4xl  mb-6 underline underline-offset-8">
          Yield Merchants and Traders of Natural Crypto Resources
        </h1>
        <p className="text-xl mb-8 max-w-5xl mx-auto">
          The East India Onchain Company team curates a selection of yield opportunities in the DeFi sector, providing
          you with free insights to make informed decisions about your digital assets. 
        </p>
      </header>

      <section className="mb-6">
        <h2 className="text-3xl  mb-6 text-center">Discover Yield Opportunities</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <YieldCard
            Icon={Coins}
            title="Stablecoin Yield"
            description="Navigate through strategies designed for stability and consistency with your stablecoin holdings."
          />
          <YieldCard
            Icon={TrendingUp}
            title="Volatile Asset Yield"
            description="Explore yield prospects across liquidity pools, staking, and yield farms for volatile assets."
          />
          <YieldCard
            Icon={Bot}
            title="Advanced Strategies"
            description="Access sophisticated yield strategies for seasoned DeFi users, including options and beyond."
          />
        </div>
      </section>

      <section className=" p-8 mb-8">
        <h2 className="text-3xl  mb-8 text-center">Why Sail With Us?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Feature icon={ResourcesIcon} text="Curated selection of yield opportunities for all users" />
          <Feature icon={AboutIcon} text="Strategies categorized for various risk tolerances" />
          <Feature icon={ApplicationIcon} text="Comprehensive risk assessments and market insights" />
          <Feature icon={CommunityIcon} text="Crew members get immediate access to opportunities" />
        </div>
      </section>

      <section className="text-center border-t border-theme-pan-navy max-w-5xl pt-6 mx-auto">
        <h2 className="text-3xl mb-4 ">Ready to Explore?</h2>
        <div className="space-y-4 sm:space-y-0 sm:space-x-4">
          <Link
            to="/yield"
            className="inline-block px-6 py-2 text-lg border border-theme-pan-navy hover:bg-theme-pan-navy hover:text-theme-pan-champagne transition-colors duration-200"
          >
            Explore Yield Opportunities
          </Link>
          <Link
            to="/subscribe"
            className="inline-block px-6 py-2 text-lg border border-theme-pan-sky text-theme-pan-sky hover:bg-theme-pan-sky hover:text-theme-pan-champagne transition-colors duration-200"
          >
            Join the Crew
          </Link>
        </div>
      </section>

      <footer className="text-center text-sm opacity-75 py-4">
        <p>The East India Onchain Company is operated by Galleon Labs</p>
      </footer>
    </div>
  );
};

const YieldCard: React.FC<{ Icon: React.ElementType; title: string; description: string }> = ({
  Icon,
  title,
  description,
}) => (
  <div className="border border-theme-oldlace bg-theme-pan-navy/10 px-6 py-6 transition-transform duration-300 hover:scale-105">
    <Icon strokeWidth={1} className="w-12 h-12 mb-3 mx-auto text-theme-pan-navy" />
    <h3 className="text-2xl mb-2 text-center">{title}</h3>
    <p className="text-center">{description}</p>
  </div>
);

const Feature: React.FC<{ icon: string; text: string }> = ({ icon, text }) => (
  <div className="flex items-center space-x-3">
    <img src={icon} alt="Feature icon" className="w-8 h-8 flex-shrink-0 grayscale-[40%]" />
    <p className="text-lg md:pl-0 pl-2">{text}</p>
  </div>
);

export default Landing;

import React from "react";
import { Link } from "react-router-dom";
import { Coins, TrendingUp } from "lucide-react";
import logo from "../assets/logo.png";
import AboutIcon from "../assets/brand/About-Icon.png";
import ApplicationIcon from "../assets/brand/Application-Icon.png";
import CommunityIcon from "../assets/brand/Community-Icon.png";
import ResourcesIcon from "../assets/brand/Resources-Icon.png";

const Landing: React.FC = () => {
  return (
    <div className="text-theme-navy sm:max-w-5xl  mx-auto sm:px-6 lg:px-8 border-l border-r border-theme-navy/20 bg-[url('./Frame.png')] bg-no-repeat bg-cover bg-center px-4">
      <header className="text-center py-8 ">
        <div className="justify-center flex mb-8">
          <img src={logo} className="h-32 w-32" alt="logo" />
        </div>
        <h1 className="text-5xl mb-6 font-morion font-semibold bg-theme-champagne/40">DeFi Yield Merchants</h1>
        <p className="text-lg mb-8 max-w-4xl mx-auto bg-theme-champagne/40">
          Every week, the East India Onchain Company team curates yield opportunities in the DeFi sector,
          <br className="hidden show:block"></br> providing you with free insights to make informed decisions about your
          digital assets.
        </p>
      </header>

      <section className="mb-6 sm:px-12  mx-auto text-center">
        <h2 className="text-3xl  mb-8 text-center">Discover Yield Opportunities</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <YieldCard
            Icon={Coins}
            title="Stablecoin Yield"
            description="Navigate through strategies designed for stability and consistency with your stablecoin holdings."
          />
          <YieldCard
            Icon={TrendingUp}
            title="ETH Yield"
            description="Explore yield prospects across liquidity pools, staking, and strategy vaults for Ethereum."
          />
        </div>
      </section>

      <section className=" p-8 mb-8  max-w-5xl mx-auto">
        <h2 className="text-3xl  mb-8 text-center">Why Sail With Us?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Feature
            icon={ResourcesIcon}
            text="Curated selection of yield opportunities for both stablecoin and ETH portfolios"
          />
          <Feature
            icon={AboutIcon}
            text="Diverse strategies across all networks to source yield from all corners of DeFi"
          />
          <Feature
            icon={ApplicationIcon}
            text="Comprehensive risk assessments and insights to cater to different profiles"
          />
          <Feature
            icon={CommunityIcon}
            text="Frequently updated every week to always beat standard DeFi yield benchmarks"
          />
        </div>
      </section>

      <section className="text-center border-t border-theme-pan-navy/20 max-w-5xl pt-8 mx-auto">
        <h2 className="text-3xl mb-8 ">Ready to Explore?</h2>
        <div className="space-y-4 sm:space-y-0 sm:space-x-4">
          <Link
            to="/yield"
            className="inline-block px-6 py-2 text-lg rounded-md hover:opacity-70  text-theme-pan-champagne bg-theme-pan-navy hover:text-theme-pan-champagne transition-colors duration-200 w-full sm:w-auto shadow-md"
          >
            Explore Yield Opportunities
          </Link>
          <Link
            to="/subscribe"
            className="inline-block px-6 py-2 text-lg rounded-md hover:opacity-70  text-theme-pan-champagne bg-theme-sky hover:text-theme-pan-champagne transition-colors duration-200 w-full sm:w-auto shadow-md"
          >
            Join the Crew
          </Link>
        </div>
      </section>

      <footer className="text-center text-sm opacity-75 py-4">
        <p>The East India Onchain Company is operated by Galleon</p>
      </footer>
    </div>
  );
};

const YieldCard: React.FC<{ Icon: React.ElementType; title: string; description: string }> = ({
  Icon,
  title,
  description,
}) => (
  <div className="border rounded-md border-theme-navy bg-[url('./Frame.png')] bg-no-repeat bg-cover bg-center text-theme-pan-champagne bg-theme-navy px-6 py-6 transition-transform duration-300 hover:scale-105 shadow-md">
    <Icon strokeWidth={1} className="w-12 h-12 mb-3 mx-auto " />
    <h3 className="text-2xl mb-2 text-center">{title}</h3>
    <p className="text-center">{description}</p>
  </div>
);

const Feature: React.FC<{ icon: string; text: string }> = ({ icon, text }) => (
  <div className="flex items-center space-x-3 bg-theme-champagne/40">
    <img src={icon} alt="Feature icon" className="w-12 h-12 flex-shrink-0" />
    <p className="text-lg md:pl-2 pl-2">{text}</p>
  </div>
);

export default Landing;

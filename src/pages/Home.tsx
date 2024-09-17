// src/pages/Home.tsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { YieldOpportunity, OpportunityCategory } from "../types";
import {
  getYieldOpportunities,
  getYieldOpportunitiesSample,
  getYieldLastUpdated,
  checkUserSubscriptionStatus,
} from "../services/firebase";
import { Timestamp } from "firebase/firestore";

type SortKey = "estimatedApy" | "relativeRisk" | "tvl";

const Home: React.FC = () => {
  const [opportunities, setOpportunities] = useState<Record<OpportunityCategory, YieldOpportunity[]>>({
    stablecoin: [],
    volatileAsset: [],
    advancedStrategies: [],
  });
  const [totalCounts, setTotalCounts] = useState<Record<OpportunityCategory, number>>({
    stablecoin: 0,
    volatileAsset: 0,
    advancedStrategies: 0,
  });
  const [sortKey, setSortKey] = useState<SortKey>("estimatedApy");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user, updateUser } = useAuth();

  const checkSubscriptionStatus = async () => {
    if (user && user.address) {
      try {
        const isSubscribed = await checkUserSubscriptionStatus(user.address);
        if (isSubscribed !== user.isPaidUser) {
          updateUser({ ...user, isPaidUser: isSubscribed });
        }
      } catch (error) {
        console.error("Error checking subscription status:", error);
      }
    }
  };

  const fetchOpportunities = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await checkSubscriptionStatus(); // Check subscription status before fetching opportunities

      let allOpportunities: YieldOpportunity[] = [];
      let counts: Record<OpportunityCategory, number> = new Object() as Record<OpportunityCategory, number>;

      if (user?.isPaidUser) {
        allOpportunities = await getYieldOpportunities();
        counts = allOpportunities.reduce((acc, opp) => {
          acc[opp.category] = (acc[opp.category] || 0) + 1;
          return acc;
        }, {} as Record<OpportunityCategory, number>);
      } else if (user && !user.isPaidUser) {
        const { opportunities: sampleOpportunities, counts: sampleCounts } = await getYieldOpportunitiesSample();
        allOpportunities = sampleOpportunities;
        counts = sampleCounts;
      }

      if (user && allOpportunities) {
        const categorizedOpportunities = allOpportunities.reduce((acc, opp) => {
          if (!acc[opp.category]) {
            acc[opp.category] = [];
          }
          acc[opp.category].push(opp);
          return acc;
        }, {} as Record<OpportunityCategory, YieldOpportunity[]>);

        setOpportunities(categorizedOpportunities);
        setTotalCounts(counts);
      }
    } catch (err) {
      console.error("Error fetching opportunities:", err);
      setError("Failed to load yield opportunities. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLastUpdated = async () => {
    try {
      const timestamp = await getYieldLastUpdated();
      if (timestamp) {
        setLastUpdated(timestamp.toDate());
      }
    } catch (err) {
      console.error("Error fetching last updated timestamp:", err);
      // Don't set an error state here as it's not critical
    }
  };

  useEffect(() => {
    fetchOpportunities();
    fetchLastUpdated();
  }, [user]);

  const handleSort = (key: SortKey) => {
    setSortKey(key);
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const sortOpportunities = (opps: YieldOpportunity[]) => {
    return [...opps].sort((a, b) => {
      if (a.isBenchmark) return -1;
      if (b.isBenchmark) return 1;

      let aValue = a[sortKey];
      let bValue = b[sortKey];

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  };

  const formatTVL = (tvl: number): string => {
    const trillion = 1_000_000_000_000;
    const billion = 1_000_000_000;
    const million = 1_000_000;
    const thousand = 1_000;

    if (tvl >= trillion) {
      return `$${(tvl / trillion).toFixed(2)}T`;
    } else if (tvl >= billion) {
      return `$${(tvl / billion).toFixed(2)}B`;
    } else if (tvl >= million) {
      return `$${(tvl / million).toFixed(2)}M`;
    } else if (tvl >= thousand) {
      return `$${(tvl / thousand).toFixed(2)}K`;
    } else {
      return `$${tvl.toFixed(2)}`;
    }
  };

  const renderOpportunityTable = (category: OpportunityCategory, title: string) => {
    const isAdvanced = category === "advancedStrategies";
    const showAll = user?.isPaidUser;
    let displayOpportunities = sortOpportunities(opportunities[category] || []);
    const totalOpportunities = totalCounts[category] || 0;

    if (isAdvanced && !showAll) {
      displayOpportunities = [];
    }

    return (
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4 text-theme-pan-navy">{title}</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-theme-pan-navy text-theme-pan-navy">
            <thead>
              <tr className="bg-theme-pan-navy text-theme-pan-champagne">
                <th className="p-2 border border-theme-pan-navy">Name</th>
                <th
                  className="p-2 border border-theme-pan-navy cursor-pointer"
                  onClick={() => handleSort("estimatedApy")}
                >
                  APY {sortKey === "estimatedApy" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                </th>
                <th className="p-2 border border-theme-pan-navy">Network</th>
                <th className="p-2 border border-theme-pan-navy cursor-pointer" onClick={() => handleSort("tvl")}>
                  TVL {sortKey === "tvl" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                </th>
                <th
                  className="p-2 border border-theme-pan-navy cursor-pointer"
                  onClick={() => handleSort("relativeRisk")}
                >
                  Risk {sortKey === "relativeRisk" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                </th>
                <th className="p-2 border border-theme-pan-navy">Notes</th>
                <th className="p-2 border border-theme-pan-navy">Link</th>
              </tr>
            </thead>
            <tbody>
              {displayOpportunities.map((opp) => (
                <tr key={opp.id} className={`${opp.isBenchmark ? "bg-theme-pan-sky/10" : ""}`}>
                  <td className="p-2 border border-theme-pan-navy text-theme-pan-navy">
                    {opp.dateAdded && isNew(opp.dateAdded) && (
                      <span className="text-theme-pan-sky text-xs border border-theme-pan-sky px-1 py-0.5">
                        NEW
                      </span>
                    )}
                    {opp.dateAdded && isNew(opp.dateAdded) ? " " : ""}
                    {opp.name} {opp.isBenchmark && "(Benchmark)"}
                  </td>
                  <td className="p-2 border border-theme-pan-navy text-theme-pan-navy">{opp.estimatedApy}%</td>
                  <td className="p-2 border border-theme-pan-navy text-theme-pan-navy">{opp.network}</td>
                  <td className="p-2 border border-theme-pan-navy text-theme-pan-navy"> {formatTVL(opp.tvl)} </td>
                  <td className="p-2 border border-theme-pan-navy text-theme-pan-navy">{opp.relativeRisk}</td>
                  <td className="p-2 border border-theme-pan-navy text-theme-pan-navy">{opp.notes}</td>
                  <td className="p-2 border border-theme-pan-navy text-theme-pan-navy">
                    <a
                      href={opp.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-theme-pan-navy hover:underline"
                    >
                      Visit
                    </a>
                  </td>
                </tr>
              ))}
              {(!showAll || isAdvanced) && totalOpportunities > displayOpportunities.length && (
                <>
                  <tr className="bg-theme-pan-navy/10 text-theme-pan-navy">
                    <td colSpan={7} className="p-2 border border-theme-pan-navy text-center">
                      {totalOpportunities - displayOpportunities.length} more opportunities available with full acceess
                    </td>
                  </tr>
                  <tr className="bg-theme-pan-navy/10 text-theme-pan-navy">
                    <td className="p-2 border border-theme-pan-navy blur-sm">Hidden Opportunity</td>
                    <td className="p-2 border border-theme-pan-navy blur-sm">XX.X%</td>
                    <td className="p-2 border border-theme-pan-navy blur-sm">Network</td>
                    <td className="p-2 border border-theme-pan-navy blur-sm">$XXXM</td>
                    <td className="p-2 border border-theme-pan-navy blur-sm">Medium</td>
                    <td className="p-2 border border-theme-pan-navy blur-sm">Hidden notes...</td>
                    <td className="p-2 border border-theme-pan-navy blur-sm">Visit</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
        {!user && <div className="text-theme-pan-navy mt-2">Connect your wallet to see more opportunities</div>}
        {user && !user.isPaidUser && (
          <div className="text-theme-pan-navy mt-2">
            {isAdvanced
              ? `Unlock full access to unlock ${totalOpportunities} Advanced Strategies`
              : `Unlock full access to see ${totalOpportunities - displayOpportunities.length} more opportunities`}
          </div>
        )}
      </div>
    );
  };

const isNew = (dateAdded: Timestamp | undefined): boolean => {
  if (!dateAdded || typeof dateAdded.seconds !== "number") return false;

  const date = new Date(dateAdded.seconds * 1000); 
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 7;
};

  const formatLastUpdated = (date: Date | null) => {
    if (!date) return "Unknown";
    return date.toLocaleDateString("en-GB", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
  };

  if (isLoading) {
    return <div className="text-theme-pan-navy">Loading yield opportunities...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="">
      <h1 className="text-3xl font-bold mb-2 text-theme-pan-navy">Curated Yield Opportunities</h1>
      <p className="mb-4 text-theme-pan-navy text-md">
        LAST UPDATED: <span className="text-lg">{formatLastUpdated(lastUpdated ? lastUpdated : new Date())}</span>
      </p>
      {renderOpportunityTable("stablecoin", "Stablecoin Yield")}
      {renderOpportunityTable("volatileAsset", "Volatile Asset Yield")}
      {renderOpportunityTable("advancedStrategies", "Advanced Strategies")}
    </div>
  );
};

export default Home;

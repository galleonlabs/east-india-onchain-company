// src/pages/Home.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { YieldOpportunity, OpportunityCategory, OPPORTUNITY_CATEGORIES } from "../types";
import {
  getYieldOpportunities,
  getYieldOpportunitiesSample,
  getYieldLastUpdated,
  checkUserSubscriptionStatus,
} from "../services/firebase";
import { mockYieldOpportunities } from "../mockData";

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

  const checkSubscriptionStatus = useCallback(async () => {
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
  }, [user, updateUser]);

  const fetchOpportunities = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await checkSubscriptionStatus(); // Check subscription status before fetching opportunities

      let allOpportunities: YieldOpportunity[];
      let counts: Record<OpportunityCategory, number>;

      if (import.meta.env.DEV) {
        if (user?.isPaidUser) {
          allOpportunities = mockYieldOpportunities;
        } else {
          allOpportunities = OPPORTUNITY_CATEGORIES.map(
            (category) => mockYieldOpportunities.find((opp) => opp.category === category)!
          );
        }
        counts = mockYieldOpportunities.reduce((acc, opp) => {
          acc[opp.category] = (acc[opp.category] || 0) + 1;
          return acc;
        }, {} as Record<OpportunityCategory, number>);
      } else {
        if (user?.isPaidUser) {
          allOpportunities = await getYieldOpportunities();
          counts = allOpportunities.reduce((acc, opp) => {
            acc[opp.category] = (acc[opp.category] || 0) + 1;
            return acc;
          }, {} as Record<OpportunityCategory, number>);
        } else {
          const { opportunities: sampleOpportunities, counts: sampleCounts } = await getYieldOpportunitiesSample();
          allOpportunities = sampleOpportunities;
          counts = sampleCounts;
        }
      }

      const categorizedOpportunities = allOpportunities.reduce((acc, opp) => {
        if (!acc[opp.category]) {
          acc[opp.category] = [];
        }
        acc[opp.category].push(opp);
        return acc;
      }, {} as Record<OpportunityCategory, YieldOpportunity[]>);

      setOpportunities(categorizedOpportunities);
      setTotalCounts(counts);
    } catch (err) {
      console.error("Error fetching opportunities:", err);
      setError("Failed to load yield opportunities. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, [user, checkSubscriptionStatus]);

  const fetchLastUpdated = useCallback(async () => {
    try {
      const timestamp = await getYieldLastUpdated();
      if (timestamp) {
        setLastUpdated(timestamp.toDate());
      }
    } catch (err) {
      console.error("Error fetching last updated timestamp:", err);
      // Don't set an error state here as it's not critical
    }
  }, []);

  useEffect(() => {
    fetchOpportunities();
    fetchLastUpdated();
  }, [fetchOpportunities, fetchLastUpdated, user]);

  const handleSort = useCallback((key: SortKey) => {
    setSortKey(key);
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  }, []);

  const sortOpportunities = useCallback(
    (opps: YieldOpportunity[]) => {
      return [...opps].sort((a, b) => {
        if (a.isBenchmark) return -1;
        if (b.isBenchmark) return 1;

        let aValue = a[sortKey];
        let bValue = b[sortKey];

        if (sortKey === "estimatedApy" || sortKey === "tvl") {
          aValue = parseFloat(aValue.replace(/[^0-9.]/g, "")).toString();
          bValue = parseFloat(bValue.replace(/[^0-9.]/g, "")).toString();
        }

        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    },
    [sortKey, sortDirection]
  );

  const renderOpportunityTable = useCallback(
    (category: OpportunityCategory, title: string) => {
      const isAdvanced = category === "advancedStrategies";
      const showAll = user?.isPaidUser;
      let displayOpportunities = sortOpportunities(opportunities[category] || []);
      const totalOpportunities = totalCounts[category] || 0;

      if (isAdvanced && !showAll) {
        displayOpportunities = [];
      }

      return (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 terminal-prompt text-terminal">{title}</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-terminal text-terminal">
              <thead>
                <tr className="bg-terminal/30">
                  <th className="p-2 border border-terminal">Name</th>
                  <th className="p-2 border border-terminal cursor-pointer" onClick={() => handleSort("estimatedApy")}>
                    APY {sortKey === "estimatedApy" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                  </th>
                  <th className="p-2 border border-terminal">Network</th>
                  <th className="p-2 border border-terminal cursor-pointer" onClick={() => handleSort("tvl")}>
                    TVL {sortKey === "tvl" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                  </th>
                  <th className="p-2 border border-terminal cursor-pointer" onClick={() => handleSort("relativeRisk")}>
                    Risk {sortKey === "relativeRisk" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                  </th>
                  <th className="p-2 border border-terminal">Notes</th>
                  <th className="p-2 border border-terminal">Link</th>
                </tr>
              </thead>
              <tbody>
                {displayOpportunities.map((opp) => (
                  <tr key={opp.id} className={`${opp.isBenchmark ? "bg-terminal/10" : ""}`}>
                    <td className="p-2 border border-terminal text-terminal">
                      {isNew(opp.dateAdded) ? "NEW - " : ""}
                      {opp.name} {opp.isBenchmark && "(Benchmark)"}
                    </td>
                    <td className="p-2 border border-terminal text-terminal">{opp.estimatedApy}</td>
                    <td className="p-2 border border-terminal text-terminal">{opp.network}</td>
                    <td className="p-2 border border-terminal text-terminal">{opp.tvl}</td>
                    <td className="p-2 border border-terminal text-terminal">{opp.relativeRisk}</td>
                    <td className="p-2 border border-terminal text-terminal">{opp.notes}</td>
                    <td className="p-2 border border-terminal text-terminal">
                      <a
                        href={opp.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-terminal hover:underline"
                      >
                        Visit
                      </a>
                    </td>
                  </tr>
                ))}
                {(!showAll || isAdvanced) && totalOpportunities > displayOpportunities.length && (
                  <>
                    <tr className="bg-terminal/10 text-terminal/70">
                      <td colSpan={7} className="p-2 border border-terminal text-center">
                        {totalOpportunities - displayOpportunities.length} more opportunities available with
                        subscription
                      </td>
                    </tr>
                    <tr className="bg-terminal/10 text-terminal">
                      <td className="p-2 border border-terminal blur-sm">Hidden Opportunity</td>
                      <td className="p-2 border border-terminal blur-sm">XX.X%</td>
                      <td className="p-2 border border-terminal blur-sm">Network</td>
                      <td className="p-2 border border-terminal blur-sm">$XXXM</td>
                      <td className="p-2 border border-terminal blur-sm">Medium</td>
                      <td className="p-2 border border-terminal blur-sm">Hidden notes...</td>
                      <td className="p-2 border border-terminal blur-sm">Visit</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
          {!user && <div className="text-terminal/70 mt-2">Connect your wallet to see more opportunities</div>}
          {user && !user.isPaidUser && (
            <div className="text-terminal/70 mt-2">
              {isAdvanced
                ? `Unlock full access to unlock ${totalOpportunities} Advanced Strategies`
                : `Unlock full access to see ${totalOpportunities - displayOpportunities.length} more opportunities`}
            </div>
          )}
        </div>
      );
    },
    [opportunities, totalCounts, user, sortOpportunities, handleSort, sortKey, sortDirection]
  );

  const isNew = useCallback((dateAdded: string) => {
    const addedDate = new Date(dateAdded);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - addedDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  }, []);

  const formatLastUpdated = useCallback((date: Date | null) => {
    if (!date) return "Unknown";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
  }, []);

  if (isLoading) {
    return <div className="text-terminal">Loading yield opportunities...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="terminal-content">
      <h1 className="text-2xl font-bold mb-2 terminal-prompt text-terminal">YIELD_OPPORTUNITIES</h1>
      <p className="mb-8 text-terminal ml-2 text-md">### LAST_UPDATED: {formatLastUpdated(lastUpdated)}</p>
      {renderOpportunityTable("stablecoin", "STABLECOIN_YIELD")}
      {renderOpportunityTable("volatileAsset", "VOLATILE_ASSET_YIELD")}
      {renderOpportunityTable("advancedStrategies", "ADVANCED_STRATEGIES")}
    </div>
  );
};

export default Home;

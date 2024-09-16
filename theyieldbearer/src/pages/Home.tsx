// src/pages/Home.tsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { YieldOpportunity, OpportunityCategory, OPPORTUNITY_CATEGORIES } from "../types";
import { getYieldOpportunities, getYieldOpportunitiesSample, getYieldLastUpdated } from "../services/firebase";
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

  const { user } = useAuth();

  useEffect(() => {
    fetchOpportunities();
    fetchLastUpdated();
  }, [user?.isPaidUser]);

  const fetchLastUpdated = async () => {
    const timestamp = await getYieldLastUpdated();
    if (timestamp) {
      setLastUpdated(timestamp.toDate());
    }
  };

  const fetchOpportunities = async () => {
    let allOpportunities: YieldOpportunity[];
    let counts: Record<OpportunityCategory, number>;

    if (import.meta.env.DEV) {
      // Use mock data in development
      if (user?.isPaidUser) {
        allOpportunities = mockYieldOpportunities;
      } else {
        // Simulate limited data for non-subscribed users
        allOpportunities = OPPORTUNITY_CATEGORIES.map(
          (category) => mockYieldOpportunities.find((opp) => opp.category === category)!
        );
      }
      counts = mockYieldOpportunities.reduce((acc, opp) => {
        acc[opp.category] = (acc[opp.category] || 0) + 1;
        return acc;
      }, {} as Record<OpportunityCategory, number>);
    } else {
      // Use real data in production
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
  };

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  };

  const sortOpportunities = (opps: YieldOpportunity[]) => {
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
  };

  const isNew = (dateAdded: string) => {
    const addedDate = new Date(dateAdded);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - addedDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  const formatLastUpdated = (date: Date | null) => {
    if (!date) return "Unknown";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
  };

  const renderOpportunityTable = (category: OpportunityCategory, title: string) => {
    const isAdvanced = category === "advancedStrategies";
    const showAll = user?.isPaidUser;
    let displayOpportunities = sortOpportunities(opportunities[category] || []);
    const totalOpportunities = totalCounts[category] || 0;

    // If it's advanced strategies and user is not paid, don't show any real opportunities
    if (isAdvanced && !showAll) {
      displayOpportunities = [];
    }

    const renderSortArrow = (key: SortKey) => {
      if (sortKey === key) {
        return sortDirection === "asc" ? " ▲" : " ▼";
      }
      return "";
    };

    return (
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4 terminal-prompt text-terminal">{title}</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-terminal text-terminal">
            <thead>
              <tr className="bg-terminal/30">
                <th className="p-2 border border-terminal">Name</th>
                <th className="p-2 border border-terminal cursor-pointer" onClick={() => handleSort("estimatedApy")}>
                  APY {renderSortArrow("estimatedApy")}
                </th>
                <th className="p-2 border border-terminal">Network</th>
                <th className="p-2 border border-terminal cursor-pointer" onClick={() => handleSort("tvl")}>
                  TVL {renderSortArrow("tvl")}
                </th>
                <th className="p-2 border border-terminal cursor-pointer" onClick={() => handleSort("relativeRisk")}>
                  Risk {renderSortArrow("relativeRisk")}
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
                      {totalOpportunities - displayOpportunities.length} more opportunities available with subscription
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
  };

  return (
    <div className="terminal-content">
      <h1 className="text-2xl font-bold mb-2 terminal-prompt text-terminal">YIELD_OPPORTUNITIES</h1>
      <p className="mb-8 text-terminal ml-2 text-md">### LAST_UPDATED: {formatLastUpdated(lastUpdated ?? new Date())}</p>
      {renderOpportunityTable("stablecoin", "STABLECOIN_YIELD")}
      {renderOpportunityTable("volatileAsset", "VOLATILE_ASSET_YIELD")}
      {renderOpportunityTable("advancedStrategies", "ADVANCED_STRATEGIES")}
    </div>
  );
};

export default Home;

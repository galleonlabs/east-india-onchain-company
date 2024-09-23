// src/pages/Home.tsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { YieldOpportunity, OpportunityCategory, OPPORTUNITY_CATEGORIES } from "../types";
import { getYieldOpportunities, getYieldLastUpdated } from "../services/firebase";
import { Timestamp } from "firebase/firestore";
import { Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Link } from "react-router-dom";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, BarElement, Title, Tooltip, Legend);

type SortKey = "estimatedApy" | "relativeRisk" | "tvl";

const Home: React.FC = () => {
  const [opportunities, setOpportunities] = useState<Record<OpportunityCategory, YieldOpportunity[]>>({
    stablecoin: [],
    volatileAsset: [],
  });
  const [totalCounts, setTotalCounts] = useState<Record<OpportunityCategory, number>>({
    stablecoin: 0,
    volatileAsset: 0,
  });
  const [sortKey, setSortKey] = useState<SortKey>("estimatedApy");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentOpportunitiesCount, setRecentOpportunitiesCount] = useState<number>(0);
  const { user, updateUserStatus } = useAuth();

  const sortOpportunities = (opportunities: YieldOpportunity[]): YieldOpportunity[] => {
    return [...opportunities].sort((a, b) => {
      // First, prioritize benchmarks
      if (a.isBenchmark && !b.isBenchmark) return -1;
      if (!a.isBenchmark && b.isBenchmark) return 1;

      // If both are benchmarks or both are not, sort by the selected key
      let aValue = a[sortKey];
      let bValue = b[sortKey];

      if (sortKey === "relativeRisk") {
        const riskLevels = { Low: 1, Medium: 2, High: 3 };
        aValue = riskLevels[aValue as "Low" | "Medium" | "High"];
        bValue = riskLevels[bValue as "Low" | "Medium" | "High"];
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  };

  const fetchOpportunities = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (user) {
        await updateUserStatus();
      }
      const { opportunities: allOpportunities, recentOpportunitiesCount } = await getYieldOpportunities(user?.address);

      const categorizedOpportunities = allOpportunities.reduce((acc, opp) => {
        if (!acc[opp.category]) {
          acc[opp.category] = [];
        }
        acc[opp.category].push(opp);
        return acc;
      }, {} as Record<OpportunityCategory, YieldOpportunity[]>);

      setOpportunities(categorizedOpportunities);
      setTotalCounts({
        stablecoin: categorizedOpportunities.stablecoin?.length || 0,
        volatileAsset: categorizedOpportunities.volatileAsset?.length || 0,
      });
      setRecentOpportunitiesCount(recentOpportunitiesCount);
    } catch (err) {
      console.error("Error fetching opportunities:", err);
      setError("Failed to load yield opportunities. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
    fetchLastUpdated();
  }, [user]);

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

  const calculateRiskAdjustedAPY = (opportunity: YieldOpportunity): number => {
    let riskFactor = 1;

    // Network risk factor
    if (opportunity.network.toLowerCase() === "ethereum") {
      riskFactor *= 1;
    } else if (["optimism", "arbitrum", "base"].includes(opportunity.network.toLowerCase())) {
      riskFactor *= 0.95;
    } else {
      riskFactor *= 0.9;
    }

    // Defined risk weighting
    if (opportunity.relativeRisk === "Low") {
      riskFactor *= 1;
    } else if (opportunity.relativeRisk === "Medium") {
      riskFactor *= 0.9;
    } else {
      riskFactor *= 0.8;
    }

    // TVL weighting
    if (opportunity.tvl >= 100_000_000) {
      // $100M+
      riskFactor *= 1;
    } else if (opportunity.tvl >= 10_000_000) {
      // $10M+
      riskFactor *= 0.95;
    } else if (opportunity.tvl >= 1_000_000) {
      // $1M+
      riskFactor *= 0.9;
    } else {
      riskFactor *= 0.85;
    }

    // Benchmark factor
    if (opportunity.isBenchmark) {
      riskFactor *= 1.1;
    }

    // Calculate risk-adjusted APY
    const riskAdjustedAPY = opportunity.estimatedApy * riskFactor;

    // Round to two decimal places
    if (riskAdjustedAPY > opportunity.estimatedApy) {
      return opportunity.estimatedApy;
    } else {
      return Math.round(riskAdjustedAPY * 100) / 100;
    }
  };

  const NetworkDistributionChart: React.FC<{ opportunities: YieldOpportunity[] }> = ({ opportunities }) => {
    const networkCounts = opportunities.reduce((acc, opp) => {
      acc[opp.network] = (acc[opp.network] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return (
      <div className=" p-4 bg-theme-navy rounded-md shadow-md">
        <h2 className="text-lg mb-4 text-theme-pan-champagne font-bold">Network Distribution</h2>
        <div className="h-64 translate-x-8 text-theme-pan-champagne">
          <Pie
            data={{
              labels: Object.keys(networkCounts),
              datasets: [
                {
                  data: Object.values(networkCounts),
                  backgroundColor: ["#DC7F5A", "#025BEE", "#FDE6C4", "#4A8594", "#006580"],
                },
              ],
            }}
            options={{
              plugins: {
                legend: { position: "right" as const, labels: { color: "#F4EEE8" } },
                title: { display: false, text: "Network Distribution" },
              },
            }}
          />
        </div>
      </div>
    );
  };

  const RiskDistributionChart: React.FC<{ opportunities: YieldOpportunity[] }> = ({ opportunities }) => {
    const riskCounts = opportunities.reduce((acc, opp) => {
      acc[opp.relativeRisk] = (acc[opp.relativeRisk] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return (
      <div className=" p-4  bg-theme-navy rounded-md shadow-md">
        <h2 className="text-lg mb-4 text-theme-pan-champagne font-bold">Risk Distribution</h2>
        <div className="h-64 translate-y-6">
          <Bar
            data={{
              labels: ["Low", "Medium", "High"],
              datasets: [
                {
                  data: [riskCounts["Low"], riskCounts["Medium"], riskCounts["High"]],
                  backgroundColor: ["#FDE6C4", "#025BEE", "#DC7F5A"],
                },
              ],
            }}
            options={{
              plugins: {
                legend: { display: false, labels: { color: "#F4EEE8" } },
                title: { display: false, text: "Risk Distribution" },
              },
              scales: { y: { beginAtZero: true, ticks: { color: "#F4EEE8" } }, x: { ticks: { color: "#F4EEE8" } } },
            }}
          />
        </div>
      </div>
    );
  };

  const YieldDistributionChart: React.FC<{ opportunities: YieldOpportunity[] }> = ({ opportunities }) => {
    const type = opportunities[0]?.category;
    const title = type === OPPORTUNITY_CATEGORIES[0] ? "Stablecoin" : "ETH";

    let yieldCounts = {};

    if (type === OPPORTUNITY_CATEGORIES[0]) {
      const yieldRanges = ["0-5%", "5-10%", "10-15%", "15-20%", "20%+"];
      yieldCounts = opportunities.reduce((acc, opp) => {
        const yield_ = opp.estimatedApy;
        if (yield_ < 5) acc["0-5%"]++;
        else if (yield_ < 10) acc["5-10%"]++;
        else if (yield_ < 15) acc["10-15%"]++;
        else if (yield_ < 20) acc["15-20%"]++;
        else acc["20%+"]++;
        return acc;
      }, Object.fromEntries(yieldRanges.map((range) => [range, 0])));
    } else {
      const yieldRanges = ["0-2.5%", "2.5-5%", "5-7.5%", "7.5-10%", "10%+"];
      yieldCounts = opportunities.reduce((acc, opp) => {
        const yield_ = opp.estimatedApy;
        if (yield_ < 2.5) acc["0-2.5%"]++;
        else if (yield_ < 5) acc["2.5-5%"]++;
        else if (yield_ < 7.5) acc["5-7.5%"]++;
        else if (yield_ < 10) acc["7.5-10%"]++;
        else acc["10%+"]++;
        return acc;
      }, Object.fromEntries(yieldRanges.map((range) => [range, 0])));
    }

    return (
      <div className=" p-4  bg-theme-navy rounded-md shadow-md">
        <h2 className="text-lg mb-4 text-theme-pan-champagne font-bold"> {title} Yield Distribution</h2>
        <div className="h-64 translate-y-6">
          <Bar
            data={{
              labels: Object.keys(yieldCounts),
              datasets: [
                {
                  data: Object.values(yieldCounts),
                  backgroundColor: "#025BEE",
                },
              ],
            }}
            options={{
              plugins: {
                legend: { display: false, labels: { color: "#F4EEE8" } },
                title: { display: false, text: "Yield Distribution" },
              },
              scales: { y: { beginAtZero: true, ticks: { color: "#F4EEE8" } }, x: { ticks: { color: "#F4EEE8" } } },
            }}
          />
        </div>
      </div>
    );
  };

  const CategoryDistributionChart: React.FC<{ opportunities: YieldOpportunity[] }> = ({ opportunities }) => {
    const categoryCounts = opportunities.reduce((acc, opp) => {
      acc[opp.category] = (acc[opp.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return (
      <div className=" p-4 bg-theme-navy rounded-md shadow-md">
        <h2 className="text-lg mb-4 text-theme-pan-champagne font-bold">Category Distribution</h2>
        <div className="h-64 translate-x-8">
          <Pie
            data={{
              labels: Object.keys(categoryCounts).map((x) => {
                if (x === "stablecoin") return "Stablecoin";
                if (x === "volatileAsset") return "ETH";
              }),
              datasets: [
                {
                  data: Object.values(categoryCounts),
                  backgroundColor: ["#DC7F5A", "#025BEE", "#FDE6C4"],
                },
              ],
            }}
            options={{
              plugins: {
                legend: { position: "right" as const, labels: { color: "#F4EEE8" } },
                title: { display: false, text: "Category Distribution" },
              },
            }}
          />
        </div>
      </div>
    );
  };

  const TVLDistributionChart: React.FC<{ opportunities: YieldOpportunity[] }> = ({ opportunities }) => {
    const tvlRanges = ["0-1M", "1M-10M", "10M-100M", "100M-1B", "1B+"];

    const tvlCounts = opportunities.reduce((acc, opp) => {
      const tvl = opp.tvl;
      if (tvl < 1_000_000) acc["0-1M"]++;
      else if (tvl < 10_000_000) acc["1M-10M"]++;
      else if (tvl < 100_000_000) acc["10M-100M"]++;
      else if (tvl < 1_000_000_000) acc["100M-1B"]++;
      else acc["1B+"]++;
      return acc;
    }, Object.fromEntries(tvlRanges.map((range) => [range, 0])));

    return (
      <div className=" p-4 bg-theme-navy rounded-md shadow-md">
        <h2 className="text-lg mb-4 text-theme-pan-champagne font-bold">TVL Distribution</h2>
        <div className="h-64 translate-y-6">
          <Bar
            data={{
              labels: Object.keys(tvlCounts),
              datasets: [
                {
                  data: Object.values(tvlCounts),
                  backgroundColor: "#025BEE",
                },
              ],
            }}
            options={{
              plugins: {
                legend: { display: false, labels: { color: "#F4EEE8" } },
                title: { display: false, text: "TVL Distribution" },
              },
              scales: { y: { beginAtZero: true, ticks: { color: "#F4EEE8" } }, x: { ticks: { color: "#F4EEE8" } } },
            }}
          />
        </div>
      </div>
    );
  };

  const renderOpportunityTable = (category: OpportunityCategory, title: string) => {
    const categoryOpportunities = opportunities[category] || [];
    const totalOpportunities = totalCounts[category] || 0;
    const sortedOpportunities = sortOpportunities(categoryOpportunities);

    return (
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4 text-theme-navy">{title}</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border-theme-navy text-theme-navy shadow-md">
            <thead>
              <tr className="bg-theme-navy text-theme-pan-champagne">
                <th className="p-2 border border-theme-navy ">Name</th>
                <th className="p-2 border border-theme-navy cursor-pointer" onClick={() => handleSort("estimatedApy")}>
                  APY & Risk-Adjusted {sortKey === "estimatedApy" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                </th>
                <th className="p-2 border border-theme-navy">Network</th>
                <th className="p-2 border border-theme-navy cursor-pointer" onClick={() => handleSort("tvl")}>
                  TVL {sortKey === "tvl" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                </th>
                <th className="p-2 border border-theme-navy cursor-pointer" onClick={() => handleSort("relativeRisk")}>
                  Risk {sortKey === "relativeRisk" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                </th>
                <th className="p-2 border border-theme-navy">Notes</th>
                <th className="p-2 border border-theme-navy">Link</th>
              </tr>
            </thead>
            <tbody className="bg-theme-pan-champagne">
              {sortedOpportunities.map((opp, index) => (
                <tr
                  key={opp.id}
                  className={`${
                    opp.isBenchmark ? "" : ""
                  } hover:bg-theme-pan-navy/5 transition-colors duration-200 animate-fadeIn `}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <td className="p-2 border border-theme-navy text-theme-navy">
                    {opp.dateAdded && isNew(opp.dateAdded) && (
                      <span className="text-theme-sky rounded-md text-xs border border-theme-sky px-1 py-0.5 mr-1.5">
                        NEW
                      </span>
                    )}
                    {opp.name}{" "}
                    {opp.isBenchmark && (
                      <span className="text-theme-copper rounded-md  px-1 py-0.5 ml-1 text-xs border border-theme-copper">
                        Benchmark
                      </span>
                    )}
                  </td>
                  <td className="p-2 border border-theme-navy text-theme-navy">
                    <span className="font-semibold">{opp.estimatedApy.toFixed(2)}%</span> /{" "}
                    {calculateRiskAdjustedAPY(opp).toFixed(2)}%
                  </td>
                  <td className="p-2 border border-theme-navy text-theme-navy">{opp.network}</td>
                  <td className="p-2 border border-theme-navy text-theme-navy">{formatTVL(opp.tvl)}</td>
                  <td className="p-2 border border-theme-navy text-theme-navy">{opp.relativeRisk}</td>
                  <td className="p-2 border border-theme-navy text-theme-navy">{opp.notes}</td>
                  <td className="p-2 border border-theme-navy text-theme-navy">
                    <a
                      href={opp.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-theme-navy hover:underline"
                    >
                      Visit
                    </a>
                  </td>
                </tr>
              ))}
              {!user?.isPaidUser && totalOpportunities > categoryOpportunities.length && (
                <tr className="bg-theme-navy text-theme-navy">
                  <td colSpan={7} className="p-2 border border-theme-navy text-center">
                    {recentOpportunitiesCount} more opportunities available for crew members.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const isNew = (dateAdded: Timestamp | undefined): boolean => {
    if (!dateAdded || typeof dateAdded.seconds !== "number") return false;

    const date = new Date(dateAdded.seconds * 1000);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3;
  };

  const formatLastUpdated = (date: Date | null) => {
    if (!date) return "Unknown";
    return date.toLocaleDateString("en-GB", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
  };

  const handleDownloadPDF = () => {
    const link = document.createElement("a");
    link.href = "/yield_opportunities.pdf";
    link.download = "yield_opportunities.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return <div className="text-theme-navy">Loading yield opportunities...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  const allOpportunities = Object.values(opportunities).flat();

  const chartContainer = (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12 border-t border-t-theme-navy/20 pt-12">
      <NetworkDistributionChart opportunities={allOpportunities} />
      <TVLDistributionChart opportunities={allOpportunities} />
      <CategoryDistributionChart opportunities={allOpportunities} />
      <RiskDistributionChart opportunities={allOpportunities} />
      <YieldDistributionChart opportunities={opportunities.stablecoin} />
      <YieldDistributionChart opportunities={opportunities.volatileAsset} />
    </div>
  );

  return (
    <div className="">
      <h1 className="text-3xl  mb-2 text-theme-navy font-morion font-semibold">Curated Yield Opportunities</h1>

      <div className="flex justify-between items-center ">
        <p className="mb-4 text-theme-navy text-md">
          Last Updated: <span className="text-lg">{formatLastUpdated(lastUpdated ? lastUpdated : new Date())}</span>
          {user?.isPaidUser ? (
            <span className=""></span>
          ) : (
            <span className="animate-pulse text-theme-copper  "> - 48 hours delayed for visitors</span>
          )}
        </p>
        <p className="mb-4 text-theme-navy text-md"></p>
        <button
          onClick={handleDownloadPDF}
          disabled={!user?.isPaidUser}
          className={`px-4 py-2 text-sm rounded-md sm:translate-y-6 shadow-md ${
            user?.isPaidUser
              ? " text-theme-pan-champagne bg-theme-sky hover:opacity-70"
              : "text-theme-pan-champagne bg-theme-sky opacity-50"
          } transition-colors duration-200`}
        >
          Download PDF
        </button>
      </div>

      {renderOpportunityTable("stablecoin", "Stablecoin Yield")}
      {renderOpportunityTable("volatileAsset", "ETH Yield")}

      {!user ||
        (user && !user?.isPaidUser && (
          <div className=" mx-auto text-center text-theme-navy">
            <p className="mb-2">{recentOpportunitiesCount} more opportunities await</p>
            <Link
              to="/subscribe"
              className="inline-block px-6 py-2 text-lg border rounded-md text-theme-pan-champagne bg-theme-sky hover:opacity-70 transition-colors duration-200 shadow-md"
            >
              Join the crew
            </Link>
          </div>
        ))}

      {chartContainer}
    </div>
  );
};

export default Home;

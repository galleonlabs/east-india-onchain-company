import React, { useState, useEffect } from "react";
import { YieldOpportunity, OpportunityCategory } from "../types";
import {
  addYieldOpportunity,
  updateYieldOpportunity,
  deleteYieldOpportunity,
  getYieldOpportunities,
} from "../services/firebase";
import { Timestamp } from "firebase/firestore";

const RISK_LEVELS = ["Low", "Medium", "High"] as const;
const CATEGORIES: OpportunityCategory[] = ["stablecoin", "volatileAsset", "advancedStrategies"];

interface FormData extends Omit<YieldOpportunity, "id" | "dateAdded"> {
  dateAdded: string;
}

const Admin: React.FC = () => {
  const [opportunities, setOpportunities] = useState<YieldOpportunity[]>([]);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    estimatedApy: 0,
    network: "",
    tvl: 0,
    relativeRisk: "Low",
    notes: "",
    category: "stablecoin",
    link: "",
    isBenchmark: false,
    dateAdded: new Date().toISOString().split("T")[0],
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async () => {
    try {
      const opps = await getYieldOpportunities();
      setOpportunities(opps);
    } catch (err) {
      setError("Failed to fetch opportunities. Please try again.");
      console.error("Error fetching opportunities:", err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let parsedValue: string | number | boolean = value;

    if (type === "checkbox") {
      parsedValue = (e.target as HTMLInputElement).checked;
    } else if (name === "estimatedApy" || name === "tvl") {
      parsedValue = parseFloat(value) || 0;
    }

    setFormData({ ...formData, [name]: parsedValue });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const oppData: Omit<YieldOpportunity, "id"> = {
        ...formData,
        dateAdded: Timestamp.fromDate(new Date(formData.dateAdded)),
      };

      if (isEditing && editingId) {
        await updateYieldOpportunity(editingId, oppData);
      } else {
        await addYieldOpportunity(oppData);
      }
      resetForm();
      fetchOpportunities();
    } catch (err) {
      setError(`Failed to ${isEditing ? "update" : "add"} opportunity. Please try again.`);
      console.error(`Error ${isEditing ? "updating" : "adding"} opportunity:`, err);
    }
  };

  const handleEdit = (opp: YieldOpportunity) => {
    setFormData({
      ...opp,
      dateAdded: new Date(opp.dateAdded.seconds * 1000).toISOString().split("T")[0],
    });
    setIsEditing(true);
    setEditingId(opp.id);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this opportunity?")) {
      try {
        await deleteYieldOpportunity(id);
        fetchOpportunities();
      } catch (err) {
        setError("Failed to delete opportunity. Please try again.");
        console.error("Error deleting opportunity:", err);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      estimatedApy: 0,
      network: "",
      tvl: 0,
      relativeRisk: "Low",
      notes: "",
      category: "stablecoin",
      link: "",
      isBenchmark: false,
      dateAdded: new Date().toISOString().split("T")[0],
    });
    setIsEditing(false);
    setEditingId(null);
  };

  const formatTVL = (tvl: number): string => {
    if (tvl >= 1e12) return `$${(tvl / 1e12).toFixed(2)}T`;
    if (tvl >= 1e9) return `$${(tvl / 1e9).toFixed(2)}B`;
    if (tvl >= 1e6) return `$${(tvl / 1e6).toFixed(2)}M`;
    if (tvl >= 1e3) return `$${(tvl / 1e3).toFixed(2)}K`;
    return `$${tvl.toFixed(2)}`;
  };

  return (
    <div className="container mx-auto px-4 py-8 text-theme-pan-navy">
      <h1 className="text-2xl font-bold mb-4">Manage Yield Opportunities</h1>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="mb-8 space-y-4">
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="Name"
          className="w-full p-2 bg-theme-pan-champagne text-theme-pan-navy rounded border border-theme-pan-navy"
          required
        />
        <input
          type="number"
          name="estimatedApy"
          value={formData.estimatedApy}
          onChange={handleInputChange}
          placeholder="Estimated APY"
          className="w-full p-2 bg-theme-pan-champagne text-theme-pan-navy rounded border border-theme-pan-navy"
          step="0.01"
          required
        />
        <input
          type="text"
          name="network"
          value={formData.network}
          onChange={handleInputChange}
          placeholder="Network"
          className="w-full p-2 bg-theme-pan-champagne text-theme-pan-navy rounded border border-theme-pan-navy"
          required
        />
        <input
          type="number"
          name="tvl"
          value={formData.tvl}
          onChange={handleInputChange}
          placeholder="TVL"
          className="w-full p-2 bg-theme-pan-champagne text-theme-pan-navy rounded border border-theme-pan-navy"
          required
        />
        <select
          name="relativeRisk"
          value={formData.relativeRisk}
          onChange={handleInputChange}
          className="w-full p-2 bg-theme-pan-champagne text-theme-pan-navy rounded border border-theme-pan-navy"
          required
        >
          {RISK_LEVELS.map((risk) => (
            <option key={risk} value={risk}>
              {risk}
            </option>
          ))}
        </select>
        <select
          name="category"
          value={formData.category}
          onChange={handleInputChange}
          className="w-full p-2 bg-theme-pan-champagne text-theme-pan-navy rounded border border-theme-pan-navy"
          required
        >
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleInputChange}
          placeholder="Notes"
          className="w-full p-2 bg-theme-pan-champagne text-theme-pan-navy rounded border border-theme-pan-navy"
        />
        <input
          type="url"
          name="link"
          value={formData.link}
          onChange={handleInputChange}
          placeholder="Link"
          className="w-full p-2 bg-theme-pan-champagne text-theme-pan-navy rounded border border-theme-pan-navy"
          required
        />
        <div>
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              name="isBenchmark"
              checked={formData.isBenchmark}
              onChange={handleInputChange}
              className="form-checkbox h-5 w-5 text-theme-pan-navy"
            />
            <span className="ml-2 text-theme-pan-navy">Benchmark</span>
          </label>
        </div>
        <input
          type="date"
          name="dateAdded"
          value={formData.dateAdded}
          onChange={handleInputChange}
          className="w-full p-2 bg-theme-pan-champagne text-theme-pan-navy rounded border border-theme-pan-navy"
          required
        />
        <button type="submit" className="bg-theme-pan-navy text-theme-pan-champagne font-bold py-2 px-4 rounded">
          {isEditing ? "Update" : "Add"} Opportunity
        </button>
        {isEditing && (
          <button type="button" onClick={resetForm} className="ml-2 bg-gray-500 text-white font-bold py-2 px-4 rounded">
            Cancel
          </button>
        )}
      </form>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-theme-pan-champagne shadow-md rounded-lg overflow-hidden">
          <thead className="bg-theme-pan-navy text-theme-pan-champagne">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">APY</th>
              <th className="px-4 py-2">Network</th>
              <th className="px-4 py-2">TVL</th>
              <th className="px-4 py-2">Risk</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Benchmark</th>
              <th className="px-4 py-2">Date Added</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {opportunities.map((opp) => (
              <tr key={opp.id} className="border-b border-theme-pan-navy">
                <td className="px-4 py-2">{opp.name}</td>
                <td className="px-4 py-2">{opp.estimatedApy.toFixed(2)}%</td>
                <td className="px-4 py-2">{opp.network}</td>
                <td className="px-4 py-2">{formatTVL(opp.tvl)}</td>
                <td className="px-4 py-2">{opp.relativeRisk}</td>
                <td className="px-4 py-2">{opp.category}</td>
                <td className="px-4 py-2">{opp.isBenchmark ? "Yes" : "No"}</td>
                <td className="px-4 py-2">{new Date(opp.dateAdded.seconds * 1000).toLocaleDateString()}</td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => handleEdit(opp)}
                    className="bg-theme-pan-sky hover:opacity:70 text-white font-bold py-0.5 px-2 my-0.5 rounded mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(opp.id)}
                    className="bg-theme-pan-navy hover:opacity-70 text-white font-bold py-1 px-2 rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Admin;

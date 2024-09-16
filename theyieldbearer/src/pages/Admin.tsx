// src/pages/Admin.tsx
import React, { useState, useEffect } from "react";
import { YieldOpportunity } from "../types";
import {
  addYieldOpportunity,
  updateYieldOpportunity,
  deleteYieldOpportunity,
  getYieldOpportunities,
} from "../services/firebase";

const Admin: React.FC = () => {
  const [opportunities, setOpportunities] = useState<YieldOpportunity[]>([]);
  const [currentOpp, setCurrentOpp] = useState<Partial<YieldOpportunity>>({});
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async () => {
    const opps = await getYieldOpportunities();
    setOpportunities(opps);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value;
    setCurrentOpp({ ...currentOpp, [e.target.name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const oppData = {
      ...currentOpp,
      dateAdded: currentOpp.dateAdded || new Date().toISOString(),
    };
    if (isEditing && currentOpp.id) {
      await updateYieldOpportunity(currentOpp.id, oppData as YieldOpportunity);
    } else {
      await addYieldOpportunity(oppData as Omit<YieldOpportunity, "id">);
    }
    setCurrentOpp({});
    setIsEditing(false);
    fetchOpportunities();
  };

  const handleEdit = (opp: YieldOpportunity) => {
    setCurrentOpp(opp);
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    await deleteYieldOpportunity(id);
    fetchOpportunities();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4 terminal-prompt">Manage Yield Opportunities</h1>

      <form onSubmit={handleSubmit} className="mb-8">
        <input
          type="text"
          name="name"
          value={currentOpp.name || ""}
          onChange={handleInputChange}
          placeholder="Name"
          className="mb-2 w-full p-2 bg-gray-700 text-white rounded"
        />
        <input
          type="text"
          name="estimatedApy"
          value={currentOpp.estimatedApy || ""}
          onChange={handleInputChange}
          placeholder="Estimated APY"
          className="mb-2 w-full p-2 bg-gray-700 text-white rounded"
        />
        <input
          type="text"
          name="network"
          value={currentOpp.network || ""}
          onChange={handleInputChange}
          placeholder="Network"
          className="mb-2 w-full p-2 bg-gray-700 text-white rounded"
        />
        <input
          type="text"
          name="tvl"
          value={currentOpp.tvl || ""}
          onChange={handleInputChange}
          placeholder="TVL"
          className="mb-2 w-full p-2 bg-gray-700 text-white rounded"
        />
        <select
          name="relativeRisk"
          value={currentOpp.relativeRisk || ""}
          onChange={handleInputChange}
          className="mb-2 w-full p-2 bg-gray-700 text-white rounded"
        >
          <option value="">Select Risk Level</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
        <select
          name="category"
          value={currentOpp.category || ""}
          onChange={handleInputChange}
          className="mb-2 w-full p-2 bg-gray-700 text-white rounded"
        >
          <option value="">Select Category</option>
          <option value="stablecoin">Stablecoin Yield</option>
          <option value="volatileAsset">Volatile Asset Yield</option>
          <option value="advancedStrategies">Advanced Strategies</option>
        </select>
        <textarea
          name="notes"
          value={currentOpp.notes || ""}
          onChange={handleInputChange}
          placeholder="Notes"
          className="mb-2 w-full p-2 bg-gray-700 text-white rounded"
        />
        <input
          type="text"
          name="link"
          value={currentOpp.link || ""}
          onChange={handleInputChange}
          placeholder="Link"
          className="mb-2 w-full p-2 bg-gray-700 text-white rounded"
        />
        <div className="mb-2">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              name="isBenchmark"
              checked={currentOpp.isBenchmark || false}
              onChange={handleInputChange}
              className="form-checkbox h-5 w-5 text-green-600"
            />
            <span className="ml-2 text-white">Benchmark</span>
          </label>
        </div>
        <input
          type="date"
          name="dateAdded"
          value={currentOpp.dateAdded ? new Date(currentOpp.dateAdded).toISOString().split("T")[0] : ""}
          onChange={handleInputChange}
          className="mb-2 w-full p-2 bg-gray-700 text-white rounded"
        />
        <button type="submit" className="bg-green-500 hover:bg-green-600 text-black font-bold py-2 px-4 rounded">
          {isEditing ? "Update" : "Add"} Opportunity
        </button>
      </form>

      <div>
        {opportunities.map((opp) => (
          <div key={opp.id} className="mb-4 p-4 bg-gray-700 rounded">
            <h3 className="font-bold">{opp.name}</h3>
            <p>APY: {opp.estimatedApy}</p>
            <p>Network: {opp.network}</p>
            <p>TVL: {opp.tvl}</p>
            <p>Risk: {opp.relativeRisk}</p>
            <p>Category: {opp.category}</p>
            <p>Notes: {opp.notes}</p>
            <p>
              Link:{" "}
              <a href={opp.link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                {opp.link}
              </a>
            </p>
            <p>Benchmark: {opp.isBenchmark ? "Yes" : "No"}</p>
            <p>Date Added: {new Date(opp.dateAdded).toLocaleDateString()}</p>
            <button
              onClick={() => handleEdit(opp)}
              className="mr-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-2 rounded"
            >
              Edit
            </button>
            <button
              onClick={() => handleDelete(opp.id)}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-2 rounded"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Admin;

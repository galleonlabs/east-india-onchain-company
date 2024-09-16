// src/contexts/AuthContext.tsx
import React, { createContext, useState, useEffect, useContext } from "react";
import { User } from "../types";
import { connectWallet, getOrCreateUser, isAdmin } from "../services/walletAuth";

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  connectWallet: () => Promise<void>;
  disconnect: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const address = localStorage.getItem("walletAddress");
      if (address) {
        try {
          const user = await getOrCreateUser(address);
          setUser(user);
        } catch (error) {
          console.error("Failed to get user:", error);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const handleConnectWallet = async () => {
    try {
      const address = await connectWallet();
      const user = await getOrCreateUser(address);
      setUser(user);
      localStorage.setItem("walletAddress", address);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  const handleDisconnect = () => {
    setUser(null);
    localStorage.removeItem("walletAddress");
  };

  const value = {
    user,
    isAdmin: user ? isAdmin(user.address) : false,
    loading,
    connectWallet: handleConnectWallet,
    disconnect: handleDisconnect,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

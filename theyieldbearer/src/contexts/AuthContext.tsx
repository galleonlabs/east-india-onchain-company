// src/contexts/AuthContext.tsx

import React, { createContext, useState, useEffect, useContext, useCallback } from "react";
import { User } from "../types";
import { connectWallet, getOrCreateUser, isAdmin as checkIsAdmin } from "../services/walletAuth";

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  connectWallet: () => Promise<void>;
  disconnect: () => void;
  updateUser: (updatedUser: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const address = localStorage.getItem("walletAddress");
      if (address) {
        try {
          const user = await getOrCreateUser(address);
          setUser(user);
          setIsAdmin(checkIsAdmin(address));
        } catch (error) {
          console.error("Failed to get user:", error);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const handleConnectWallet = useCallback(async () => {
    try {
      const address = await connectWallet();
      const user = await getOrCreateUser(address);
      setUser(user);
      setIsAdmin(checkIsAdmin(address));
      localStorage.setItem("walletAddress", address);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  }, []);

  const handleDisconnect = useCallback(() => {
    setUser(null);
    setIsAdmin(false);
    localStorage.removeItem("walletAddress");
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
    setIsAdmin(checkIsAdmin(updatedUser.address));
  }, []);

  const value = {
    user,
    isAdmin,
    loading,
    connectWallet: handleConnectWallet,
    disconnect: handleDisconnect,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

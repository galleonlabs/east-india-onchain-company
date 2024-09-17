import React, { createContext, useState, useEffect, useContext } from "react";
import { User } from "../types";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { getOrCreateUser, isAdmin as checkIsAdmin } from "../services/walletAuth";

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

  const { address, isConnected } = useAccount();
  const { connectAsync, connectors } = useConnect();
  const { disconnectAsync } = useDisconnect();

  useEffect(() => {
    const initAuth = async () => {
      if (isConnected && address) {
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
  }, [isConnected, address]);

  const handleConnectWallet = async () => {
    try {
      const connector = connectors[0]; // Using the first available connector
      if (connector) {
        await connectAsync({ connector });
      } else {
        throw new Error("No connector available");
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  const handleDisconnect = async () => {
    await disconnectAsync();
    setUser(null);
    setIsAdmin(false);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    setIsAdmin(checkIsAdmin(updatedUser.address));
  };

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

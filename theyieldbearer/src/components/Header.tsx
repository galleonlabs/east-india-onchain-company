// src/components/Header.tsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Header: React.FC = () => {
  const { user, isAdmin, connectWallet, disconnect } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="terminal-header py-4 text-terminal">
      <nav className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold">
            THE_YIELD_BEARER
          </Link>
          <div className="hidden md:flex items-center space-x-4">
      
            <Link to="/" className="hover:text-terminal/70 text-terminal">
              YIELD
            </Link>
            {"/"}
           
            <Link to="/subscribe" className="hover:text-terminal/70 text-terminal">
              UNLOCK ACCESS
            </Link>
            {"/"}
            {isAdmin && (
              <Link to="/admin" className="hover:text-terminal/70 text-terminal">
                ADMIN
              </Link>
            )}
            {user ? (
              <>
                <span className="text-md truncate w-28">- {user.address}</span>
                <button onClick={disconnect} className="bg-black border border-terminal -translate-y-0.5 py-1 px-2">
                  DISCONNECT
                </button>
              </>
            ) : (
              <button onClick={connectWallet} className="bg-black border border-terminal -translate-y-0.5 py-1 px-2">
                CONNECT_WALLET
              </button>
            )}
          </div>
          <button className="lg:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            ☰
          </button>
        </div>
        {isMenuOpen && (
          <div className="mt-4 md:hidden">
            <Link to="/" className="block py-2 hover:text-terminal/70 text-terminal">
              YIELD
            </Link>
            <Link to="/subscribe" className="block py-2 hover:text-terminal/70 text-terminal">
              UNLOCK ACCESS
            </Link>
            {isAdmin && (
              <Link to="/admin" className="block py-2 hover:text-terminal/70 text-terminal">
                ADMIN
              </Link>
            )}
            {user ? (
              <>
                <span className="block py-2 text-sm truncate">{user.address}</span>
                <button
                  onClick={disconnect}
                  className="block w-full text-left py-2 bg-black text-terminal border-terminal border font-bold"
                >
                  DISCONNECT
                </button>
              </>
            ) : (
              <button
                onClick={connectWallet}
                className="block w-full text-left py-2 bg-black text-terminal border-terminal border font-bold"
              >
                CONNECT_WALLET
              </button>
            )}
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;

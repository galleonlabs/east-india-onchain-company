// src/components/Header.tsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import logo from "../assets/logo.png";

const Header: React.FC = () => {
  const { user, isAdmin, connectWallet, disconnect } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className=" py-4 text-theme-pan-navy border-b border-theme-pan-navy">
      <nav className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold flex">
            <img src={logo} className="h-8 w-8 mr-4" alt="logo" />
            East India Onchain Company
          </Link>
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/" className="hover:text-theme-pan-sky text-theme-pan-navy">
              YIELD
            </Link>

            <Link to="/subscribe" className="hover:text-theme-pan-sky text-theme-pan-navy">
              UNLOCK ACCESS
            </Link>

            {isAdmin && (
              <Link to="/admin" className="hover:text-theme-pan-sky text-theme-pan-navy">
                ADMIN
              </Link>
            )}
            {user ? (
              <>
                <span className="text-md truncate w-28">- {user.address}</span>
                <button
                  onClick={disconnect}
                  className="text-theme-pan-navy border border-theme-pan-navy bg-theme-pan-champagne hover:bg-theme-pan-navy/10  py-1 px-2"
                >
                  DISCONNECT
                </button>
              </>
            ) : (
              <button
                onClick={connectWallet}
                className="text-theme-pan-navy border border-theme-pan-navy bg-theme-pan-champagne hover:bg-theme-pan-navy/10 py-1 px-2"
              >
                CONNECT WALLET
              </button>
            )}
          </div>
          <button className="lg:hidden text-3xl" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            ☰
          </button>
        </div>
        {isMenuOpen && (
          <div className="mt-4 md:hidden">
            <Link to="/" className="block py-2 hover:text-theme-pan-sky text-theme-pan-navy">
              YIELD
            </Link>
            <Link to="/subscribe" className="block py-2 hover:text-theme-pan-sky text-theme-pan-navy">
              UNLOCK ACCESS
            </Link>
            {isAdmin && (
              <Link to="/admin" className="block py-2 hover:text-theme-pan-sky text-theme-pan-navy">
                ADMIN
              </Link>
            )}
            {user ? (
              <>
                <span className="block py-2 text-sm truncate">{user.address}</span>
                <button
                  onClick={disconnect}
                  className="block w-full text-left py-2 bg-theme-pan-champagne text-theme-pan-navy border border-theme-pan-navy hover:bg-theme-pan-navy/10 px-4 font-bold"
                >
                  DISCONNECT
                </button>
              </>
            ) : (
              <button
                onClick={connectWallet}
                className="block w-full text-left py-2 bg-theme-pan-champagne text-theme-pan-navy border border-theme-pan-navy hover:bg-theme-pan-navy/10 px-4 font-bold"
              >
                CONNECT WALLET
              </button>
            )}
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;

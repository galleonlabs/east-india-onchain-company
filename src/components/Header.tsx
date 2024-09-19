import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import logo from "../assets/logo.png";

const Header: React.FC = () => {
  const { isAdmin } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="py-4 text-theme-pan-navy border-b border-theme-pan-navy bg-theme-pan-champagne">
      <nav className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-2xl flex items-center hover:opacity-80 transition-opacity">
            <img src={logo} className="h-8 w-8 mr-4" alt="logo" />
            East India Onchain Company
          </Link>
          <div className="hidden md:flex items-center space-x-5">
            <Link to="/" className="hover:text-theme-pan-sky transition-colors duration-200">
              Home
            </Link>
            <Link to="/yield" className="hover:text-theme-pan-sky transition-colors duration-200">
              Yield
            </Link>
            <Link to="/subscribe" className="hover:text-theme-pan-sky transition-colors duration-200">
              Join the Crew
            </Link>
            {isAdmin && (
              <Link to="/admin" className="hover:text-theme-pan-sky transition-colors duration-200">
                Admin
              </Link>
            )}
          
              <ConnectButton />
      
          </div>
          <button
            className="lg:hidden text-2xl focus:outline-none"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? "×" : "☰"}
          </button>
        </div>
        {isMenuOpen && (
          <div className="mt-4 md:hidden">
            <Link
              to="/"
              className="block py-2 hover:text-theme-pan-sky text-theme-pan-navy transition-colors duration-200"
            >
              Home
            </Link>
            <Link
              to="/yield"
              className="block py-2 hover:text-theme-pan-sky text-theme-pan-navy transition-colors duration-200"
            >
              Yield
            </Link>
            <Link
              to="/subscribe"
              className="block py-2 hover:text-theme-pan-sky text-theme-pan-navy transition-colors duration-200"
            >
              Join the Crew
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className="block py-2 hover:text-theme-pan-sky text-theme-pan-navy transition-colors duration-200"
              >
                Admin
              </Link>
            )}
            <div className="py-2">
              <ConnectButton />
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;

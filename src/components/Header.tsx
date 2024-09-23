import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import logo from "../assets/logo.png";

const Header: React.FC = () => {
  const { isAdmin, user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="py-4 text-theme-pan-champagne border-b border-theme-navy bg-theme-navy shadow-md">
      <nav className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-2xl flex items-center hover:opacity-80 transition-opacity font-morion">
            <img src={logo} className="h-10 w-10 mr-4" alt="logo" />
            <p className="-translate-y-4 text-sm pr-2 w-0">Galleon's</p>
            <p className="translate-y-2">{!user ? "East India Onchain Company" : "East India Onchain Co."}</p>
          </Link>

          <div className="hidden md:flex items-center space-x-5">
            {/* <Link to="/" className="hover:text-theme-champagne transition-colors duration-200">
              Home
            </Link> */}
            <Link to="/yield" className="hover:text-theme-champagne transition-colors duration-200">
              Yield
            </Link>
            <Link to="/subscribe" className="hover:text-theme-champagne transition-colors duration-200">
              Join the Crew
            </Link>
            <Link to="/fund" className="hover:text-theme-champagne transition-colors duration-200">
              Fund
            </Link>
            {isAdmin && (
              <Link to="/admin" className="hover:text-theme-champagne transition-colors duration-200">
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
              className="block py-2 hover:text-theme-champagne text-theme-pan-champagne transition-colors duration-200"
            >
              Home
            </Link>
            <Link
              to="/yield"
              className="block py-2 hover:text-theme-champagne text-theme-pan-champagne transition-colors duration-200"
            >
              Yield
            </Link>
            <Link
              to="/subscribe"
              className="block py-2 hover:text-theme-champagne text-theme-pan-champagne transition-colors duration-200"
            >
              Join the Crew
            </Link>
            <Link
              to="/fund"
              className="block py-2 hover:text-theme-champagne text-theme-pan-champagne transition-colors duration-200"
            >
              Fund
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className="block py-2 hover:text-theme-champagne text-theme-pan-champagne transition-colors duration-200"
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

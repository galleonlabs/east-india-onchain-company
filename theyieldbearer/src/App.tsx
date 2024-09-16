// src/App.tsx
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Subscribe from "./pages/Subscribe";
import Admin from "./pages/Admin";
import AdminRoute from "./components/AdminRoute";
import { AuthProvider } from "./contexts/AuthContext";

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-black text-green-400 font-mono">
          <div className="terminal-window">
            <Header />
            <main className="p-4">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/subscribe" element={<Subscribe />} />
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <Admin />
                    </AdminRoute>
                  }
                />
              </Routes>
            </main>
            <Footer />
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;

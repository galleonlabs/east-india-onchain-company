// src/App.tsx
import React, { Suspense } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import AdminRoute from "./components/AdminRoute";
import { AuthProvider } from "./contexts/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Yield from "./pages/Yield";
import Subscribe from "./pages/Subscribe";
import Admin from "./pages/Admin";
import Landing from "./pages/Landing";
import Fund from "./pages/Fund";

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Suspense fallback={<div>Loading...</div>}>
            <div className="min-h-screen bg-theme-champagne font-wigrum text-theme-navy">
              <div className="terminal-window">
                <Header />
                <main className="p-4 max-w-7xl mx-auto pb-32 pt-16">
                  <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/yield" element={<Yield />} />
                    <Route path="/subscribe" element={<Subscribe />} />
                    <Route path="/fund" element={<Fund />} />
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
          </Suspense>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
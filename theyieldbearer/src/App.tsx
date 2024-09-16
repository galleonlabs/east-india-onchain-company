// src/App.tsx
import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import AdminRoute from "./components/AdminRoute";
import { AuthProvider } from "./contexts/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
const Home = lazy(() => import("./pages/Home"));
const Subscribe = lazy(() => import("./pages/Subscribe"));
const Admin = lazy(() => import("./pages/Admin"));

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Suspense fallback={<div>Loading...</div>}>
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
          </Suspense>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;

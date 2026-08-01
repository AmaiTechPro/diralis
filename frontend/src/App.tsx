import { Routes, Route, Navigate } from "react-router-dom";

import HomePage from "./pages/HomePage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Datasets from "./pages/Datasets";
import ReportsPage from "./pages/ReportsPage";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import AIInsightsPage from "./pages/AIInsightsPage";
import AIChat from "./pages/AIChat";

import ProtectedRoute from "./components/auth/ProtectedRoute";

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />

      <Route path="/login" element={<Login />} />

      <Route path="/register" element={<Register />} />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/datasets"
        element={
          <ProtectedRoute>
            <Datasets />
          </ProtectedRoute>
        }
      />
     
     {/* AI   Insights Route */}
      <Route
  path="/ai-insights"
  element={
    <ProtectedRoute>
      <AIInsightsPage />
    </ProtectedRoute>
  }
  />

    {/* AI Chat Route */}

    <Route
    path="/chat"
    element={
    <ProtectedRoute>
      <AIChat />
    </ProtectedRoute>
    }
     />
      
      {/* Reports Route */}
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <ReportsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />


      {/* Catch all unknown routes */}
      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
}

export default App;


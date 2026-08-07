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
import AppLayout from "./components/layout/AppLayout";

import ForgotPassword from "./pages/ForgotPassword";

import ResetPassword from "./pages/ResetPassword";

import AdminDashboard from "./pages/AdminDashboard";

import PrivacyPolicy from "./pages/PrivacyPolicy";

import TermsOfService from "./pages/TermsOfService";

import Features from "./pages/Features";
import HowItWorks from "./pages/HowItWorks";
import Roadmap from "./pages/Roadmap";
import About from "./pages/About";
import Contact from "./pages/Contact";
import CookiePolicy from "./pages/CookiePolicy";
import Security from "./pages/Security";
import Documentation from "./pages/Documentation";
import Support from "./pages/Support";
import Pricing from "./pages/Pricing";

import VerifyEmail from "./pages/VerifyEmail";

import BillingVerify from "./pages/BillingVerify";



function App() {

  return (

    <Routes>


      {/* Public Routes */}

      <Route
        path="/"
        element={<HomePage />}
      />


      <Route
        path="/login"
        element={<Login />}
      />


      <Route
        path="/register"
        element={<Register />}
      />

      <Route
     path="/verify-email"
      element={<VerifyEmail />}
    />


      <Route
     path="/forgot-password"
     element={<ForgotPassword />}
    />

    <Route
   path="/reset-password"
   element={<ResetPassword />}
   />

    <Route
  path="/privacy"
  element={<PrivacyPolicy />}
/>


<Route
  path="/terms"
  element={<TermsOfService />}
/>

<Route
  path="/features"
  element={<Features />}
/>

<Route
  path="/how-it-works"
  element={<HowItWorks />}
/>

<Route
  path="/roadmap"
  element={<Roadmap />}
/>

<Route
  path="/about"
  element={<About />}
/>

<Route
  path="/contact"
  element={<Contact />}
/>

<Route
  path="/cookies"
  element={<CookiePolicy />}
/>

<Route
  path="/security"
  element={<Security />}
/>

<Route
  path="/docs"
  element={<Documentation />}
/>

<Route
  path="/support"
  element={<Support />}
/>

<Route
  path="/pricing"
  element={<Pricing />}
/>


<Route
  path="/billing/verify"
  element={<BillingVerify />}
/>


      {/* Protected Application Routes  */}


         {/* Admin Dashboard Route */}
        <Route
       path="/admin"
         element={
          <ProtectedRoute>

         <AppLayout>

         <AdminDashboard />

        </AppLayout>

      </ProtectedRoute>
      }
            />


      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>

            <AppLayout>

              <Dashboard />

            </AppLayout>

          </ProtectedRoute>
        }
      />



      <Route
        path="/datasets"
        element={
          <ProtectedRoute>

            <AppLayout>

              <Datasets />

            </AppLayout>

          </ProtectedRoute>
        }
      />



      <Route
        path="/ai-insights"
        element={
          <ProtectedRoute>

            <AppLayout>

              <AIInsightsPage />

            </AppLayout>

          </ProtectedRoute>
        }
      />



      <Route
        path="/chat"
        element={
          <ProtectedRoute>

            <AppLayout>

              <AIChat />

            </AppLayout>

          </ProtectedRoute>
        }
      />



      <Route
        path="/reports"
        element={
          <ProtectedRoute>

            <AppLayout>

              <ReportsPage />

            </AppLayout>

          </ProtectedRoute>
        }
      />



      <Route
        path="/profile"
        element={
          <ProtectedRoute>

            <AppLayout>

              <Profile />

            </AppLayout>

          </ProtectedRoute>
        }
      />



      <Route
        path="/settings"
        element={
          <ProtectedRoute>

            <AppLayout>

              <Settings />

            </AppLayout>

          </ProtectedRoute>
        }
      />



      {/* Unknown Routes */}

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />


    </Routes>

  );

}


export default App;


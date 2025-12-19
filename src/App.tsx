import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

import DashboardLayout from "@/components/layout/DashboardLayout";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Discover from "./pages/Discover";
import Messages from "./pages/Messages";
import WaliGuardianConsole from "@/pages/WaliGuardianConsole";
import WaliConsole from "./pages/WaliConsole";
import Settings from "./pages/Settings";
import AdminDashboard from "./pages/AdminDashboard";
import VerifyEmail from "./pages/VerifyEmail";
import ResetPassword from "./pages/ResetPassword";
import Analytics from "./pages/Analytics";
import Profile from "./pages/Profile";
import AuthCallback from "./pages/AuthCallback";
import IntroRequests from "./pages/IntroRequests";
import WaliInvite from "./pages/WaliInvite";
import SubscriptionUpgradePage from "./pages/SubscriptionUpgradePage";
import BillingSuccessPage from "./pages/BillingSuccessPage";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="light">
    {/* NEW: This wrapper div applies the global background and text colors 
      to ensure they cover the entire screen height (min-h-screen).
    */}
    <div className="bg-background text-foreground min-h-screen">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Wali invite is special: can be visited before login */}
              <Route path="/wali-invite" element={<WaliInvite />} />

              {/* Protected routes (must be logged in) */}
              <Route element={<ProtectedRoute />}>
                {/* Onboarding: keep OUTSIDE dashboard layout */}
                <Route path="/onboarding" element={<Onboarding />} />

                {/* Everything else: wrapped with DashboardLayout */}
                <Route element={<DashboardLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/discover" element={<Discover />} />
                  <Route path="/intro-requests" element={<IntroRequests />} />
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/wali-console" element={<WaliConsole />} />
                  <Route path="/pricing" element={<SubscriptionUpgradePage />} />
                  <Route path="/billing/success" element={<BillingSuccessPage />} />
                  <Route
                    path="/wali-guardian"
                    element={<WaliGuardianConsole />}
                  />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/analytics" element={<Analytics />} />

                  {/* Admin area also behind ProtectedRoute + AdminRoute */}
                  <Route
                    path="/admin"
                    element={
                      <AdminRoute>
                        <AdminDashboard />
                      </AdminRoute>
                    }
                  />
                </Route>
              </Route>

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>         
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </div>
  </ThemeProvider>
);

export default App;
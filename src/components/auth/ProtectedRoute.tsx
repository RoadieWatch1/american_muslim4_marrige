// src/components/auth/ProtectedRoute.tsx
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const ProtectedRoute: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  // Still checking auth → show simple loader
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-blue-50">
        <p className="text-gray-600">Loading your account…</p>
      </div>
    );
  }

  // Not logged in → send to landing/login
  if (!user) {
    return (
      <Navigate
        to="/"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  const role = profile?.role ?? "member";
  const onboardingCompleted = !!profile?.onboarding_completed;

  const isOnboardingPage = location.pathname === "/onboarding";
  const isWaliInvitePage = location.pathname.startsWith("/wali-invite");

  // ⚠️ For normal members: if onboarding not done,
  // force them to /onboarding and block other pages
  if (role === "member" && !onboardingCompleted) {
    if (!isOnboardingPage && !isWaliInvitePage) {
      return <Navigate to="/onboarding" replace />;
    }
  }

  // Otherwise, allow access
  return <Outlet />;
};

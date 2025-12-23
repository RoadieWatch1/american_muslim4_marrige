import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import {
  Bell,
  MessageCircle,
  UserCheck,
  LayoutDashboard,
  CreditCard,
  Menu,
  X,
  Crown,
  CheckCircle,
} from "lucide-react";

type BadgeProps = {
  unreadMessages?: number;
  pendingIntroRequests?: number;
};

type PlanId = "free" | "silver" | "gold";

export default function DashboardNav({
  unreadMessages = 0,
  pendingIntroRequests = 0,
}: BadgeProps) {
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // ✅ Active for exact match OR sub-routes
  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  // ✅ close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // ✅ ESC closes menu
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // ✅ Normalize plan tier from profile
  const plan: PlanId = useMemo(() => {
    const t = (profile?.subscription_tier ?? "free").toString().toLowerCase();
    if (t === "gold" || t === "silver" || t === "free") return t;
    return "free";
  }, [profile?.subscription_tier]);

  const planBadge = useMemo(() => {
    if (plan === "gold") {
      return {
        label: "Gold",
        Icon: Crown,
        className:
          "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200",
      };
    }
    if (plan === "silver") {
      return {
        label: "Silver",
        Icon: CheckCircle,
        className:
          "bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200",
      };
    }
    return {
      label: "Free",
      Icon: CheckCircle,
      className: "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200",
    };
  }, [plan]);

  const NavBtn = ({
    to,
    label,
    icon: Icon,
    badge,
    fullWidth = false,
  }: {
    to: string;
    label: string;
    icon: any;
    badge?: number;
    fullWidth?: boolean;
  }) => (
    <button
      type="button"
      onClick={() => navigate(to)}
      className={`relative flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition
        ${fullWidth ? "w-full justify-start" : ""}
        ${
          isActive(to)
            ? "bg-teal-100 text-teal-800"
            : "text-gray-700 hover:bg-gray-100"
        }
      `}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>

      {!!badge && badge > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[11px] flex items-center justify-center">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </button>
  );

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <h1
              className="text-2xl font-bold text-teal-800 cursor-pointer"
              onClick={() => navigate("/")}
            >
              AM4M
            </h1>

            {/* ✅ Clickable Plan badge -> /billing */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate("/billing");
              }}
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold transition ${planBadge.className}`}
              title={`Current plan: ${planBadge.label} (click to manage billing)`}
            >
              <planBadge.Icon className="h-3.5 w-3.5" />
              {planBadge.label}
            </button>
          </div>

          {/* ✅ Desktop nav */}
          <div className="hidden md:flex items-center gap-2 ml-4">
            <NavBtn to="/dashboard" label="Dashboard" icon={LayoutDashboard} />
            <NavBtn to="/billing" label="Billing" icon={CreditCard} />
            <NavBtn
              to="/messages"
              label="Messages"
              icon={MessageCircle}
              badge={unreadMessages}
            />
            <NavBtn
              to="/intro-requests"
              label="Intro Requests"
              icon={UserCheck}
              badge={pendingIntroRequests}
            />
            <NavBtn to="/settings" label="Alerts" icon={Bell} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* ✅ Mobile menu button */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center rounded-md border px-3 py-2 text-gray-700 hover:bg-gray-100"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Button
            variant="outline"
            onClick={handleSignOut}
            className="hidden md:inline-flex"
          >
            Sign Out
          </Button>
        </div>
      </div>

      {/* ✅ Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-white">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-2">
            <NavBtn
              to="/dashboard"
              label="Dashboard"
              icon={LayoutDashboard}
              fullWidth
            />
            <NavBtn to="/billing" label="Billing" icon={CreditCard} fullWidth />
            <NavBtn
              to="/messages"
              label="Messages"
              icon={MessageCircle}
              badge={unreadMessages}
              fullWidth
            />
            <NavBtn
              to="/intro-requests"
              label="Intro Requests"
              icon={UserCheck}
              badge={pendingIntroRequests}
              fullWidth
            />
            <NavBtn to="/settings" label="Alerts" icon={Bell} fullWidth />

            <div className="pt-2">
              <Button variant="outline" className="w-full" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

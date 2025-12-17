// src/components/layout/DashboardNav.tsx
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, MessageCircle, UserCheck } from "lucide-react";

type BadgeProps = {
  unreadMessages?: number;
  pendingIntroRequests?: number;
};

export default function DashboardNav({
  unreadMessages = 0,
  pendingIntroRequests = 0,
}: BadgeProps) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const isActive = (path: string) => location.pathname === path;

  const NavBtn = ({
    to,
    label,
    icon: Icon,
    badge,
  }: {
    to: string;
    label: string;
    icon: any;
    badge?: number;
  }) => (
    <button
      type="button"
      onClick={() => navigate(to)}
      className={`relative flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition
        ${isActive(to) ? "bg-teal-100 text-teal-800" : "text-gray-700 hover:bg-gray-100"}
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

  console.log("unreadMessages",unreadMessages)

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h1
            className="text-2xl font-bold text-teal-800 cursor-pointer"
            onClick={() => navigate("/dashboard")}
          >
            AM4M
          </h1>

          <div className="hidden md:flex items-center gap-2 ml-4">
            <NavBtn to="/messages" label="Messages" icon={MessageCircle} badge={unreadMessages} />
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
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </div>
    </nav>
  );
}

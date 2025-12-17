// src/components/layout/DashboardLayout.tsx
import React, { useCallback, useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import DashboardNav from "./DashboardNav";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export default function DashboardLayout() {
  const { user } = useAuth();

  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingIntroRequests, setPendingIntroRequests] = useState(0);

  const loadCounts = useCallback(async () => {
    if (!user) return;

    try {
      // ✅ Unread messages for logged-in user (same logic as Messages.tsx)
      const { count: unreadCount, error: unreadErr } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("is_read", false);

      if (unreadErr) {
        console.error("Unread messages count error:", unreadErr);
      } else {
        setUnreadMessages(unreadCount ?? 0);
      }

      // ✅ Pending intro requests (adjust statuses if yours differ)
      const { count: introCount, error: introErr } = await supabase
        .from("intro_requests")
        .select("id", { count: "exact", head: true })
        .eq("to_user_id", user.id)
        .in("status", ["pending", "requested"]);

      if (introErr) {
        console.error("Intro requests count error:", introErr);
      } else {
        setPendingIntroRequests(introCount ?? 0);
      }
    } catch (err) {
      console.error("Dashboard counts failed:", err);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // 1) initial load
    loadCounts();

    // 2) realtime subscriptions (refresh counts on changes)
    const msgChannel = supabase
      .channel(`nav-counts-messages-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          loadCounts();
        }
      )
      .subscribe();

    const introChannel = supabase
      .channel(`nav-counts-intro-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "intro_requests",
          filter: `to_user_id=eq.${user.id}`,
        },
        () => {
          loadCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(introChannel);
    };
  }, [user, loadCounts]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50">
      <DashboardNav
        unreadMessages={unreadMessages}
        pendingIntroRequests={pendingIntroRequests}
      />
      <Outlet />
    </div>
  );
}
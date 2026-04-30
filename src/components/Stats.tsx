import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type LandingStats = {
  active_members: number;
  verified_profiles: number;
  successful_marriages: number;
};

function formatCount(n: number) {
  if (!Number.isFinite(n)) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M+`;
  if (n >= 10_000) return `${Math.round(n / 1000)}K+`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K+`;
  return n.toLocaleString();
}

function useCountUp(target: number | null, duration = 1500): number {
  const [display, setDisplay] = React.useState(0);
  const rafRef = React.useRef<number | null>(null);
  React.useEffect(() => {
    if (!target) { setDisplay(0); return; }
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(eased * target));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);
  return display;
}

export const Stats: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<LandingStats>({
    active_members: 0,
    verified_profiles: 0,
    successful_marriages: 0,
  });

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc("public_landing_stats");

        if (error) {
          console.error("public_landing_stats error:", error);
          return;
        }

        const s = (data ?? {}) as Partial<LandingStats>;

        if (!cancelled) {
          setStats({
            active_members: Number(s.active_members ?? 0),
            verified_profiles: Number(s.verified_profiles ?? 0),
            successful_marriages: Number(s.successful_marriages ?? 0),
          });
        }
      } catch (e) {
        console.error("Stats unexpected error:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const countMembers = useCountUp(loading ? null : stats.active_members);
  const countMarriages = useCountUp(loading ? null : stats.successful_marriages);
  const countProfiles = useCountUp(loading ? null : stats.verified_profiles);

  const cards = [
    { value: loading ? "—" : formatCount(countMembers), label: "Active Members" },
    { value: loading ? "—" : formatCount(countMarriages), label: "Successful Marriages" },
    { value: loading ? "—" : formatCount(countProfiles), label: "Verified Profiles" },
    { value: "24/7", label: "Moderation Support" },
  ];

  return (
    <section className="relative py-16 bg-slate-900 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] bg-teal-500/10 rounded-full blur-3xl" />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/10">
          {cards.map((stat, index) => (
            <div key={index} className="text-center px-8 py-4">
              <div className="text-4xl md:text-5xl font-extrabold text-white mb-2 tabular-nums">
                {stat.value}
              </div>
              <div className="text-slate-400 text-xs uppercase tracking-wide">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

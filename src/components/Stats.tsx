import React, { useEffect, useMemo, useState } from "react";
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

        // data is JSON
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

  const cards = useMemo(
    () => [
      {
        number: loading ? "—" : formatCount(stats.active_members),
        label: "Active Members",
      },
      {
        number: loading ? "—" : formatCount(stats.successful_marriages),
        label: "Successful Marriages",
      },
      {
        number: loading ? "—" : formatCount(stats.verified_profiles),
        label: "Verified Profiles",
      },
      {
        number: "24/7",
        label: "Moderation Support",
      },
    ],
    [loading, stats]
  );

  return (
    <section className="py-16 bg-gradient-to-r from-teal-600 to-teal-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {cards.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                {stat.number}
              </div>
              <div className="text-teal-100 text-sm md:text-base">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

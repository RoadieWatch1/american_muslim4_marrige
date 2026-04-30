import React from "react";
import { Button } from "./ui/Button";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Compass, Users, Lock, Handshake, CheckCircle } from "lucide-react";

export const AboutSection: React.FC = () => {
  const { openAuthModal } = useAuthModal();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (user) navigate("/pricing");
    else openAuthModal();
  };

  const goToHowItWorks = () => {
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="py-20 bg-gradient-to-br from-teal-50 via-white to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* LEFT */}
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white px-3 py-1 text-xs font-semibold text-teal-700">
              About AM4M
            </p>

            <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-foreground leading-tight">
              Marriage-first matchmaking,
              <br />
              built on Islamic values.
            </h2>

            <p className="mt-5 text-lg text-foreground/60 leading-relaxed">
              AM4M is a halal matchmaking platform designed for American Muslims who are
              serious about marriage. We prioritize intentions, family involvement, privacy,
              and respectful communication — without the noise of casual dating.
            </p>

            <p className="mt-4 text-foreground/60 leading-relaxed">
              Our approach combines modern tools with traditional adab, offering optional wali
              involvement, chaperone-friendly communication, and community standards aligned
              with Islamic guidelines.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" onClick={handleGetStarted}>
                Get Started Free
              </Button>

              <Button size="lg" variant="outline" onClick={goToHowItWorks}>
                Learn How It Works
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap gap-6 text-sm text-foreground/60">
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-teal-600 flex-shrink-0" /> Verified profiles
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-teal-600 flex-shrink-0" /> Wali-friendly
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-teal-600 flex-shrink-0" /> Privacy controls
              </span>
            </div>
          </div>

          {/* RIGHT */}
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                icon: Compass,
                title: "Clear Intentions",
                desc: "Everyone joins with nikah in mind — no casual dating.",
              },
              {
                icon: Users,
                title: "Family Friendly",
                desc: "Optional wali involvement and chaperoned communication.",
              },
              {
                icon: Lock,
                title: "Privacy First",
                desc: "You control profile visibility and communication.",
              },
              {
                icon: Handshake,
                title: "Respectful Culture",
                desc: "Reporting, moderation, and Islamic guidelines.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-background border border-border/50 rounded-2xl p-6 hover:border-teal-300/60 hover:shadow-md transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center mb-1">
                  <item.icon className="w-5 h-5 text-teal-600" />
                </div>
                <h3 className="mt-3 font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm text-foreground/60">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";

const values = [
  {
    icon: "🧭",
    title: "Marriage-First Intentions",
    desc: "Everyone is here for nikah. No casual dating — only serious, values-led matching.",
  },
  {
    icon: "👨‍👩‍👧‍👦",
    title: "Family & Wali Friendly",
    desc: "Optional wali involvement and chaperoned communication to keep things respectful and clear.",
  },
  {
    icon: "🔐",
    title: "Privacy by Design",
    desc: "Built with safety, moderation, and control in mind — so you can match with confidence.",
  },
];

const steps = [
  {
    step: "01",
    title: "Create Your Profile",
    desc: "Share what matters: deen, goals, and preferences — while keeping control over privacy.",
  },
  {
    step: "02",
    title: "Discover Compatible Matches",
    desc: "Browse thoughtfully and connect with people aligned on faith, values, and readiness for marriage.",
  },
  {
    step: "03",
    title: "Connect With Structure",
    desc: "Use respectful messaging with optional wali oversight to keep interactions purposeful.",
  },
  {
    step: "04",
    title: "Move Toward Nikah",
    desc: "When it’s right, involve family and take the next step with clarity and barakah.",
  },
];

export default function AboutUs() {
  return (
    <main className="bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-white to-white" />
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-teal-200/30 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-emerald-200/30 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white px-3 py-1 text-xs font-semibold text-teal-700">
              <span className="text-base">🤝</span> Built for American Muslims
            </p>

            <h1 className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
              A halal matchmaking platform designed for commitment, clarity, and
              family blessing.
            </h1>

            <p className="mt-5 text-lg text-gray-600 leading-relaxed">
              AM4M helps serious Muslims connect in a respectful, structured way — with
              optional wali involvement, privacy-first design, and community standards
              aligned with Islamic adab.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/signup">Get Started Free</Link>
              </Button>

              <Button asChild variant="outline" size="lg">
                <Link to="/pricing">View Pricing</Link>
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap gap-6 text-sm text-gray-600">
              <span className="flex items-center gap-2">
                <span className="text-teal-600 text-lg">✓</span> Verified profiles
              </span>
              <span className="flex items-center gap-2">
                <span className="text-teal-600 text-lg">✓</span> Respectful communication
              </span>
              <span className="flex items-center gap-2">
                <span className="text-teal-600 text-lg">✓</span> Privacy controls
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              What AM4M stands for
            </h2>
            <p className="mt-3 text-lg text-gray-600">
              A modern product, grounded in Islamic values.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {values.map((v) => (
              <div
                key={v.title}
                className="bg-gradient-to-br from-teal-50 to-white p-7 rounded-2xl border border-gray-200 hover:border-teal-300 hover:shadow-lg transition-all duration-200"
              >
                <div className="text-4xl">{v.icon}</div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  {v.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              How it works
            </h2>
            <p className="mt-3 text-lg text-gray-600">
              Simple steps — with structure where it matters.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {steps.map((s) => (
              <div
                key={s.step}
                className="rounded-2xl border border-gray-200 bg-white p-7 hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0 rounded-xl bg-teal-600 text-white px-3 py-2 text-sm font-bold">
                    {s.step}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {s.title}
                    </h3>
                    <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                      {s.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Button asChild variant="outline">
              <Link to="/faq">Read FAQs</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Safety callout */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-teal-200 bg-gradient-to-br from-teal-50 to-white p-8 sm:p-10">
            <div className="grid lg:grid-cols-3 gap-8 items-center">
              <div className="lg:col-span-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Safety, moderation, and respect — built in
                </h2>
                <p className="mt-3 text-gray-600 leading-relaxed">
                  We use moderation tools, reporting, and community standards to keep the
                  experience respectful and marriage-focused. Your trust is everything.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Button asChild>
                    <Link to="/help">Visit Help Center</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/contact">Contact Us</Link>
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl bg-white border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900">Quick highlights</h3>
                <ul className="mt-3 space-y-2 text-sm text-gray-600">
                  <li className="flex gap-2">
                    <span className="text-teal-600">✓</span> Report & block tools
                  </li>
                  <li className="flex gap-2">
                    <span className="text-teal-600">✓</span> Profile verification options
                  </li>
                  <li className="flex gap-2">
                    <span className="text-teal-600">✓</span> Privacy controls for visibility
                  </li>
                  <li className="flex gap-2">
                    <span className="text-teal-600">✓</span> Wali-friendly communication
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-teal-600 to-teal-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Ready to start your marriage journey?
          </h2>
          <p className="mt-4 text-lg text-teal-100">
            Join AM4M and connect with intention, structure, and barakah.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="secondary" size="lg">
              <Link to="/signup">Get Started Free</Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="bg-white text-teal-700 border-white hover:bg-teal-50"
            >
              <Link to="/pricing">View Pricing</Link>
            </Button>
          </div>

          <p className="mt-6 text-teal-200 text-sm">
            No credit card required • Free plan available
          </p>
        </div>
      </section>
    </main>
  );
}

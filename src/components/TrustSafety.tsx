import React from 'react';
import { ShieldCheck, Eye, Ban, Lock, Zap, MessageSquare } from 'lucide-react';

const safetyFeatures = [
  {
    icon: ShieldCheck,
    title: 'Identity Verification',
    description: 'Multi-step verification including ID upload and selfie matching ensures authentic profiles.'
  },
  {
    icon: Eye,
    title: 'Human Moderation',
    description: 'Dedicated team reviews all photos, videos, and reported content within 24 hours.'
  },
  {
    icon: Ban,
    title: 'Block & Report',
    description: 'Easy-to-use tools to block users and report inappropriate behavior instantly.'
  },
  {
    icon: Lock,
    title: 'Privacy Controls',
    description: 'Control who sees your profile, photos, and personal information with granular settings.'
  },
  {
    icon: Zap,
    title: 'AI Content Filtering',
    description: 'Advanced AI automatically detects and blurs inappropriate content before human review.'
  },
  {
    icon: MessageSquare,
    title: 'Safe Messaging',
    description: 'Profanity filters, rate limits, and optional wali oversight keep conversations respectful.'
  }
];

export const TrustSafety: React.FC = () => {
  return (
    <section className="py-20 bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-teal-400 to-emerald-300 bg-clip-text text-transparent">
            Your Safety is Our Priority
          </h2>
          <p className="mt-4 text-xl text-slate-400">
            Multiple layers of protection for a secure matchmaking experience
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {safetyFeatures.map((feature, index) => (
            <div
              key={index}
              className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-xl hover:bg-white/10 hover:border-teal-500/30 transition-all duration-300 group"
            >
              <div className="w-11 h-11 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-4 group-hover:bg-teal-500/20 transition-colors">
                <feature.icon className="w-5 h-5 text-teal-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

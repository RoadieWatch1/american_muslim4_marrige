import React from 'react';
import { Handshake, BadgeCheck, MessageCircle, Target, Lock, Moon } from 'lucide-react';

const features = [
  {
    icon: Handshake,
    title: 'Wali Involvement',
    description: 'Optional wali approval for intro requests and chaperoned messaging for peace of mind.'
  },
  {
    icon: BadgeCheck,
    title: 'Verified Profiles',
    description: 'Identity verification and photo moderation ensure authentic, trustworthy connections.'
  },
  {
    icon: MessageCircle,
    title: 'Chaperoned Chat',
    description: 'Invite your wali to join conversations, maintaining Islamic adab throughout.'
  },
  {
    icon: Target,
    title: 'Marriage-Focused',
    description: 'Every member confirms nikah intentions. No casual dating, only serious commitments.'
  },
  {
    icon: Lock,
    title: 'Privacy & Safety',
    description: 'Robust reporting, blocking, and moderation keep the community safe and respectful.'
  },
  {
    icon: Moon,
    title: 'Islamic Guidelines',
    description: 'Modest media rules, halal lifestyle preferences, and prayer-based matching.'
  }
];

export const Features: React.FC = () => {
  return (
    <section className="py-20 bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-teal-400 to-emerald-300 bg-clip-text text-transparent">
            Built on Islamic Values
          </h2>
          <p className="mt-4 text-xl text-slate-400">Everything you need for a halal marriage journey</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-teal-500/30 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-4 group-hover:bg-teal-500/20 transition-colors duration-300">
                <feature.icon className="w-6 h-6 text-teal-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-slate-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

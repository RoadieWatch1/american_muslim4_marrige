import React from 'react';
import { Camera, Heart, MessageCircle, Users } from 'lucide-react';

const guidelines = [
  {
    title: 'Modest Media',
    description: 'Up to 6 photos and 1 video (≤60s). All content reviewed for Islamic modesty standards.',
    icon: Camera
  },
  {
    title: 'Marriage Intentions',
    description: 'All members confirm nikah intentions during signup. No casual dating allowed.',
    icon: Heart
  },
  {
    title: 'Respectful Communication',
    description: 'Auto-moderation filters inappropriate language. Adab reminders in all chats.',
    icon: MessageCircle
  },
  {
    title: 'Family Involvement',
    description: 'Optional wali approval system ensures family blessing and oversight.',
    icon: Users
  }
];

export const IslamicGuidelines: React.FC = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-amber-50 to-teal-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900">Our Islamic Guidelines</h2>
          <p className="mt-4 text-xl text-gray-600">
            Upholding adab and Islamic values in every interaction
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {guidelines.map((guideline, index) => (
            <div
              key={index}
              className="bg-background border border-border/40 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-amber-300/40 transition-all duration-300"
            >
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                  <guideline.icon className="w-6 h-6 text-amber-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2 text-center">
                {guideline.title}
              </h3>
              <p className="text-foreground/60 text-sm text-center">
                {guideline.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

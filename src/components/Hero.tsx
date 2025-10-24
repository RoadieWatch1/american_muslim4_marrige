import React, { useState } from 'react';
import { Button } from './ui/Button';
import { AuthModal } from './auth/AuthModal';

export const Hero: React.FC = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const scrollToDiscover = () => {
    document.getElementById('discover')?.scrollIntoView({ behavior: 'smooth' });
  };
  return (
    <>
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-teal-50 via-white to-amber-50">
        {/* Islamic Pattern Overlay */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231A5F7A' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
                Find Your <span className="text-teal-600">Halal Match</span> with Family Blessing
              </h1>
              <p className="mt-6 text-xl text-gray-600 leading-relaxed">
                Serious Muslim matchmaking with adab. Marriage-intended connections with optional wali involvement and chaperoned messaging.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button size="lg" onClick={() => setShowAuthModal(true)}>
                  Get Started Free
                </Button>
                <Button variant="outline" size="lg" onClick={scrollToDiscover}>
                  Learn More
                </Button>
              </div>
              <div className="mt-8 flex items-center gap-8 justify-center lg:justify-start text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="text-teal-600 text-2xl">✓</span>
                  <span>Verified Profiles</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-teal-600 text-2xl">✓</span>
                  <span>Wali Involvement</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-teal-600 text-2xl">✓</span>
                  <span>100% Halal</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img 
                  src="https://d64gsuwffb70l.cloudfront.net/68efeec24861a2554564bed1_1760554746123_5af75194.webp" 
                  alt="Happy Muslim couple" 
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
};

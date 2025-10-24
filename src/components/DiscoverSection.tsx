import React, { useState } from 'react';
import { ProfileCard } from './ProfileCard';
import { SwipeActions } from './SwipeActions';
import { mockProfiles } from '@/data/mockProfiles';

export const DiscoverSection: React.FC = () => {
  const [profiles] = useState(mockProfiles);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matches, setMatches] = useState<string[]>([]);

  const currentProfile = profiles[currentIndex];

  const handlePass = () => {
    if (currentIndex < profiles.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      alert('No more profiles! In production, this would load more.');
    }
  };

  const handleLike = () => {
    if (currentProfile.waliRequired) {
      alert(`Intro request sent to ${currentProfile.firstName}! Waiting for wali approval.`);
    } else {
      setMatches([...matches, currentProfile.id]);
      alert(`It's a match with ${currentProfile.firstName}! 🎉`);
    }
    handlePass();
  };

  const handleSuperIntro = () => {
    alert(`Super Intro sent to ${currentProfile.firstName} with a personalized message!`);
    handlePass();
  };

  if (!currentProfile) {
    return (
      <div className="text-center py-20">
        <p className="text-xl text-gray-600">No more profiles to show</p>
      </div>
    );
  }

  return (
    <section id="discover" className="py-20 bg-gradient-to-br from-gray-50 to-teal-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900">Discover Your Match</h2>
          <p className="mt-4 text-xl text-gray-600">Swipe with intention</p>
        </div>
        <div className="flex flex-col items-center">
          <ProfileCard
            profile={currentProfile}
            onLike={handleLike}
            onPass={handlePass}
            onSuperIntro={handleSuperIntro}
          />
          <SwipeActions
            onPass={handlePass}
            onLike={handleLike}
            onSuperIntro={handleSuperIntro}
          />
          <p className="text-sm text-gray-500 mt-4">
            {matches.length} matches • Profile {currentIndex + 1} of {profiles.length}
          </p>
        </div>
      </div>
    </section>
  );
};

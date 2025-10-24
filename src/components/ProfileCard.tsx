import React from 'react';
import { Profile } from '@/types';
import { Badge } from './ui/Badge';

interface ProfileCardProps {
  profile: Profile;
  onLike?: () => void;
  onPass?: () => void;
  onSuperIntro?: () => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ profile, onLike, onPass, onSuperIntro }) => {
  const practiceLabels = {
    learning: 'Learning',
    moderate: 'Moderate',
    practicing: 'Practicing',
    very_practicing: 'Very Practicing'
  };

  const timelineLabels = {
    'asap': 'ASAP',
    '3-6mo': '3-6 months',
    '6-12mo': '6-12 months',
    '>12mo': '12+ months'
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-sm">
      <div className="relative h-96">
        <img src={profile.photos[0]} alt={profile.firstName} className="w-full h-full object-cover" />
        <div className="absolute top-4 right-4 flex gap-2">
          {profile.verified && (
            <Badge variant="verified" icon={<span>✓</span>}>Verified</Badge>
          )}
          {profile.waliRequired && (
            <Badge variant="wali">Wali Active</Badge>
          )}
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-2xl font-bold text-gray-900">{profile.firstName}, {profile.age}</h3>
        <p className="text-gray-600 mt-1">{profile.city}, {profile.state}</p>
        <div className="flex flex-wrap gap-2 mt-3">
          <Badge>{practiceLabels[profile.practiceLevel]}</Badge>
          {profile.denomination && <Badge>{profile.denomination}</Badge>}
        </div>
        <p className="text-sm text-gray-700 mt-4">{profile.bio}</p>
        <p className="text-sm text-teal-600 font-medium mt-3">
          Seeking nikah within: {timelineLabels[profile.nikahTimeline]}
        </p>
      </div>
    </div>
  );
};

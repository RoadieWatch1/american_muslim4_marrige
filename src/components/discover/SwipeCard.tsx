import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { MapPin, Calendar, Church } from 'lucide-react';


interface SwipeCardProps {
  profile: any;
  onSwipe: (direction: 'left' | 'right' | 'up') => void;
}

export function SwipeCard({ profile, onSwipe }: SwipeCardProps) {
  const [currentPhoto, setCurrentPhoto] = useState(0);

  const practiceLabels = {
    learning: 'Learning',
    moderate: 'Moderate',
    practicing: 'Practicing',
    very_practicing: 'Very Practicing'
  };

  const timelineLabels = {
    asap: 'ASAP',
    '3-6mo': '3-6 months',
    '6-12mo': '6-12 months',
    '>12mo': '1+ year'
  };

  return (
    <div className="w-full h-[600px]">
      <div className="relative w-full h-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        <img
          src={profile.photos?.[currentPhoto] || '/placeholder.svg'}
          alt={profile.firstName}
          className="w-full h-full object-cover"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        <div className="absolute top-4 right-4 flex gap-2">
          {profile.verified && (
            <Badge className="bg-blue-500">✓ Verified</Badge>
          )}
          {profile.waliRequired && (
            <Badge className="bg-purple-500">Wali Required</Badge>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <h2 className="text-3xl font-bold mb-2">
            {profile.firstName}, {profile.age}
          </h2>
          
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4" />
            <span>{profile.city}, {profile.state}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Church className="w-4 h-4" />

              <span className="text-sm">{practiceLabels[profile.practiceLevel]}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">{timelineLabels[profile.nikahTimeline]}</span>
            </div>
          </div>

          <p className="text-sm line-clamp-2 mb-4">{profile.bio}</p>

          {profile.photos?.length > 1 && (
            <div className="flex gap-1">
              {profile.photos.map((_: any, i: number) => (
                <button
                  key={i}
                  onClick={() => setCurrentPhoto(i)}
                  className={`h-1 flex-1 rounded ${i === currentPhoto ? 'bg-white' : 'bg-white/30'}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, MessageCircle, Settings, Shield, User, Image, Crown, Zap, Star, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MediaUpload } from '@/components/media/MediaUpload';
import { MediaGallery } from '@/components/media/MediaGallery';
import { EmailVerificationBanner } from '@/components/auth/EmailVerificationBanner';
import { supabase } from '@/lib/supabase';
import { MEDIA_LIMITS } from '@/types/media';

export default function Dashboard() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [showMediaManager, setShowMediaManager] = useState(false);
  const [mediaCounts, setMediaCounts] = useState({ photos: 0, videos: 0 });
  const [todaysMatches, setTodaysMatches] = useState(0);

  const subscriptionTier = profile?.subscription_tier || 'basic';
  const isElite = subscriptionTier === 'elite';
  const isPremium = subscriptionTier === 'premium';
  const isBasic = subscriptionTier === 'basic';

  useEffect(() => {
    loadMediaCounts();
    if (isBasic) {
      loadTodaysMatches();
    }
  }, [user]);

  const loadTodaysMatches = async () => {
    if (!user) return;
    try {
      const { data } = await supabase.rpc('get_todays_match_count', { user_uuid: user.id });
      if (data !== null) setTodaysMatches(data);
    } catch (err) {
      console.error('Error loading match count:', err);
    }
  };

  const loadMediaCounts = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('media')
        .select('type')
        .eq('user_id', user.id);
      if (error) throw error;
      const photos = data?.filter(m => m.type === 'photo').length || 0;
      const videos = data?.filter(m => m.type === 'video').length || 0;
      setMediaCounts({ photos, videos });
    } catch (err) {
      console.error('Error loading media counts:', err);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleBoostProfile = async () => {
    if (!isElite) {
      navigate('/pricing');
      return;
    }
    try {
      const boostUntil = new Date();
      boostUntil.setHours(boostUntil.getHours() + 24);
      
      await supabase
        .from('profiles')
        .update({ 
          profile_boosted_until: boostUntil.toISOString(),
          last_boost_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', user!.id);
      
      alert('Your profile has been boosted for 24 hours!');
    } catch (error) {
      console.error('Error boosting profile:', error);
    }
  };

  const getTierBadge = () => {
    if (isElite) return { icon: Crown, color: 'text-purple-600', bg: 'bg-gradient-to-r from-purple-500 to-pink-500', label: 'Elite' };
    if (isPremium) return { icon: Star, color: 'text-blue-600', bg: 'bg-gradient-to-r from-blue-500 to-cyan-500', label: 'Premium' };
    return null;
  };

  const tierBadge = getTierBadge();

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-teal-800">AM4M Dashboard</h1>
            {tierBadge && (
              <div className={`${tierBadge.bg} text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1`}>
                <tierBadge.icon className="h-4 w-4" />
                {tierBadge.label}
              </div>
            )}
          </div>
          <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <EmailVerificationBanner />
        
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            As-salamu alaykum, {profile?.first_name || 'User'}!
          </h2>
          <p className="text-gray-600">Welcome to your matchmaking dashboard</p>
        </div>

        {/* Subscription Status Card */}
        <Card className="mb-8 overflow-hidden">
          <div className={isBasic ? 'bg-gray-50' : tierBadge?.bg}>
            <CardHeader className={isBasic ? '' : 'text-white'}>
              <CardTitle className="flex items-center justify-between">
                <span>Your Membership</span>
                {isBasic && <Button size="sm" onClick={() => navigate('/pricing')}>Upgrade</Button>}
              </CardTitle>
            </CardHeader>
          </div>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <Heart className="h-8 w-8 mx-auto mb-2 text-pink-500" />
                <p className="font-semibold">Daily Matches</p>
                <p className="text-2xl font-bold">
                  {isBasic ? `${3 - todaysMatches}/3` : 'Unlimited'}
                </p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Zap className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                <p className="font-semibold">Visibility</p>
                <p className="text-lg font-bold">
                  {isElite ? 'Boosted' : isPremium ? 'Priority' : 'Standard'}
                </p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Shield className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="font-semibold">Support</p>
                <p className="text-lg font-bold">
                  {isElite ? 'VIP 24/7' : isPremium ? 'Priority' : 'Standard'}
                </p>
              </div>
            </div>
            {isElite && (
              <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-purple-900">Profile Boost</p>
                    <p className="text-sm text-purple-700">Get 10x more visibility for 24 hours</p>
                  </div>
                  <Button onClick={handleBoostProfile} className="bg-purple-600 hover:bg-purple-700">
                    <Zap className="h-4 w-4 mr-2" />
                    Boost Now
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/discover')}>
            <CardHeader>
              <Heart className="w-8 h-8 text-pink-600 mb-2" />
              <CardTitle>Discover</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Browse profiles and find your match</p>
              {isBasic && todaysMatches >= 3 && (
                <p className="text-sm text-orange-600 mb-2">Daily limit reached</p>
              )}
              <Button className="w-full" onClick={(e) => { e.stopPropagation(); navigate('/discover'); }}>
                Start Swiping
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/messages')}>
            <CardHeader>
              <MessageCircle className="w-8 h-8 text-teal-600 mb-2" />
              <CardTitle>Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Chat with your matches</p>
              <Button variant="outline" className="w-full" onClick={(e) => { e.stopPropagation(); navigate('/messages'); }}>
                View Chats
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/profile')}>
            <CardHeader>
              <User className="w-8 h-8 text-blue-600 mb-2" />
              <CardTitle>My Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Edit your profile and photos</p>
              <Button variant="outline" className="w-full" onClick={(e) => { e.stopPropagation(); navigate('/profile'); }}>
                Edit Profile
              </Button>
            </CardContent>
          </Card>

          {profile?.gender === 'female' && (
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/wali-console')}>
              <CardHeader>
                <Shield className="w-8 h-8 text-purple-600 mb-2" />
                <CardTitle>Wali Console</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">Manage wali involvement</p>
                <Button variant="outline" className="w-full" onClick={(e) => { e.stopPropagation(); navigate('/wali-console'); }}>
                  Manage Wali
                </Button>
              </CardContent>
            </Card>
          )}

          {isAdmin && (
            <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200" onClick={() => navigate('/admin')}>
              <CardHeader>
                <Shield className="w-8 h-8 text-purple-600 mb-2" />
                <CardTitle className="text-purple-900">Admin Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-purple-700 mb-4">Monitor email digests and analytics</p>
                <Button variant="outline" className="w-full border-purple-300 text-purple-700 hover:bg-purple-100" onClick={(e) => { e.stopPropagation(); navigate('/admin'); }}>
                  Open Admin
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-indigo-50 to-purple-50" onClick={() => navigate('/analytics')}>
            <CardHeader>
              <BarChart3 className="w-8 h-8 text-indigo-600 mb-2" />
              <CardTitle>Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Track your match statistics</p>
              <Button variant="outline" className="w-full" onClick={(e) => { e.stopPropagation(); navigate('/analytics'); }}>
                View Analytics
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/settings')}>
            <CardHeader>
              <Settings className="w-8 h-8 text-gray-600 mb-2" />
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Manage billing & preferences</p>
              <Button variant="outline" className="w-full" onClick={(e) => { e.stopPropagation(); navigate('/settings'); }}>
                Manage Settings
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <Image className="w-6 h-6 text-teal-600" />
              <CardTitle>Photos & Video</CardTitle>
            </div>
            <Button variant="outline" onClick={() => setShowMediaManager(!showMediaManager)}>
              {showMediaManager ? 'Hide' : 'Manage Media'}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex gap-4 text-sm">
              <span className="text-gray-600">
                Photos: <span className="font-semibold text-teal-600">{mediaCounts.photos}/{MEDIA_LIMITS.maxPhotos}</span>
              </span>
              <span className="text-gray-600">
                Videos: <span className="font-semibold text-teal-600">{mediaCounts.videos}/{MEDIA_LIMITS.maxVideos}</span>
              </span>
            </div>
            {showMediaManager && (
              <div className="space-y-6">
                <MediaUpload 
                  onUploadComplete={loadMediaCounts}
                  currentPhotos={mediaCounts.photos}
                  currentVideos={mediaCounts.videos}
                />
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Your Media</h3>
                  <MediaGallery onMediaChange={loadMediaCounts} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
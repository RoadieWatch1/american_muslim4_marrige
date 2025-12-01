/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Upload, X, AlertCircle, Video } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface IntroVideoUploadProps {
  onSubmit: () => void;
  onBack: () => void;
}

export const IntroVideoUpload: React.FC<IntroVideoUploadProps> = ({
  onSubmit,
  onBack,
}) => {
  const { user } = useAuth();
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [error, setError] = useState('');

  // Helper to extract storage path from public url
  const extractStoragePath = (url: string): string | null => {
    const marker = '/profile-media/';
    const idx = url.indexOf(marker);
    return idx === -1 ? null : url.substring(idx + marker.length);
  };

  // 🔹 Load existing intro video
  useEffect(() => {
    if (!user) return;

    (async () => {
      setLoadingExisting(true);

      const { data, error } = await supabase
        .from('media')
        .select('id, url')
        .eq('user_id', user.id)
        .eq('type', 'video')
        .in('status', ['pending', 'approved'])
        .maybeSingle();

      if (!error && data) {
        setVideoUrl(data.url);
        setVideoId(data.id);
      }

      setLoadingExisting(false);
    })();
  }, [user]);

  // 🔹 Upload handler
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setError('');
    setUploading(true);

    try {
      if (!file.type.startsWith('video/')) {
        throw new Error('Please select a valid video file.');
      }

      if (file.size > 50 * 1024 * 1024) {
        throw new Error('Video must be less than 50MB.');
      }

      const ext = file.name.split('.').pop();
      const path = `${user.id}/video-${Date.now()}.${ext}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('profile-media')
        .upload(path, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('profile-media').getPublicUrl(path);

      // Remove old intro video if exists
      if (videoId) {
        await supabase.from('media').delete().eq('id', videoId);
      }

      // Insert into media table
      const { data: inserted, error: dbError } = await supabase
        .from('media')
        .insert({
          user_id: user.id,
          type: 'video',
          url: publicUrl,
          is_primary: false,
          status: 'approved',
        })
        .select('id, url')
        .maybeSingle();

      if (dbError) throw dbError;

      // Update profile
      await supabase
        .from('profiles')
        .update({ intro_video_id: inserted.id })
        .eq('id', user.id);

      // Update UI
      setVideoUrl(inserted.url);
      setVideoId(inserted.id);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error uploading video.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // 🔹 Remove video
  const removeVideo = async () => {
    if (!user || !videoId || !videoUrl) return;

    setError('');

    try {
      const storagePath = extractStoragePath(videoUrl);
      if (storagePath) {
        await supabase.storage.from('profile-media').remove([storagePath]);
      }

      await supabase.from('media').delete().eq('id', videoId);

      await supabase
        .from('profiles')
        .update({ intro_video_id: null })
        .eq('id', user.id);

      setVideoUrl(null);
      setVideoId(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Could not remove video.');
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Intro Video (Optional)</CardTitle>
          <p className="text-gray-600">
            A short video helps others understand your personality better.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Video Preview or Upload Button */}
          {videoUrl ? (
            <div className="relative">
              <video
                src={videoUrl}
                controls
                className="w-full rounded-lg"
                style={{ maxHeight: '380px' }}
              />

              <button
                type="button"
                onClick={removeVideo}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <label className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-teal-500">
              <Video className="w-10 h-10 text-gray-400 mb-2" />
              <span className="text-gray-600">Upload Intro Video</span>

              <input
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleUpload}
                disabled={uploading}
              />
            </label>
          )}

          {/* Guidelines */}
          <div className="bg-blue-50 p-4 rounded-lg text-blue-900 text-sm">
            <p className="font-semibold mb-2">Guidelines:</p>
            <ul className="space-y-1">
              <li>• Keep it under 30 seconds</li>
              <li>• Say “Assalamu Alaikum” and introduce yourself</li>
              <li>• Share what you’re looking for in Nikah</li>
              <li>• Dress modestly and speak respectfully</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onBack} className="flex-1">
              Back
            </Button>
            <Button onClick={onSubmit} className="flex-1">
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

import { useEffect, useState } from 'react';
import { X, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { type Media } from '@/types/media';

interface MediaGalleryProps {
  onMediaChange: () => void;
}

export function MediaGallery({ onMediaChange }: MediaGalleryProps) {
  const { user } = useAuth();
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMedia();
  }, [user]);

  const loadMedia = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('media')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMedia(data || []);
    } catch (err) {
      console.error('Error loading media:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteMedia = async (mediaId: string, url: string) => {
    if (!confirm('Delete this media?')) return;

    try {
      const fileName = url.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from('profile-media')
          .remove([`${user!.id}/${fileName}`]);
      }

      const { error } = await supabase
        .from('media')
        .delete()
        .eq('id', mediaId);

      if (error) throw error;

      setMedia(media.filter(m => m.id !== mediaId));
      onMediaChange();
    } catch (err) {
      console.error('Error deleting media:', err);
    }
  };

  const getStatusBadge = (status: Media['status']) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading media...</div>;
  }

  if (media.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No media uploaded yet</p>
        <p className="text-sm mt-2">Upload photos and video to complete your profile</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {media.map((item) => (
        <div key={item.id} className="relative group rounded-lg overflow-hidden border-2 border-gray-200">
          {item.type === 'photo' ? (
            <img
              src={item.url}
              alt="Profile media"
              className="w-full h-48 object-cover"
            />
          ) : (
            <video
              src={item.url}
              className="w-full h-48 object-cover"
              controls
            />
          )}

          <div className="absolute top-2 left-2">
            {getStatusBadge(item.status)}
          </div>

          {item.status === 'rejected' && item.moderation_reason && (
            <div className="absolute bottom-0 left-0 right-0 bg-red-900 bg-opacity-90 text-white text-xs p-2">
              {item.moderation_reason}
            </div>
          )}

          <Button
            size="sm"
            variant="destructive"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => deleteMedia(item.id, item.url)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}

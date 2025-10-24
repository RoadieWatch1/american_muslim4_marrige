import { useState, useRef } from 'react';
import { Upload, X, Image, Video, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { MEDIA_LIMITS, type MediaType } from '@/types/media';

interface MediaUploadProps {
  onUploadComplete: () => void;
  currentPhotos: number;
  currentVideos: number;
}

export function MediaUpload({ onUploadComplete, currentPhotos, currentVideos }: MediaUploadProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canUploadPhotos = currentPhotos < MEDIA_LIMITS.maxPhotos;
  const canUploadVideos = currentVideos < MEDIA_LIMITS.maxVideos;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateFile = (file: File): { valid: boolean; error?: string; type?: MediaType } => {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      return { valid: false, error: 'Only images and videos are allowed' };
    }

    if (isImage && !canUploadPhotos) {
      return { valid: false, error: `Maximum ${MEDIA_LIMITS.maxPhotos} photos allowed` };
    }

    if (isVideo && !canUploadVideos) {
      return { valid: false, error: `Maximum ${MEDIA_LIMITS.maxVideos} video allowed` };
    }

    if (isVideo && file.size > 100 * 1024 * 1024) {
      return { valid: false, error: 'Video must be under 100MB' };
    }

    if (isImage && file.size > 10 * 1024 * 1024) {
      return { valid: false, error: 'Image must be under 10MB' };
    }

    return { valid: true, type: isImage ? 'photo' : 'video' };
  };

  const uploadFile = async (file: File) => {
    if (!user) return;

    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error!);
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('profile-media')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-media')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from('media')
        .insert({
          user_id: user.id,
          type: validation.type,
          url: publicUrl,
          status: 'pending',
        });

      if (dbError) throw dbError;

      onUploadComplete();
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      await uploadFile(file);
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      await uploadFile(file);
    }
  };

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive ? 'border-teal-600 bg-teal-50' : 'border-gray-300 hover:border-teal-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleChange}
          className="hidden"
        />
        
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold mb-2">Upload Photos & Video</h3>
        <p className="text-sm text-gray-600 mb-4">
          Drag and drop or click to select files
        </p>
        
        <Button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || (!canUploadPhotos && !canUploadVideos)}
        >
          {uploading ? 'Uploading...' : 'Select Files'}
        </Button>

        <div className="mt-4 text-xs text-gray-500 space-y-1">
          <p className="flex items-center justify-center gap-2">
            <Image className="w-4 h-4" />
            Photos: {currentPhotos}/{MEDIA_LIMITS.maxPhotos}
          </p>
          <p className="flex items-center justify-center gap-2">
            <Video className="w-4 h-4" />
            Video: {currentVideos}/{MEDIA_LIMITS.maxVideos} (max 60s)
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
}

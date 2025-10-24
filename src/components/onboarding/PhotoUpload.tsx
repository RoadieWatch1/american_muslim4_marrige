import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, X, Upload, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface PhotoUploadProps {
  onSubmit: (photos: string[]) => void;
  onBack: () => void;
}

export const PhotoUpload: React.FC<PhotoUploadProps> = ({ onSubmit, onBack }) => {
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;

    setUploading(true);
    setError('');

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        if (!file.type.startsWith('image/')) {
          throw new Error('Please select only image files');
        }

        if (file.size > 5 * 1024 * 1024) {
          throw new Error('Image size should be less than 5MB');
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError, data } = await supabase.storage
          .from('profile-photos')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('profile-photos')
          .getPublicUrl(fileName);

        return publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setPhotos([...photos, ...uploadedUrls].slice(0, 6));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (photos.length < 2) {
      setError('Please upload at least 2 photos');
      return;
    }
    onSubmit(photos);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Add Your Photos</CardTitle>
          <p className="text-gray-600">Upload 2-6 photos that best represent you</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-3 gap-4">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="aspect-square relative">
                {photos[index] ? (
                  <div className="relative w-full h-full">
                    <img
                      src={photos[index]}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="w-full h-full border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-teal-500 transition-colors">
                    <Camera className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-xs text-gray-500">Add Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleFileSelect}
                      disabled={uploading || photos.length >= 6}
                    />
                  </label>
                )}
              </div>
            ))}
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Photo Guidelines:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Use recent photos (within the last year)</li>
              <li>• Show your face clearly in at least one photo</li>
              <li>• Dress modestly according to Islamic guidelines</li>
              <li>• Avoid group photos as your main photo</li>
              <li>• No filters that significantly alter appearance</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onBack} className="flex-1">
              Back
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={photos.length < 2 || uploading}
              className="flex-1"
            >
              {uploading ? (
                <>
                  <Upload className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Continue'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
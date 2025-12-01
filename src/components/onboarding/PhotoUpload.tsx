/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Camera, X, Upload, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface PhotoUploadProps {
  onSubmit: (photos: string[]) => void;
  onBack: () => void;
}

type PhotoItem = {
  id: string;
  url: string;
  is_primary?: boolean;
};

export const PhotoUpload: React.FC<PhotoUploadProps> = ({
  onSubmit,
  onBack,
}) => {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  // Helper: derive storage path from URL
  const extractPathFromUrl = (url: string): string | null => {
    const marker = '/profile-media/';
    const idx = url.indexOf(marker);
    if (idx === -1) return null;
    return url.substring(idx + marker.length);
  };

  // 🔹 Load existing photos (including primary) on mount
  useEffect(() => {
    if (!user) return;

    (async () => {
      setLoadingExisting(true);
      setError('');

      const { data, error } = await supabase
        .from('media')
        .select('id, url, is_primary')
        .eq('user_id', user.id)
        .eq('type', 'photo')
        .in('status', ['pending', 'approved'])
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading existing photos', error);
        setError('Could not load your existing photos. Please try again.');
      } else if (data) {
        const items: PhotoItem[] = data.map((row: any) => ({
          id: row.id,
          url: row.url,
          is_primary: row.is_primary,
        }));
        setPhotos(items.slice(0, 6));
      }

      setLoadingExisting(false);
    })();
  }, [user]);

  // 🔹 Mark a specific photo as primary
  const setPrimaryPhoto = async (mediaId: string) => {
    if (!user) return;

    try {
      // 1. Unset existing primary
      await supabase
        .from('media')
        .update({ is_primary: false })
        .eq('user_id', user.id)
        .eq('type', 'photo')
        .eq('is_primary', true);

      // 2. Set new primary
      await supabase
        .from('media')
        .update({ is_primary: true })
        .eq('id', mediaId);

      // 3. Update profile.profile_photo_id
      await supabase
        .from('profiles')
        .update({ profile_photo_id: mediaId })
        .eq('id', user.id);

      // 4. Update frontend
      setPhotos((prev) =>
        prev.map((p) =>
          p.id === mediaId
            ? { ...p, is_primary: true }
            : { ...p, is_primary: false }
        )
      );
    } catch (err) {
      console.error('Error setting primary photo:', err);
    }
  };

  // 🔹 Upload photos
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

        const ext = file.name.split('.').pop();
        const storagePath = `${user.id}/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${ext}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('profile-media')
          .upload(storagePath, file);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from('profile-media').getPublicUrl(storagePath);

        // Insert into media
        const { data: inserted, error: dbError } = await supabase
          .from('media')
          .insert({
            user_id: user.id,
            type: 'photo',
            url: publicUrl,
            is_primary: false, // temporary
            status: 'approved',
          })
          .select('id, url, is_primary')
          .maybeSingle();

        if (dbError) throw dbError;

        return {
          id: inserted.id,
          url: inserted.url,
          is_primary: inserted.is_primary,
        } as PhotoItem;
      });

      const uploaded = await Promise.all(uploadPromises);

      let updatedList = [...photos, ...uploaded].slice(0, 6);
      setPhotos(updatedList);

      // ⭐ AUTO-SET FIRST PHOTO AS PRIMARY
      const hasPrimary = updatedList.some((p) => p.is_primary);

      if (!hasPrimary && updatedList.length > 0) {
        const firstPhoto = updatedList[0];
        await setPrimaryPhoto(firstPhoto.id);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // 🔹 Remove photo
  const removePhoto = async (index: number) => {
    if (!user) return;

    const photo = photos[index];
    if (!photo) return;
    setError('');

    try {
      const path = extractPathFromUrl(photo.url);
      if (path) {
        await supabase.storage.from('profile-media').remove([path]);
      }

      await supabase.from('media').delete().eq('id', photo.id);

      // Remove from UI
      const newList = photos.filter((_, i) => i !== index);
      setPhotos(newList);

      // If primary was deleted → pick new primary
      if (photo.is_primary && newList.length > 0) {
        await setPrimaryPhoto(newList[0].id);
      }

      // If no photos left → clear profile.profile_photo_id
      if (newList.length === 0) {
        await supabase
          .from('profiles')
          .update({ profile_photo_id: null })
          .eq('id', user.id);
      }
    } catch (err: any) {
      console.error('Error removing photo', err);
      setError(err.message || 'Could not remove photo.');
    }
  };

  const handleSubmit = () => {
    if (photos.length < 2) {
      setError('Please upload at least 2 photos');
      return;
    }
    onSubmit(photos.map((p) => p.url));
  };

  const isContinueDisabled = photos.length < 2 || uploading || loadingExisting;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Add Your Photos</CardTitle>
          <p className="text-gray-600">
            Upload 2–6 photos that best represent you
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-3 gap-4">
            {photos.map((p, index) => (
              <div key={p.id} className="relative aspect-square">
                <img
                  src={p.url}
                  className={`w-full h-full object-cover rounded-lg ${
                    p.is_primary ? 'ring-4 ring-teal-500' : ''
                  }`}
                />

                {/* Remove */}
                <button
                  onClick={() => removePhoto(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Set Primary */}
                {!p.is_primary && (
                  <button
                    onClick={() => setPrimaryPhoto(p.id)}
                    className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded"
                  >
                    Set as Main
                  </button>
                )}
              </div>
            ))}

            {/* Empty slots */}
            {[...Array(6 - photos.length)].map((_, i) => (
              <label
                key={i}
                className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-teal-500"
              >
                <Camera className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-xs text-gray-500">
                  {loadingExisting ? 'Loading...' : 'Add Photo'}
                </span>
                {!loadingExisting && (
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                    disabled={uploading}
                  />
                )}
              </label>
            ))}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onBack} className="flex-1">
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isContinueDisabled}
              className="flex-1"
            >
              {uploading ? (
                <>
                  <Upload className="w-4 h-4 mr-2 animate-spin" /> Uploading...
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

// /* eslint-disable @typescript-eslint/no-explicit-any */
// import React, { useEffect, useState } from 'react';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/Button';
// import { Camera, X, Upload, AlertCircle } from 'lucide-react';
// import { Alert, AlertDescription } from '@/components/ui/alert';
// import { supabase } from '@/lib/supabase';
// import { useAuth } from '@/contexts/AuthContext';

// interface PhotoUploadProps {
//   onSubmit: (photos: string[]) => void;
//   onBack: () => void;
// }

// type PhotoItem = {
//   id?: string;
//   url: string;
// };

// export const PhotoUpload: React.FC<PhotoUploadProps> = ({
//   onSubmit,
//   onBack,
// }) => {
//   const [photos, setPhotos] = useState<PhotoItem[]>([]);
//   const [uploading, setUploading] = useState(false);
//   const [loadingExisting, setLoadingExisting] = useState(true);
//   const [error, setError] = useState('');
//   const { user } = useAuth();

//   // Helper: from public URL → storage object path (after /profile-media/)
//   const extractPathFromUrl = (url: string): string | null => {
//     const marker = '/profile-media/';
//     const idx = url.indexOf(marker);
//     if (idx === -1) return null;
//     return url.substring(idx + marker.length);
//   };

//   // 🔹 Load existing photos from media table on mount
//   useEffect(() => {
//     if (!user) return;

//     (async () => {
//       setLoadingExisting(true);
//       setError('');

//       const { data, error } = await supabase
//         .from('media')
//         .select('id, url')
//         .eq('user_id', user.id)
//         .eq('type', 'photo')
//         .in('status', ['pending', 'approved'])
//         .order('created_at', { ascending: true });

//       if (error) {
//         console.error('Error loading existing photos', error);
//         setError('Could not load your existing photos. Please try again.');
//       } else if (data) {
//         const items: PhotoItem[] = data
//           .filter((row: any) => !!row.url)
//           .map((row: any) => ({
//             id: row.id,
//             url: row.url,
//           }));
//         setPhotos(items.slice(0, 6));
//       }

//       setLoadingExisting(false);
//     })();
//   }, [user]);

//   const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const files = e.target.files;
//     if (!files || !user) return;

//     setUploading(true);
//     setError('');

//     try {
//       const uploadPromises = Array.from(files).map(async (file) => {
//         if (!file.type.startsWith('image/')) {
//           throw new Error('Please select only image files');
//         }

//         if (file.size > 5 * 1024 * 1024) {
//           throw new Error('Image size should be less than 5MB');
//         }

//         const fileExt = file.name.split('.').pop();
//         const storagePath = `${user.id}/${Date.now()}-${Math.random()
//           .toString(36)
//           .slice(2)}.${fileExt}`;

//         // ✅ upload to profile-media bucket
//         const { error: uploadError } = await supabase.storage
//           .from('profile-media')
//           .upload(storagePath, file);

//         if (uploadError) throw uploadError;

//         const {
//           data: { publicUrl },
//         } = supabase.storage.from('profile-media').getPublicUrl(storagePath);

//         // ✅ record in media table
//         const { data: inserted, error: dbError } = await supabase
//           .from('media')
//           .insert({
//             user_id: user.id,
//             type: 'photo',
//             url: publicUrl,
//             status: 'approved', // or 'pending' if you have moderation
//           })
//           .select('id, url')
//           .maybeSingle();

//         if (dbError) throw dbError;

//         const item: PhotoItem = {
//           id: inserted?.id,
//           url: inserted?.url ?? publicUrl,
//         };

//         return item;
//       });

//       const uploadedItems = await Promise.all(uploadPromises);
//       setPhotos((prev) => [...prev, ...uploadedItems].slice(0, 6));
//     } catch (err: any) {
//       console.error(err);
//       setError(err.message || 'Upload failed');
//     } finally {
//       setUploading(false);
//       // reset input so same file can be selected again if needed
//       e.target.value = '';
//     }
//   };

//   const removePhoto = async (index: number) => {
//     if (!user) return;

//     const photo = photos[index];
//     if (!photo) return;

//     setError('');

//     try {
//       // 1) Remove from Storage (derive path from URL)
//       const path = extractPathFromUrl(photo.url);
//       if (path) {
//         const { error: storageError } = await supabase.storage
//           .from('profile-media')
//           .remove([path]);
//         if (storageError) throw storageError;
//       }

//       // 2) Remove from media table
//       if (photo.id) {
//         const { error: dbError } = await supabase
//           .from('media')
//           .delete()
//           .eq('id', photo.id);
//         if (dbError) throw dbError;
//       } else {
//         // Fallback: delete by URL if we don't have id
//         const { error: dbError } = await supabase
//           .from('media')
//           .delete()
//           .eq('user_id', user.id)
//           .eq('url', photo.url);
//         if (dbError) throw dbError;
//       }

//       // 3) Update local state
//       setPhotos((prev) => prev.filter((_, i) => i !== index));
//     } catch (err: any) {
//       console.error('Error removing photo', err);
//       setError(err.message || 'Could not remove this photo. Please try again.');
//     }
//   };

//   const handleSubmit = () => {
//     if (photos.length < 2) {
//       setError('Please upload at least 2 photos');
//       return;
//     }
//     // Only send URLs back to the parent, like before
//     onSubmit(photos.map((p) => p.url));
//   };

//   const isContinueDisabled = photos.length < 2 || uploading || loadingExisting;

//   return (
//     <div className="max-w-2xl mx-auto p-6">
//       <Card>
//         <CardHeader>
//           <CardTitle className="text-2xl">Add Your Photos</CardTitle>
//           <p className="text-gray-600">
//             Upload 2-6 photos that best represent you
//           </p>
//         </CardHeader>
//         <CardContent className="space-y-6">
//           {error && (
//             <Alert variant="destructive">
//               <AlertCircle className="h-4 w-4" />
//               <AlertDescription>{error}</AlertDescription>
//             </Alert>
//           )}

//           <div className="grid grid-cols-3 gap-4">
//             {[...Array(6)].map((_, index) => (
//               <div key={index} className="aspect-square relative">
//                 {photos[index] ? (
//                   <div className="relative w-full h-full">
//                     <img
//                       src={photos[index].url}
//                       alt={`Photo ${index + 1}`}
//                       className="w-full h-full object-cover rounded-lg"
//                     />
//                     <button
//                       type="button"
//                       onClick={() => void removePhoto(index)}
//                       className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
//                     >
//                       <X className="w-4 h-4" />
//                     </button>
//                   </div>
//                 ) : (
//                   <label className="w-full h-full border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-teal-500 transition-colors">
//                     <Camera className="w-8 h-8 text-gray-400 mb-2" />
//                     <span className="text-xs text-gray-500">
//                       {loadingExisting ? 'Loading...' : 'Add Photo'}
//                     </span>
//                     {!loadingExisting && (
//                       <input
//                         type="file"
//                         accept="image/*"
//                         multiple
//                         className="hidden"
//                         onChange={handleFileSelect}
//                         disabled={uploading || photos.length >= 6}
//                       />
//                     )}
//                   </label>
//                 )}
//               </div>
//             ))}
//           </div>

//           <div className="bg-blue-50 p-4 rounded-lg">
//             <h4 className="font-semibold text-blue-900 mb-2">
//               Photo Guidelines:
//             </h4>
//             <ul className="text-sm text-blue-800 space-y-1">
//               <li>• Use recent photos (within the last year)</li>
//               <li>• Show your face clearly in at least one photo</li>
//               <li>• Dress modestly according to Islamic guidelines</li>
//               <li>• Avoid group photos as your main photo</li>
//               <li>• No filters that significantly alter appearance</li>
//             </ul>
//           </div>

//           <div className="flex gap-3">
//             <Button variant="outline" onClick={onBack} className="flex-1">
//               Back
//             </Button>
//             <Button
//               onClick={handleSubmit}
//               disabled={isContinueDisabled}
//               className="flex-1"
//             >
//               {uploading ? (
//                 <>
//                   <Upload className="w-4 h-4 mr-2 animate-spin" />
//                   Uploading...
//                 </>
//               ) : (
//                 'Continue'
//               )}
//             </Button>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

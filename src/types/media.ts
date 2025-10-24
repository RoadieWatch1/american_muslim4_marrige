export type MediaType = 'photo' | 'video';
export type MediaStatus = 'pending' | 'approved' | 'rejected';

export interface Media {
  id: string;
  user_id: string;
  type: MediaType;
  url: string;
  status: MediaStatus;
  moderation_reason?: string;
  created_at: string;
}

export interface MediaUploadLimits {
  maxPhotos: number;
  maxVideos: number;
  maxVideoSeconds: number;
}

export const MEDIA_LIMITS: MediaUploadLimits = {
  maxPhotos: 6,
  maxVideos: 1,
  maxVideoSeconds: 60,
};

export type UserRole = 'member' | 'wali' | 'moderator' | 'admin';
export type Gender = 'male' | 'female';
export type PracticeLevel = 'learning' | 'moderate' | 'practicing' | 'very_practicing';
export type PrayerFrequency = 'rare' | 'sometimes' | 'mostly' | 'always';
export type MaritalStatus = 'single' | 'divorced' | 'widowed';
export type NikahTimeline = 'asap' | '3-6mo' | '6-12mo' | '>12mo';
export type MatchStatus = 'pending_wali' | 'active' | 'ended';

export interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: Gender;
  city: string;
  state: string;
  denomination?: string;
  practiceLevel: PracticeLevel;
  prayerRegular: PrayerFrequency;
  maritalStatus: MaritalStatus;
  hasChildren: boolean;
  occupation?: string;
  bio: string;
  nikahTimeline: NikahTimeline;
  waliRequired: boolean;
  verified: boolean;
  photos: string[];
  languages: string[];
}

export interface Match {
  id: string;
  profile: Profile;
  status: MatchStatus;
  matchedAt: Date;
  waliApproved?: boolean;
}


export type SwipeAction = 'like' | 'pass' | 'super_intro';

export interface Like {
  id: string;
  from_user_id: string;
  to_user_id: string;
  type: SwipeAction;
  created_at: string;
}

export interface IntroRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  wali_id?: string;
  status: 'pending' | 'approved' | 'rejected';
  message?: string;
  created_at: string;
  updated_at: string;
}

export interface DiscoverFilters {
  minAge: number;
  maxAge: number;

  // we keep it for UI now, but we won't send to RPC yet
  locationRadius?: number;

  denomination?: string;
  practiceLevel?: PracticeLevel[];

  // Silver+
  verifiedOnly?: boolean;

  // Gold+
  hasPhoto?: boolean;
  recentlyActive?: boolean;

  // Gold+ (NEW Islamic filters backed by DB columns you added)
  madhab?: string;
  prayerFrequency?: string;      // maps to profiles.prayer_frequency
  mosqueAttendance?: string;     // maps to profiles.mosque_attendance
  halalStrict?: string;          // maps to profiles.halal_strict
}



export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content?: string;
  image_url?: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  match_id: string;
  other_user: Profile;
  last_message?: Message;
  unread_count: number;
  wali_can_view: boolean;
}

export interface TypingIndicator {
  conversation_id: string;
  user_id: string;
  is_typing: boolean;
}

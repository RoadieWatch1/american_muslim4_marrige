export interface WaliLink {
  id: string;
  woman_id: string;
  wali_email: string;
  wali_name: string | null;
  wali_phone: string | null;
  status: 'pending' | 'approved' | 'rejected';
  invited_at: string;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface IntroRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  message: string | null;
  status: 'pending' | 'approved' | 'rejected';
  wali_approved: boolean | null;
  wali_notes: string | null;
  created_at: string;
  updated_at: string;
  requester_profile?: {
    first_name: string;
    last_name: string;
    age: number;
    city: string;
    occupation: string;
  };
}

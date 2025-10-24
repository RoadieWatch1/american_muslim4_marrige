export interface AdvancedSearchFilters {
  // Basic filters
  minAge?: number;
  maxAge?: number;
  gender?: 'male' | 'female';
  
  // Location filters
  location?: string;
  locationRadius?: number; // in km
  city?: string;
  country?: string;
  
  // Education & Career
  educationLevel?: string[];
  careerField?: string[];
  
  // Religious practices
  prayerFrequency?: string[];
  quranMemorization?: string[];
  islamicEducation?: string[];
  wearsHijab?: boolean;
  hasBeard?: boolean;
  
  // Family preferences
  maritalStatus?: string[];
  wantsChildren?: boolean;
  hasChildren?: boolean;
  familyPreference?: string[];
  
  // Lifestyle
  diet?: string[];
  smokingStatus?: string[];
  fitnessLevel?: string[];
  languages?: string[];
  
  // Profile completeness
  hasPhoto?: boolean;
  isVerified?: boolean;
  minProfileCompleteness?: number;
}

export interface SavedSearch {
  id: string;
  userId: string;
  name: string;
  filters: AdvancedSearchFilters;
  notificationEnabled: boolean;
  lastChecked: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchNotification {
  id: string;
  savedSearchId: string;
  userId: string;
  newProfileId: string;
  notifiedAt: Date;
  read: boolean;
  createdAt: Date;
}

export const EDUCATION_LEVELS = [
  'High School',
  'Some College',
  'Bachelor\'s Degree',
  'Master\'s Degree',
  'Doctorate',
  'Professional Degree',
  'Trade School',
  'Self-Taught'
];

export const CAREER_FIELDS = [
  'Technology',
  'Healthcare',
  'Education',
  'Business',
  'Engineering',
  'Arts & Design',
  'Science',
  'Law',
  'Finance',
  'Non-Profit',
  'Government',
  'Retail',
  'Manufacturing',
  'Agriculture',
  'Other'
];

export const PRAYER_FREQUENCIES = [
  '5 times daily',
  'Most prayers',
  'Some prayers',
  'Friday prayers',
  'Working on it'
];

export const QURAN_MEMORIZATION = [
  'Hafiz/Hafiza',
  'Multiple Juz',
  'Several Surahs',
  'Learning',
  'Basic Surahs'
];

export const ISLAMIC_EDUCATION = [
  'Islamic University',
  'Madrasah',
  'Self-Study',
  'Weekend School',
  'Online Courses',
  'Family Teaching'
];

export const FAMILY_PREFERENCES = [
  'Want children soon',
  'Want children later',
  'Open to children',
  'Don\'t want children',
  'Have children'
];

export const LIFESTYLE_CHOICES = {
  diet: ['Halal only', 'Vegetarian', 'Vegan', 'No restrictions'],
  smoking: ['Never', 'Occasionally', 'Regularly', 'Trying to quit'],
  fitness: ['Very active', 'Active', 'Moderate', 'Not active']
};
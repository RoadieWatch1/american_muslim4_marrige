/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RoleSelection } from '@/components/onboarding/RoleSelection';
import { WaliInvitation } from '@/components/onboarding/WaliInvitation';
import { ProfileForm } from '@/components/onboarding/ProfileForm';
import { IslamicPreferences } from '@/components/onboarding/IslamicPreferences';
import { PhoneVerification } from '@/components/onboarding/PhoneVerification';
import { PhotoUpload } from '@/components/onboarding/PhotoUpload';
import { PersonalDetails } from '@/components/onboarding/PersonalDetails';
import { IntroVideoUpload } from '@/components/onboarding/IntroVideoUpload';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Progress } from '@/components/ui/progress';
import { CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/Button';

type WaliInfo = {
  id: string;
  email: string | null;
  phone: string | null;
} | null;

type WaliContinuePayload = {
  email: string;
  phone: string;
  isUpdate?: boolean;
};

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [profileData, setProfileData] = useState<any>({});
  const [waliInfo, setWaliInfo] = useState<WaliInfo>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  // index 1–8 used; index 0 ignored
  const [completedSteps, setCompletedSteps] = useState<boolean[]>(() =>
    Array(9).fill(false)
  );

  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const totalSteps = 8;
  const stepNames = [
    'Gender',
    'Wali',
    'Photos',
    'Intro Video',
    'Profile',
    'Details',
    'Islamic',
    'Verify',
  ];

  // helper: has step 1 been completed in DB? (gender present)
  const hasCompletedStep1 = !!(profileData?.gender || gender);

  // Load existing profile + wali + media once so refresh doesn't lose data
  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        // 1) Wali link
        const { data: waliData, error: waliError } = await supabase
          .from('wali_links')
          .select('id,status,wali_email,wali_phone')
          .eq('ward_user_id', user.id)
          .in('status', ['invited', 'active'])
          .maybeSingle();

        if (waliError && waliError.code !== 'PGRST116') {
          console.error('Error loading wali link', waliError);
        }

        const hasWaliInvite = !!waliData;

        if (waliData) {
          setWaliInfo({
            id: waliData.id,
            email: waliData.wali_email,
            phone: waliData.wali_phone,
          });
        }

        // 2) Profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Error loading profile', profileError);
        }

        // 3) Media photos
        const { data: mediaData, error: mediaError } = await supabase
          .from('media')
          .select('id')
          .eq('user_id', user.id)
          .eq('type', 'photo')
          .in('status', ['pending', 'approved']);

        if (mediaError) {
          console.error('Error loading media photos', mediaError);
        }

        const photoCount = mediaData?.length ?? 0;

        // --- Apply loaded data to state ---
        if (profile) {
          const lifestyle = (profile.lifestyle_choices || {}) as any;

          setProfileData({
            ...profile,
            ...lifestyle, // flatten lifestyle choices into profileData for forms
            languages:
              (profile.languages_spoken &&
                profile.languages_spoken.join(', ')) ||
              '',
          });

          if (profile.gender) {
            setGender(profile.gender as 'male' | 'female');
          }

          if (profile.onboarding_completed) {
            navigate('/dashboard');
            return;
          }
        }

        // --- Completion checks based on DB values ---
        const dbGender = profile?.gender as 'male' | 'female' | null;
        const lifestyle = (profile?.lifestyle_choices || {}) as any;
        const hasIntroVideo = !!profile?.intro_video_id;

        const hasBasicProfile =
          !!profile?.first_name &&
          !!profile?.last_name &&
          !!profile?.dob &&
          !!profile?.city &&
          !!profile?.state &&
          !!profile?.marital_status &&
          !!profile?.bio;

        // ✅ height can be number (old cm) OR string "5' 7"
        const hasHeight =
          (typeof lifestyle.height === 'number' &&
            !Number.isNaN(lifestyle.height)) ||
          (typeof lifestyle.height === 'string' &&
            lifestyle.height.trim() !== '');

        const hasPersonalDetails =
          hasHeight &&
          !!profile?.ethnicity &&
          Array.isArray(profile?.languages_spoken) &&
          profile.languages_spoken.length > 0 &&
          !!lifestyle.personality_traits &&
          !!lifestyle.looking_for &&
          !!lifestyle.family_plans;

        // Islamic step completion: required Islamic fields present
        const hasIslamicPreferences =
          !!profile?.prayer_frequency &&
          !!lifestyle.halal_strict &&
          !!lifestyle.mosque_attendance;

        // --- Decide initial step ---
        let initialStep = 1;

        if (dbGender === 'male') {
          // Brothers skip wali step (start from Photos or later)
          initialStep = 3;
        } else if (dbGender === 'female') {
          // Sisters: wali step unless invite already exists
          initialStep = hasWaliInvite ? 3 : 2;
        }

        // If they already have >= 2 photos, jump at least to Intro Video (step 4)
        if (photoCount >= 2 && initialStep <= 3) {
          initialStep = 4;
        }

        // If profile basics exist, jump to Profile step (5)
        if (hasBasicProfile && photoCount >= 2 && initialStep <= 4) {
          initialStep = 5;
        }

        // If personal details completed, jump to Details step (6)
        if (
          hasPersonalDetails &&
          photoCount >= 2 &&
          hasBasicProfile &&
          initialStep <= 5
        ) {
          initialStep = 6;
        }

        // If Islamic preferences filled, jump to Islamic step (7)
        if (
          hasIslamicPreferences &&
          photoCount >= 2 &&
          hasBasicProfile &&
          hasPersonalDetails &&
          initialStep <= 6
        ) {
          initialStep = 7;
        }

        // 🔹 Initialize completed steps from DB
        const initialCompleted = Array(9).fill(false) as boolean[];

        initialCompleted[1] = !!dbGender;
        // Wali is considered "complete" if user is male (skipped) or a wali invite exists
        initialCompleted[2] = dbGender === 'male' || hasWaliInvite;
        initialCompleted[3] = photoCount >= 2;

        // Step 4 (Intro Video) is optional:
        // - mark complete if they already have a video
        // - OR if they've clearly progressed beyond it (profile filled etc)
        initialCompleted[4] =
          hasIntroVideo ||
          hasBasicProfile ||
          hasPersonalDetails ||
          hasIslamicPreferences;

        // Profile step complete if basics present & photos done
        initialCompleted[5] = hasBasicProfile && initialCompleted[3];

        // Personal details step complete if flags present
        initialCompleted[6] = hasPersonalDetails && initialCompleted[5];

        // Islamic prefs step complete if flags present
        initialCompleted[7] = hasIslamicPreferences && initialCompleted[6];

        // Step 8 completion is effectively when onboarding is done, which happens
        // in completeOnboarding, so we don't set it here.

        setCompletedSteps(initialCompleted);
        setStep(initialStep);
      } finally {
        setLoadingInitial(false);
      }
    })();
  }, [user, navigate]);

  // Build DB payload from merged profileData
  const buildProfilePayload = (merged: any) => {
    if (!user) return null;
    if (!merged) return null;

    const payload: any = {
      id: user.id,
      email: user.email,
    };

    // Basic identity
    if (merged.gender) payload.gender = merged.gender;
    if (merged.first_name) payload.first_name = merged.first_name;
    if (merged.last_name) payload.last_name = merged.last_name;
    if (merged.dob) payload.dob = merged.dob;
    if (merged.city) payload.city = merged.city;
    if (merged.state) payload.state = merged.state;
    if (merged.country) payload.country = merged.country;

    // Marital / education / work
    if (merged.marital_status) payload.marital_status = merged.marital_status;
    if (typeof merged.has_children === 'boolean')
      payload.has_children = merged.has_children;
    if (merged.education) payload.education = merged.education;
    if (merged.occupation) payload.occupation = merged.occupation;

    // Narrative fields
    if (merged.bio) payload.bio = merged.bio;
    if (merged.ethnicity) payload.ethnicity = merged.ethnicity;

    // Languages: UI keeps a comma-separated string; DB keeps arrays (languages_spoken only)
    if (merged.languages) {
      const arr = String(merged.languages)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      if (arr.length) {
        payload.languages_spoken = arr;
      }
    }

    // Islamic prefs (columns that actually exist)
    if (merged.prayer_frequency)
      payload.prayer_frequency = merged.prayer_frequency;
    if (merged.islamic_education)
      payload.islamic_education = merged.islamic_education;

    // Onboarding flag
    if (merged.onboarding_completed) payload.onboarding_completed = true;

    // Pack all extra fields into lifestyle_choices (jsonb)
    const lifestyle: any = {};

    [
      'height',
      'hobbies',
      'personality_traits',
      'life_goals',
      'dealbreakers',
      'looking_for',
      'family_plans',
      'relocation_willing',
      'quran_reading',
      'fasting_regular',
      'hajj_completed',
      'halal_strict',
      'mosque_attendance',
      'islamic_finance',
      'zakat_regular',
      'convert_revert',
      'madhab',
      'hijab_preference',
      'beard_preference',
    ].forEach((key) => {
      if (
        merged[key] !== undefined &&
        merged[key] !== null &&
        merged[key] !== ''
      ) {
        lifestyle[key] = merged[key];
      }
    });

    if (Object.keys(lifestyle).length > 0) {
      payload.lifestyle_choices = lifestyle;
    }

    return payload;
  };

  // Save one step: merge into state + upsert
  const saveStep = async (partial: any) => {
    if (!user) return;

    const merged = { ...profileData, ...partial };
    setProfileData(merged);

    const payload = buildProfilePayload(merged);
    if (!payload) return;

    const { error } = await supabase.from('profiles').upsert(payload);

    if (error) {
      console.error('Error saving profile step', error);
      toast({
        title: 'Could not save your progress',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Step handlers
  const handleRoleSelect = async (selectedGender: 'male' | 'female') => {
    setGender(selectedGender);
    await saveStep({ gender: selectedGender });

    // mark step 1 complete; if male, wali step is also considered complete
    setCompletedSteps((prev) => {
      const next = [...prev];
      next[1] = true;
      if (selectedGender === 'male') {
        next[2] = true;
      }
      return next;
    });
  };

  const handleWaliContinue = async (waliData?: WaliContinuePayload) => {
    // If data is provided, we're creating/updating a wali link.
    // If not, user chose "Not right now" or just continued with existing info.
    if (waliData && user) {
      try {
        if (waliInfo?.id || waliData.isUpdate) {
          // UPDATE existing wali row
          const { error } = await supabase
            .from('wali_links')
            .update({
              wali_email: waliData.email,
              wali_phone: waliData.phone,
            })
            .eq('id', waliInfo?.id as string);

          if (error) throw error;

          setWaliInfo((prev) =>
            prev
              ? { ...prev, email: waliData.email, phone: waliData.phone }
              : prev
          );
        } else {
          // INSERT new wali row
          const { data, error } = await supabase
            .from('wali_links')
            .insert({
              ward_user_id: user.id,
              wali_email: waliData.email,
              wali_phone: waliData.phone,
            })
            .select()
            .maybeSingle();

          if (error) throw error;

          if (data) {
            setWaliInfo({
              id: data.id,
              email: data.wali_email,
              phone: data.wali_phone,
            });
          }
        }
      } catch (error: any) {
        console.error('Error saving wali info', error);
        toast({
          title: 'Could not save wali info',
          description: error.message ?? 'Something went wrong',
          variant: 'destructive',
        });
      }
    }

    // mark wali step complete
    setCompletedSteps((prev) => {
      const next = [...prev];
      next[2] = true;
      return next;
    });

    setStep(3);
  };

  const handlePhotoUpload = (photos: string[]) => {
    // Photos already stored in storage + media table in PhotoUpload
    setProfileData((prev: any) => ({ ...prev, photos }));

    // they can't leave the screen without >=2 photos
    setCompletedSteps((prev) => {
      const next = [...prev];
      next[3] = photos.length >= 2;
      return next;
    });

    setStep(4); // go to Intro Video
  };

  const handleProfileSubmit = async (data: any) => {
    await saveStep(data);

    setCompletedSteps((prev) => {
      const next = [...prev];
      next[5] = true; // Profile step
      return next;
    });

    setStep(6);
  };

  const handlePersonalDetailsSubmit = async (data: any) => {
    await saveStep(data);

    setCompletedSteps((prev) => {
      const next = [...prev];
      next[6] = true; // Details step
      return next;
    });

    setStep(7);
  };

  const handlePreferencesSubmit = async (data: any) => {
    await saveStep(data);

    setCompletedSteps((prev) => {
      const next = [...prev];
      next[7] = true; // Islamic step
      return next;
    });

    setStep(8);
  };

  const completeOnboarding = async () => {
    await saveStep({ onboarding_completed: true });
    await refreshProfile();

    setCompletedSteps((prev) => {
      const next = [...prev];
      next[8] = true; // Verify step
      return next;
    });

    navigate('/dashboard');
  };

  const handlePhoneVerified = async () => {
    await completeOnboarding();
  };

  const handlePhoneSkip = async () => {
    await completeOnboarding();
  };

  const goBack = () => {
    if (step === 3 && gender === 'male') {
      setStep(1);
    } else {
      setStep(step - 1);
    }
  };

  // Next handler used for step 2 "Next" from nav bar
  const handleGenericNext = () => {
    if (step === 2) {
      setStep(3);
    }
  };

  // Generic Next for step 1 + 2 nav
  const handleNavNext = () => {
    if (!hasCompletedStep1) return;

    if (step === 1) {
      const effectiveGender = (gender || profileData.gender) as
        | 'male'
        | 'female';

      if (effectiveGender === 'male') {
        // skip wali step
        setStep(3);
      } else {
        setStep(2);
      }
    } else if (step === 2) {
      handleGenericNext();
    }
  };

  const handleNavBack = () => {
    if (step === 1) return;
    if (step === 2) {
      setStep(1);
    }
  };

  const canClickStep = (targetStep: number) => {
    if (targetStep === step) return true; // current step - always allowed (no-op)
    return completedSteps[targetStep]; // only completed steps can be jumped to
  };

  if (loadingInitial) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-blue-50">
        <p className="text-gray-600">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h1 className="text-3xl font-bold text-center mb-2">
              Complete Your Profile
            </h1>
            <p className="text-center text-gray-600 mb-6">
              Help us find your perfect match by completing these steps
            </p>

            <Progress value={(step / totalSteps) * 100} className="h-3 mb-4" />

            <div className="flex justify-between items-center">
              {stepNames.map((name, index) => {
                const stepIndex = index + 1;
                const isCompleted = completedSteps[stepIndex];
                const isCurrent = step === stepIndex;
                const isClickable = canClickStep(stepIndex);

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      if (isClickable) setStep(stepIndex);
                    }}
                    className={`flex flex-col items-center focus:outline-none ${
                      isClickable
                        ? 'cursor-pointer'
                        : 'cursor-not-allowed opacity-60'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isCurrent
                          ? 'bg-teal-600 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <span className="text-sm font-semibold">
                          {stepIndex}
                        </span>
                      )}
                    </div>
                    <span className="text-xs mt-1">{name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="text-center mb-4">
            <p className="text-sm text-gray-600">
              Step {step} of {totalSteps}: {stepNames[step - 1]}
            </p>
          </div>
        </div>

        {/* STEP CONTENT */}
        {step === 1 && (
          <RoleSelection
            selectedGender={profileData.gender}
            onSelect={handleRoleSelect}
          />
        )}
        {step === 2 && (
          <WaliInvitation
            onContinue={handleWaliContinue}
            existingWali={
              waliInfo ? { email: waliInfo.email, phone: waliInfo.phone } : null
            }
          />
        )}
        {step === 3 && (
          <PhotoUpload onSubmit={handlePhotoUpload} onBack={goBack} />
        )}
        {step === 4 && (
          <IntroVideoUpload
            onSubmit={() => setStep(5)}
            onBack={() => setStep(3)}
          />
        )}
        {step === 5 && gender && (
          <ProfileForm
            gender={gender}
            onSubmit={handleProfileSubmit}
            onBack={goBack}
            initialData={profileData}
          />
        )}
        {step === 6 && (
          <PersonalDetails
            onSubmit={handlePersonalDetailsSubmit}
            onBack={goBack}
            initialData={profileData}
          />
        )}
        {step === 7 && (
          <IslamicPreferences
            onSubmit={handlePreferencesSubmit}
            onBack={goBack}
            initialData={profileData}
          />
        )}
        {step === 8 && (
          <PhoneVerification
            onVerified={handlePhoneVerified}
            onSkip={handlePhoneSkip}
            onBack={goBack}
          />
        )}

        {/* NAVIGATION BAR FOR STEPS 1 & 2 */}
        {(step === 1 || step === 2) && (
          <div className="mt-8 flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleNavBack}
              disabled={step === 1}
            >
              Back
            </Button>
            <Button
              type="button"
              onClick={handleNavNext}
              disabled={!hasCompletedStep1}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from 'react';
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
  inviteToken: string | null;
} | null;

type WaliContinuePayload = {
  email: string;
  phone: string;
  isUpdate?: boolean;
};

type ProfileRow = any;
type WaliLinkRow = {
  id: string;
  status: string;
  wali_email: string | null;
  wali_phone: string | null;
  invite_token: string | null;
} | null;

// ✅ Code-only flag (no env needed). Flip to true later when Twilio is ready.
const PHONE_VERIFICATION_ENABLED = false;

const ALL_STEP_NAMES = [
  'Gender',
  'Wali',
  'Photos',
  'Intro Video',
  'Profile',
  'Details',
  'Islamic',
  'Verify',
] as const;

const STEP_NAMES = (PHONE_VERIFICATION_ENABLED
  ? ALL_STEP_NAMES
  : ALL_STEP_NAMES.slice(0, 7)) as readonly string[];

const TOTAL_STEPS = STEP_NAMES.length; // 7 when disabled, 8 when enabled

function computeHasBasicProfile(profile: ProfileRow | null) {
  return (
    !!profile?.first_name &&
    !!profile?.last_name &&
    !!profile?.dob &&
    !!profile?.city &&
    !!profile?.state &&
    !!profile?.marital_status &&
    !!profile?.nikah_timeline &&
    !!profile?.bio
  );
}

function computeHasHeight(lifestyle: any) {
  return (
    (typeof lifestyle?.height === 'number' && !Number.isNaN(lifestyle.height)) ||
    (typeof lifestyle?.height === 'string' && lifestyle.height.trim() !== '')
  );
}

function computeHasPersonalDetails(profile: ProfileRow | null, lifestyle: any) {
  const hasHeight = computeHasHeight(lifestyle);

  return (
    hasHeight &&
    !!profile?.ethnicity &&
    Array.isArray(profile?.languages_spoken) &&
    profile.languages_spoken.length > 0 &&
    !!lifestyle?.personality_traits &&
    !!lifestyle?.looking_for &&
    !!lifestyle?.family_plans
  );
}

function computeHasIslamicPreferences(profile: ProfileRow | null, lifestyle: any) {
  return (
    !!profile?.prayer_frequency &&
    !!lifestyle?.halal_strict &&
    !!lifestyle?.mosque_attendance
  );
}

function buildCompletedStepsFromDb(args: {
  dbGender: 'male' | 'female' | null;
  hasWaliInvite: boolean;
  photoCount: number;
  hasIntroVideo: boolean;
  hasBasicProfile: boolean;
  hasPersonalDetails: boolean;
  hasIslamicPreferences: boolean;
}) {
  const {
    dbGender,
    hasWaliInvite,
    photoCount,
    hasIntroVideo,
    hasBasicProfile,
    hasPersonalDetails,
    hasIslamicPreferences,
  } = args;

  const completed = Array(9).fill(false) as boolean[];

  completed[1] = !!dbGender;

  // wali step: complete if male (skipped) OR wali invite exists
  completed[2] = dbGender === 'male' || hasWaliInvite;

  // photos: require >= 2
  completed[3] = photoCount >= 2;

  // intro video: optional
  completed[4] =
    hasIntroVideo || hasBasicProfile || hasPersonalDetails || hasIslamicPreferences;

  // profile step: basics + photos
  completed[5] = hasBasicProfile && completed[3];

  // details step
  completed[6] = hasPersonalDetails && completed[5];

  // islamic step
  completed[7] = hasIslamicPreferences && completed[6];

  return completed;
}

function computeInitialStep(args: {
  dbGender: 'male' | 'female' | null;
  hasWaliInvite: boolean;
  photoCount: number;
  hasBasicProfile: boolean;
  hasPersonalDetails: boolean;
  hasIslamicPreferences: boolean;
}) {
  const {
    dbGender,
    hasWaliInvite,
    photoCount,
    hasBasicProfile,
    hasPersonalDetails,
    hasIslamicPreferences,
  } = args;

  let s = 1;

  if (dbGender === 'male') {
    s = 3; // skip wali
  } else if (dbGender === 'female') {
    s = hasWaliInvite ? 3 : 2;
  }

  if (photoCount >= 2 && s <= 3) s = 4;
  if (hasBasicProfile && photoCount >= 2 && s <= 4) s = 5;
  if (hasPersonalDetails && photoCount >= 2 && hasBasicProfile && s <= 5) s = 6;
  if (
    hasIslamicPreferences &&
    photoCount >= 2 &&
    hasBasicProfile &&
    hasPersonalDetails &&
    s <= 6
  )
    s = 7;

  return s;
}

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

  const hasCompletedStep1 = useMemo(
    () => !!(profileData?.gender || gender),
    [profileData?.gender, gender]
  );

  // ─────────────────────────────────────────────────────────────
  // Initial Load (profile + wali + photos) and derive step state
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        // 1) wali link
        const { data: waliData, error: waliError } = await supabase
          .from('wali_links')
          .select('id,status,wali_email,wali_phone,invite_token')
          .eq('ward_user_id', user.id)
          .in('status', ['invited', 'active'])
          .maybeSingle<WaliLinkRow>();

        if (waliError && (waliError as any).code !== 'PGRST116') {
          console.error('Error loading wali link', waliError);
        }

        const hasWaliInvite = !!waliData;

        if (waliData) {
          setWaliInfo({
            id: waliData.id,
            email: waliData.wali_email,
            phone: waliData.wali_phone,
            inviteToken: waliData.invite_token ?? null,
          });
        }

        // 2) profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle<ProfileRow>();

        if (profileError) {
          console.error('Error loading profile', profileError);
        }

        // ✅ Wali users should never see onboarding
        const dbRole = (profile?.role ?? '').toString().toLowerCase();
        if (dbRole === 'wali') {
          navigate('/dashboard', { replace: true });
          return;
        }

        if (profile?.onboarding_completed) {
          navigate('/dashboard', { replace: true });
          return;
        }

        // 3) photos count
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

        // apply to local state
        if (profile) {
          const lifestyle = (profile.lifestyle_choices || {}) as any;

          setProfileData({
            ...profile,
            ...lifestyle,
            languages:
              (profile.languages_spoken && profile.languages_spoken.join(', ')) || '',
          });

          if (profile.gender) setGender(profile.gender as 'male' | 'female');
        }

        // derive completion + step
        const dbGender = (profile?.gender as 'male' | 'female' | null) ?? null;
        const lifestyle = (profile?.lifestyle_choices || {}) as any;

        const hasIntroVideo = !!profile?.intro_video_id;
        const hasBasicProfile = computeHasBasicProfile(profile);
        const hasPersonalDetails = computeHasPersonalDetails(profile, lifestyle);
        const hasIslamicPreferences = computeHasIslamicPreferences(profile, lifestyle);

        const initialCompleted = buildCompletedStepsFromDb({
          dbGender,
          hasWaliInvite,
          photoCount,
          hasIntroVideo,
          hasBasicProfile,
          hasPersonalDetails,
          hasIslamicPreferences,
        });

        let initialStep = computeInitialStep({
          dbGender,
          hasWaliInvite,
          photoCount,
          hasBasicProfile,
          hasPersonalDetails,
          hasIslamicPreferences,
        });

        // ✅ if steps 1–7 complete:
        const allPreVerifyComplete = initialCompleted.slice(1, 8).every(Boolean);

        if (!PHONE_VERIFICATION_ENABLED) {
          // auto-complete onboarding and go dashboard (no SMS)
          if (allPreVerifyComplete) {
            await supabase
              .from('profiles')
              .update({ onboarding_completed: true })
              .eq('id', user.id);

            navigate('/dashboard');
            return;
          }

          // never land on step 8 when disabled
          if (initialStep > 7) initialStep = 7;
        } else {
          // old behavior: show step 8 on refresh
          if (allPreVerifyComplete && initialStep < 8) {
            initialStep = 8;
          }
        }

        setCompletedSteps(initialCompleted);
        setStep(initialStep);
      } finally {
        setLoadingInitial(false);
      }
    })();
  }, [user, navigate]);

  // ─────────────────────────────────────────────────────────────
  // Build DB payload from merged profileData
  // ─────────────────────────────────────────────────────────────
  const buildProfilePayload = (merged: any) => {
    if (!user) return null;
    if (!merged) return null;

    const payload: any = {
      id: user.id,
      email: user.email,
    };

    if (merged.gender) payload.gender = merged.gender;
    if (merged.first_name) payload.first_name = merged.first_name;
    if (merged.last_name) payload.last_name = merged.last_name;
    if (merged.dob) payload.dob = merged.dob;

    if (merged.city) payload.city = merged.city;
    if (merged.state) payload.state = merged.state;

    // ✅ default country for US onboarding (optional but helpful)
    if (merged.country) payload.country = merged.country;
    else if (merged.city || merged.state) payload.country = 'USA';

    // ✅ FIX: store lat/lng
    if (merged.latitude !== undefined) payload.latitude = merged.latitude;
    if (merged.longitude !== undefined) payload.longitude = merged.longitude;

    if (merged.marital_status) payload.marital_status = merged.marital_status;

    // ✅ save nikah_timeline
    if (merged.nikah_timeline) payload.nikah_timeline = merged.nikah_timeline;

    if (typeof merged.has_children === 'boolean') payload.has_children = merged.has_children;

    if (merged.education) payload.education = merged.education;
    if (merged.occupation) payload.occupation = merged.occupation;

    if (merged.bio) payload.bio = merged.bio;
    if (merged.ethnicity) payload.ethnicity = merged.ethnicity;

    // ✅ Denomination (Sunni/Shia/Quranic Muslim etc.)
    if (merged.denomination) payload.denomination = merged.denomination;

    // (optional but in your schema)
    if (merged.practice_level) payload.practice_level = merged.practice_level;
    if (merged.prayer_regular) payload.prayer_regular = merged.prayer_regular;

    if (merged.languages) {
      const arr = String(merged.languages)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      if (arr.length) payload.languages_spoken = arr;
    }

    if (merged.prayer_frequency) payload.prayer_frequency = merged.prayer_frequency;
    if (merged.islamic_education) payload.islamic_education = merged.islamic_education;

    if (merged.onboarding_completed) payload.onboarding_completed = true;

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
      if (merged[key] !== undefined && merged[key] !== null && merged[key] !== '') {
        lifestyle[key] = merged[key];
      }
    });

    if (Object.keys(lifestyle).length > 0) {
      payload.lifestyle_choices = lifestyle;
    }

    return payload;
  };


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

  // ─────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────
  const handleRoleSelect = async (selectedGender: 'male' | 'female') => {
    setGender(selectedGender);
    await saveStep({ gender: selectedGender });

    setCompletedSteps((prev) => {
      const next = [...prev];
      next[1] = true;
      if (selectedGender === 'male') next[2] = true; // skip wali step
      return next;
    });
  };

  const handleWaliContinue = async (waliData?: WaliContinuePayload) => {
    if (!waliData) {
      setCompletedSteps((prev) => {
        const next = [...prev];
        next[2] = true;
        return next;
      });
      setStep(3);
      return;
    }

    if (!user) {
      toast({
        title: 'Not signed in',
        description: 'Please sign in again and try inviting your wali.',
        variant: 'destructive',
      });
      return;
    }

    let waliLinkId: string | null = null;

    try {
      if (waliInfo?.id || waliData.isUpdate) {
        const { data, error } = await supabase
          .from('wali_links')
          .update({
            wali_email: waliData.email,
            wali_phone: waliData.phone,
          })
          .eq('id', waliInfo?.id as string)
          .select('id,wali_email,wali_phone,invite_token')
          .maybeSingle();

        if (error) throw error;

        if (data) {
          waliLinkId = data.id;
          setWaliInfo((prev) =>
            prev
              ? {
                ...prev,
                email: data.wali_email,
                phone: data.wali_phone,
                inviteToken: data.invite_token ?? null,
              }
              : {
                id: data.id,
                email: data.wali_email,
                phone: data.wali_phone,
                inviteToken: data.invite_token ?? null,
              }
          );
        }
      } else {
        const { data, error } = await supabase
          .from('wali_links')
          .insert({
            ward_user_id: user.id,
            wali_email: waliData.email,
            wali_phone: waliData.phone,
            status: 'invited',
          })
          .select('id,wali_email,wali_phone,invite_token')
          .maybeSingle();

        if (error) throw error;

        if (data) {
          waliLinkId = data.id;
          setWaliInfo({
            id: data.id,
            email: data.wali_email,
            phone: data.wali_phone,
            inviteToken: data.invite_token ?? null,
          });
        }
      }

      if (waliLinkId) {
        const { error: fnError } = await supabase.functions.invoke('send-wali-invite', {
          body: { wali_link_id: waliLinkId },
        });

        if (fnError) {
          console.error('send-wali-invite error', fnError);
          toast({
            title: 'Wali email not sent',
            description:
              'We saved your wali details but sending the email failed. You can try again later.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Wali invitation sent',
            description: `We have emailed an invitation to ${waliData.email}.`,
          });
        }
      }
    } catch (error: any) {
      console.error('Error saving wali info / sending email', error);
      toast({
        title: 'Could not save wali info',
        description: error?.message ?? 'Something went wrong',
        variant: 'destructive',
      });
    }

    setCompletedSteps((prev) => {
      const next = [...prev];
      next[2] = true;
      return next;
    });

    setStep(3);
  };

  const handlePhotoUpload = (photos: string[]) => {
    setProfileData((prev: any) => ({ ...prev, photos }));

    setCompletedSteps((prev) => {
      const next = [...prev];
      next[3] = photos.length >= 2;
      return next;
    });

    setStep(4);
  };

  const handleProfileSubmit = async (data: any) => {
    await saveStep(data);

    setCompletedSteps((prev) => {
      const next = [...prev];
      next[5] = true;
      return next;
    });

    setStep(6);
  };

  const handlePersonalDetailsSubmit = async (data: any) => {
    await saveStep(data);

    setCompletedSteps((prev) => {
      const next = [...prev];
      next[6] = true;
      return next;
    });

    setStep(7);
  };

  const completeOnboarding = async () => {
    await saveStep({ onboarding_completed: true });
    await refreshProfile();

    setCompletedSteps((prev) => {
      const next = [...prev];
      next[8] = true; // safe even if step 8 is disabled
      return next;
    });

    navigate('/dashboard');
  };

  const handlePreferencesSubmit = async (data: any) => {
    await saveStep(data);

    setCompletedSteps((prev) => {
      const next = [...prev];
      next[7] = true;
      return next;
    });

    // ✅ if phone verification disabled, finish onboarding now
    if (!PHONE_VERIFICATION_ENABLED) {
      await completeOnboarding();
      return;
    }

    setStep(8);
  };

  const handlePhoneVerified = async () => {
    await completeOnboarding();
  };

  const handlePhoneSkip = async () => {
    await completeOnboarding();
  };

  const goBack = () => {
    if (step === 3 && gender === 'male') setStep(1);
    else setStep(step - 1);
  };

  const handleGenericNext = () => {
    if (step === 2) setStep(3);
  };

  const handleNavNext = () => {
    if (!hasCompletedStep1) return;

    if (step === 1) {
      const effectiveGender = (gender || profileData.gender) as 'male' | 'female';
      if (effectiveGender === 'male') setStep(3);
      else setStep(2);
    } else if (step === 2) {
      handleGenericNext();
    }
  };

  const handleNavBack = () => {
    if (step === 1) return;
    if (step === 2) setStep(1);
  };

  const canClickStep = (targetStep: number) => {
    if (targetStep === step) return true;
    return completedSteps[targetStep];
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

            <Progress value={(step / TOTAL_STEPS) * 100} className="h-3 mb-4" />

            <div className="flex justify-between items-center">
              {STEP_NAMES.map((name, index) => {
                const stepIndex = index + 1;
                const isCompleted = completedSteps[stepIndex];
                const isCurrent = step === stepIndex;
                const isClickable = canClickStep(stepIndex);

                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      if (isClickable) setStep(stepIndex);
                    }}
                    className={`flex flex-col items-center focus:outline-none ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                      }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${isCompleted
                          ? 'bg-green-500 text-white'
                          : isCurrent
                            ? 'bg-teal-600 text-white'
                            : 'bg-gray-200 text-gray-500'
                        }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <span className="text-sm font-semibold">{stepIndex}</span>
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
              Step {step} of {TOTAL_STEPS}: {STEP_NAMES[Math.max(0, step - 1)]}
            </p>
          </div>
        </div>

        {/* STEP CONTENT */}
        {step === 1 && (
          <RoleSelection selectedGender={profileData.gender} onSelect={handleRoleSelect} />
        )}

        {step === 2 && (
          <WaliInvitation
            onContinue={handleWaliContinue}
            existingWali={waliInfo ? { email: waliInfo.email, phone: waliInfo.phone } : null}
            inviteUrl={
              waliInfo?.inviteToken && typeof window !== 'undefined'
                ? `${window.location.origin}/wali-invite?token=${waliInfo.inviteToken}`
                : undefined
            }
            onResendInvite={async () => {
              if (!waliInfo?.id) {
                toast({
                  title: 'No invitation found',
                  description: 'Please save wali details first, then try again.',
                  variant: 'destructive',
                });
                return;
              }

              const { error } = await supabase.functions.invoke('send-wali-invite', {
                body: { wali_link_id: waliInfo.id },
              });

              if (error) {
                console.error('Resend wali invite error', error);
                toast({
                  title: 'Could not resend email',
                  description: error.message ?? 'Please try again later.',
                  variant: 'destructive',
                });
              } else {
                toast({
                  title: 'Invitation resent',
                  description: `We’ve resent the wali invitation to ${waliInfo.email}.`,
                });
              }
            }}
          />
        )}

        {step === 3 && <PhotoUpload onSubmit={handlePhotoUpload} onBack={goBack} />}

        {step === 4 && (
          <IntroVideoUpload onSubmit={() => setStep(5)} onBack={() => setStep(3)} />
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

        {/* Step 8 only rendered when enabled */}
        {PHONE_VERIFICATION_ENABLED && step === 8 && (
          <PhoneVerification
            onVerified={handlePhoneVerified}
            onSkip={handlePhoneSkip}
            onBack={goBack}
          />
        )}

        {/* NAVIGATION BAR FOR STEPS 1 & 2 */}
        {(step === 1 || step === 2) && (
          <div className="mt-8 flex justify-between">
            <Button type="button" variant="outline" onClick={handleNavBack} disabled={step === 1}>
              Back
            </Button>
            <Button type="button" onClick={handleNavNext} disabled={!hasCompletedStep1}>
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

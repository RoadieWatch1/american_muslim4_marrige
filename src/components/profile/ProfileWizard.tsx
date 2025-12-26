/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { PhotoUpload } from '@/components/onboarding/PhotoUpload';
import { IntroVideoUpload } from '@/components/onboarding/IntroVideoUpload';
import { ProfileForm } from '@/components/onboarding/ProfileForm';
import { PersonalDetails } from '@/components/onboarding/PersonalDetails';
import { IslamicPreferences } from '@/components/onboarding/IslamicPreferences';

import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

export default function ProfileWizard() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const totalSteps = 5;
  const stepNames = ['Photos', 'Intro Video', 'Profile', 'Details', 'Islamic'];

  const [profileData, setProfileData] = useState<any>({});
  const [completedSteps] = useState<boolean[]>(
    () => Array(totalSteps + 1).fill(true) // all steps clickable in edit mode
  );

  const [loading, setLoading] = useState(true);

  // Fetch profile only ONCE
  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        const { data: p } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (p) {
          const lifestyle = p.lifestyle_choices || {};
          setProfileData({
            ...p,
            ...lifestyle,
            languages: p.languages_spoken?.length
              ? p.languages_spoken.join(', ')
              : '',
          });
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  // Build payload the same way as onboarding
const buildProfilePayload = (merged: any) => {
  if (!user || !merged) return null;

  const payload: any = {};

  // ✅ Basic fields (includes denomination + lat/lng)
  [
    'first_name',
    'last_name',
    'dob',
    'city',
    'state',
    'country',
    'latitude',
    'longitude',
    'marital_status',
    'occupation',
    'education',
    'bio',
    'ethnicity',
    'practice_level',
    'prayer_frequency',
    'nikah_timeline',
    'denomination', // ✅ already here
    'has_children',
  ].forEach((key) => {
    if (merged[key] !== undefined) payload[key] = merged[key];
  });

  // ✅ Languages (safe)
  if (typeof merged.languages === 'string') {
    const arr = merged.languages
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean);

    payload.languages_spoken = arr.length ? arr : null;
  }

  // ✅ Lifestyle choices pack (ONLY include keys that exist)
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
    'halal_strict',
    'mosque_attendance',
    'quran_reading',
    'fasting_regular',
    'hajj_completed',
    'islamic_finance',
    'zakat_regular',
    'madhab',
    'hijab_preference',
    'beard_preference',
    'convert_revert',
    'islamic_education', // ✅ IMPORTANT: you collect this in the form
  ].forEach((key) => {
    if (merged[key] !== undefined && merged[key] !== null && merged[key] !== '') {
      lifestyle[key] = merged[key];
    }
  });

  // ✅ Avoid overwriting lifestyle_choices with empty object
  if (Object.keys(lifestyle).length > 0) {
    payload.lifestyle_choices = lifestyle;
  }

  return payload;
};


  const saveStep = async (partial: any) => {
    const merged = { ...profileData, ...partial };
    setProfileData(merged);

    const payload = buildProfilePayload(merged);
    if (!payload) return;

    const { error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', user!.id);

    if (error) {
      console.error('Save error:', error);
      toast({
        title: 'Error',
        description: 'Could not save your profile.',
        variant: 'destructive',
      });
    } else {
      await refreshProfile();
      toast({ title: 'Saved', description: 'Profile updated successfully!' });
    }
  };

  const goNext = () => setStep((s) => Math.min(s + 1, totalSteps));
  const goBack = () => setStep((s) => Math.max(s - 1, 1));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <div className="flex items-center justify-between mb-4">
            {/* BACK ARROW */}
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center text-teal-700 hover:text-teal-900 transition"
            >
              <ArrowLeft className="w-6 h-6 mr-2" />
              Back
            </button>

            <h1 className="text-2xl font-bold text-center flex-1 text-teal-800">
              Edit Your Profile
            </h1>

            {/* Empty placeholder to balance layout */}
            <div className="w-20" />
          </div>

          <Progress value={(step / totalSteps) * 100} className="h-3 mb-4" />

          {/* Step circles */}
          <div className="flex justify-between">
            {stepNames.map((name, i) => {
              const idx = i + 1;
              const isCurrent = step === idx;

              return (
                <button
                  key={i}
                  className="flex flex-col items-center"
                  onClick={() => setStep(idx)}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isCurrent
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {isCurrent ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <span>{idx}</span>
                    )}
                  </div>
                  <span className="text-xs mt-1">{name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        {step === 1 && (
          <PhotoUpload
            onSubmit={(photos) => {
              setProfileData({ ...profileData, photos });
              goNext();
            }}
            onBack={goBack}
          />
        )}

        {step === 2 && (
          <IntroVideoUpload onSubmit={() => goNext()} onBack={goBack} />
        )}

        {step === 3 && (
          <ProfileForm
            gender={
              profile?.gender === 'male' || profile?.gender === 'female'
                ? profile.gender
                : 'male'
            }
            initialData={profileData}
            onBack={goBack}
            onSubmit={(data) => {
              saveStep(data);
              goNext();
            }}
          />
        )}

        {step === 4 && (
          <PersonalDetails
            initialData={profileData}
            onBack={goBack}
            onSubmit={(data) => {
              saveStep(data);
              goNext();
            }}
          />
        )}

        {step === 5 && (
          <IslamicPreferences
            initialData={profileData}
            onBack={goBack}
            onSubmit={(data) => {
              saveStep(data);
              toast({
                title: 'All steps completed!',
                description: 'Your profile has been updated.',
              });
            }}
          />
        )}
      </div>
    </div>
  );
}




// /* eslint-disable @typescript-eslint/no-explicit-any */
// import React, { useEffect, useState } from 'react';
// import { supabase } from '@/lib/supabase';
// import { useAuth } from '@/contexts/AuthContext';
// import { ArrowLeft } from 'lucide-react';
// import { useNavigate } from 'react-router-dom';

// import { PhotoUpload } from '@/components/onboarding/PhotoUpload';
// import { IntroVideoUpload } from '@/components/onboarding/IntroVideoUpload';
// import { ProfileForm } from '@/components/onboarding/ProfileForm';
// import { PersonalDetails } from '@/components/onboarding/PersonalDetails';
// import { IslamicPreferences } from '@/components/onboarding/IslamicPreferences';

// import { Progress } from '@/components/ui/progress';
// import { CheckCircle } from 'lucide-react';
// import { Button } from '@/components/ui/Button';
// import { useToast } from '@/hooks/use-toast';

// export default function ProfileWizard() {
//   const navigate = useNavigate();
//   const { user, profile, refreshProfile } = useAuth();
//   const { toast } = useToast();

//   const [step, setStep] = useState(1);
//   const totalSteps = 5;
//   const stepNames = ['Photos', 'Intro Video', 'Profile', 'Details', 'Islamic'];

//   const [profileData, setProfileData] = useState<any>({});
//   const [completedSteps, setCompletedSteps] = useState<boolean[]>(
//     () => Array(totalSteps + 1).fill(true) // all steps clickable in edit mode
//   );

//   const [loading, setLoading] = useState(true);

//   // Fetch profile only ONCE
//   useEffect(() => {
//     if (!user) return;

//     (async () => {
//       try {
//         const { data: p } = await supabase
//           .from('profiles')
//           .select('*')
//           .eq('id', user.id)
//           .maybeSingle();

//         if (p) {
//           const lifestyle = p.lifestyle_choices || {};
//           setProfileData({
//             ...p,
//             ...lifestyle,
//             languages: p.languages_spoken?.length
//               ? p.languages_spoken.join(', ')
//               : '',
//           });
//         }
//       } catch (err) {
//         console.error('Error loading profile:', err);
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, [user]);

//   // Build payload the same way as onboarding
//   const buildProfilePayload = (merged: any) => {
//     if (!user || !merged) return null;

//     const payload: any = {};

//     // Basic fields
//     [
//       'first_name',
//       'last_name',
//       'dob',
//       'city',
//       'state',
//       'country',
//       'marital_status',
//       'occupation',
//       'education',
//       'bio',
//       'ethnicity',
//       'practice_level',
//       'prayer_frequency',
//       'nikah_timeline',
//       'denomination',
//       'has_children',
//     ].forEach((key) => {
//       if (merged[key] !== undefined) payload[key] = merged[key];
//     });

//     // Languages
//     if (merged.languages) {
//       payload.languages_spoken = merged.languages
//         .split(',')
//         .map((s: string) => s.trim())
//         .filter(Boolean);
//     }

//     // Lifestyle choices pack
//     const lifestyle: any = {};
//     [
//       'height',
//       'hobbies',
//       'personality_traits',
//       'life_goals',
//       'dealbreakers',
//       'looking_for',
//       'family_plans',
//       'relocation_willing',
//       'halal_strict',
//       'mosque_attendance',
//       'quran_reading',
//       'fasting_regular',
//       'hajj_completed',
//       'islamic_finance',
//       'zakat_regular',
//       'madhab',
//       'hijab_preference',
//       'beard_preference',
//       'convert_revert',
//     ].forEach((key) => {
//       if (merged[key] !== undefined) lifestyle[key] = merged[key];
//     });

//     payload.lifestyle_choices = lifestyle;

//     return payload;
//   };

//   const saveStep = async (partial: any) => {
//     const merged = { ...profileData, ...partial };
//     setProfileData(merged);

//     const payload = buildProfilePayload(merged);
//     if (!payload) return;

//     const { error } = await supabase
//       .from('profiles')
//       .update(payload)
//       .eq('id', user!.id);

//     if (error) {
//       console.error('Save error:', error);
//       toast({
//         title: 'Error',
//         description: 'Could not save your profile.',
//         variant: 'destructive',
//       });
//     } else {
//       await refreshProfile();
//       toast({ title: 'Saved', description: 'Profile updated successfully!' });
//     }
//   };

//   const goNext = () => setStep((s) => Math.min(s + 1, totalSteps));
//   const goBack = () => setStep((s) => Math.max(s - 1, 1));

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         Loading profile...
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 py-10">
//       <div className="max-w-3xl mx-auto">
//         <div className="bg-white p-6 rounded-lg shadow mb-8">
//           <div className="flex items-center justify-between mb-4">
//             {/* BACK ARROW */}
//             <button
//               onClick={() => navigate('/dashboard')}
//               className="flex items-center text-teal-700 hover:text-teal-900 transition"
//             >
//               <ArrowLeft className="w-6 h-6 mr-2" />
//               Back
//             </button>

//             <h1 className="text-2xl font-bold text-center flex-1 text-teal-800">
//               Edit Your Profile
//             </h1>

//             {/* Empty placeholder to balance layout */}
//             <div className="w-20" />
//           </div>

//           <Progress value={(step / totalSteps) * 100} className="h-3 mb-4" />

//           {/* Step circles */}
//           <div className="flex justify-between">
//             {stepNames.map((name, i) => {
//               const idx = i + 1;
//               const isCurrent = step === idx;

//               return (
//                 <button
//                   key={i}
//                   className="flex flex-col items-center"
//                   onClick={() => setStep(idx)}
//                 >
//                   <div
//                     className={`w-10 h-10 rounded-full flex items-center justify-center
//               ${
//                 isCurrent
//                   ? 'bg-teal-600 text-white'
//                   : 'bg-gray-200 text-gray-600'
//               }`}
//                   >
//                     {isCurrent ? (
//                       <CheckCircle className="w-5 h-5" />
//                     ) : (
//                       <span>{idx}</span>
//                     )}
//                   </div>
//                   <span className="text-xs mt-1">{name}</span>
//                 </button>
//               );
//             })}
//           </div>
//         </div>

//         {/* Step Content */}
//         {step === 1 && (
//           <PhotoUpload
//             onSubmit={(photos) => {
//               setProfileData({ ...profileData, photos });
//               goNext();
//             }}
//             onBack={goBack}
//           />
//         )}

//         {step === 2 && (
//           <IntroVideoUpload onSubmit={() => goNext()} onBack={goBack} />
//         )}

//         {step === 3 && (
//           <ProfileForm
//             gender={
//               profile?.gender === 'male' || profile?.gender === 'female'
//                 ? profile.gender
//                 : 'male'
//             }
//             initialData={profileData}
//             onBack={goBack}
//             onSubmit={(data) => {
//               saveStep(data);
//               goNext();
//             }}
//           />
//         )}

//         {step === 4 && (
//           <PersonalDetails
//             initialData={profileData}
//             onBack={goBack}
//             onSubmit={(data) => {
//               saveStep(data);
//               goNext();
//             }}
//           />
//         )}

//         {step === 5 && (
//           <IslamicPreferences
//             initialData={profileData}
//             onBack={goBack}
//             onSubmit={(data) => {
//               saveStep(data);
//               toast({
//                 title: 'All steps completed!',
//                 description: 'Your profile has been updated.',
//               });
//             }}
//           />
//         )}
//       </div>
//     </div>
//   );
// }

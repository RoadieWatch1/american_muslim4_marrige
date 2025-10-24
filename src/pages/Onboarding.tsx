import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RoleSelection } from '@/components/onboarding/RoleSelection';
import { WaliInvitation } from '@/components/onboarding/WaliInvitation';
import { ProfileForm } from '@/components/onboarding/ProfileForm';
import { IslamicPreferences } from '@/components/onboarding/IslamicPreferences';
import { PhoneVerification } from '@/components/onboarding/PhoneVerification';
import { PhotoUpload } from '@/components/onboarding/PhotoUpload';
import { PersonalDetails } from '@/components/onboarding/PersonalDetails';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Progress } from '@/components/ui/progress';
import { CheckCircle } from 'lucide-react';

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [profileData, setProfileData] = useState<any>({});
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const totalSteps = 7;
  const stepNames = [
    'Gender',
    'Wali',
    'Photos',
    'Profile',
    'Details',
    'Islamic',
    'Verify'
  ];

  const handleRoleSelect = (selectedGender: 'male' | 'female') => {
    setGender(selectedGender);
    setProfileData({ ...profileData, gender: selectedGender });
    if (selectedGender === 'male') {
      setStep(3); // Skip wali step for men
    } else {
      setStep(2); // Show wali step for women
    }
  };

  const handleWaliContinue = async (waliData?: { email: string; phone: string }) => {
    if (waliData) {
      await supabase.from('wali_links').insert({
        ward_user_id: user?.id,
        wali_email: waliData.email,
        wali_phone: waliData.phone,
      });
    }
    setStep(3);
  };

  const handlePhotoUpload = (photos: string[]) => {
    setProfileData({ ...profileData, photos });
    setStep(4);
  };

  const handleProfileSubmit = (data: any) => {
    setProfileData({ ...profileData, ...data });
    setStep(5);
  };

  const handlePersonalDetailsSubmit = (data: any) => {
    setProfileData({ ...profileData, ...data });
    setStep(6);
  };

  const handlePreferencesSubmit = (data: any) => {
    setProfileData({ ...profileData, ...data });
    setStep(7);
  };

  const handlePhoneVerified = async () => {
    const finalData = { ...profileData, onboarding_completed: true };
    await supabase.from('profiles').upsert({ id: user?.id, email: user?.email, ...finalData });
    await refreshProfile();
    navigate('/dashboard');
  };

  const handlePhoneSkip = async () => {
    const finalData = { ...profileData, onboarding_completed: true };
    await supabase.from('profiles').upsert({ id: user?.id, email: user?.email, ...finalData });
    await refreshProfile();
    navigate('/dashboard');
  };

  const goBack = () => {
    if (step === 3 && gender === 'male') {
      setStep(1); // Go back to gender selection for men
    } else {
      setStep(step - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h1 className="text-3xl font-bold text-center mb-2">Complete Your Profile</h1>
            <p className="text-center text-gray-600 mb-6">
              Help us find your perfect match by completing these steps
            </p>
            
            <Progress value={(step / totalSteps) * 100} className="h-3 mb-4" />
            
            <div className="flex justify-between items-center">
              {stepNames.map((name, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step > index + 1 
                      ? 'bg-green-500 text-white' 
                      : step === index + 1 
                      ? 'bg-teal-600 text-white' 
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {step > index + 1 ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-semibold">{index + 1}</span>
                    )}
                  </div>
                  <span className="text-xs mt-1">{name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mb-4">
            <p className="text-sm text-gray-600">
              Step {step} of {totalSteps}: {stepNames[step - 1]}
            </p>
          </div>
        </div>

        {step === 1 && <RoleSelection onSelect={handleRoleSelect} />}
        {step === 2 && <WaliInvitation onContinue={handleWaliContinue} />}
        {step === 3 && <PhotoUpload onSubmit={handlePhotoUpload} onBack={goBack} />}
        {step === 4 && gender && <ProfileForm gender={gender} onSubmit={handleProfileSubmit} />}
        {step === 5 && <PersonalDetails onSubmit={handlePersonalDetailsSubmit} onBack={goBack} initialData={profileData} />}
        {step === 6 && <IslamicPreferences onSubmit={handlePreferencesSubmit} onBack={goBack} initialData={profileData} />}
        {step === 7 && <PhoneVerification onVerified={handlePhoneVerified} onSkip={handlePhoneSkip} />}
      </div>
    </div>
  );
}

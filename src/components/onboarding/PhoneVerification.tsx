import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Phone, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface PhoneVerificationProps {
  onVerified: () => void;
  onSkip: () => void;
  onBack: () => void; // 🔹 new prop to go back to previous onboarding step
}

export function PhoneVerification({ onVerified, onSkip, onBack }: PhoneVerificationProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'phone' | 'verify'>('phone');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const sendVerificationCode = async () => {
    if (!phoneNumber.match(/^\+?[1-9]\d{10,14}$/)) {
      toast({
        title: 'Invalid phone number',
        description: 'Please enter a valid phone number with country code',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-sms-verification', {
        body: { phoneNumber, userId: user?.id }
      });

      if (error) throw error;

      await supabase.from('profiles').update({ phone_number: phoneNumber }).eq('id', user?.id);

      toast({
        title: 'Code sent',
        description: 'Check your phone for the verification code',
      });
      setStep('verify');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send code',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    setLoading(true);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('phone_verification_code, phone_verification_expires_at')
        .eq('id', user?.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      const expiresAt = new Date(profile.phone_verification_expires_at);
      if (expiresAt < new Date()) {
        throw new Error('Verification code expired');
      }

      if (profile.phone_verification_code !== verificationCode) {
        throw new Error('Invalid verification code');
      }

      await supabase.from('profiles').update({
        phone_verified: true,
        phone_verification_code: null,
        phone_verification_expires_at: null
      }).eq('id', user?.id);

      toast({
        title: 'Phone verified',
        description: 'Your phone number has been verified successfully',
      });
      onVerified();
    } catch (error: any) {
      toast({
        title: 'Verification failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="w-5 h-5 text-teal-600" />
          Phone Verification
        </CardTitle>
        <CardDescription>
          Verify your phone to receive SMS notifications for important events
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 'phone' ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <p className="text-xs text-gray-500">Include country code (e.g., +1 for US)</p>
            </div>
            <div className="flex gap-2">
              {/* 🔹 Back to previous onboarding step (Islamic) */}
              <Button variant="outline" onClick={onBack}>
                Back
              </Button>
              <Button onClick={sendVerificationCode} disabled={loading} className="flex-1">
                {loading ? 'Sending...' : 'Send Code'}
              </Button>
              <Button variant="ghost" onClick={onSkip}>
                Skip
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
                type="text"
                placeholder="123456"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                maxLength={6}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={verifyCode} disabled={loading} className="flex-1">
                <Check className="w-4 h-4 mr-2" />
                {loading ? 'Verifying...' : 'Verify'}
              </Button>
              {/* This Back only goes back to phone-input inside step 7 */}
              <Button variant="outline" onClick={() => setStep('phone')}>
                Back
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

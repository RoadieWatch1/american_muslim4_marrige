import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { Shield, Smartphone, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { BackupCodesManager } from './BackupCodesManager';

export const TwoFactorSetup: React.FC = () => {
  const { user } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isEnabled, setIsEnabled] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState<'setup' | 'verify'>('setup');

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('phone_number, two_factor_enabled, two_factor_verified')
      .eq('id', user.id)
      .single();
    
    if (data) {
      setPhoneNumber(data.phone_number || '');
      setIsEnabled(data.two_factor_enabled || false);
      setIsVerified(data.two_factor_verified || false);
    }
  };

  const handleSendCode = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const { data, error: funcError } = await supabase.functions.invoke('send-2fa-code', {
        body: { phoneNumber, userId: user?.id, action: 'setup' }
      });

      if (funcError) {
        console.error('Function error:', funcError);
        throw new Error(funcError.message || 'Failed to send code');
      }
      

      
      setSuccess('Verification code sent to your phone!');
      setStep('verify');
    } catch (err: any) {
      setError(err.message || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };
  const handleVerifyCode = async () => {
    setLoading(true);
    setError('');
    
    try {
      const { data: codes } = await supabase
        .from('two_factor_codes')
        .select('*')
        .eq('user_id', user?.id)
        .eq('phone_number', phoneNumber)
        .eq('verified', false)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (!codes || codes.length === 0) {
        throw new Error('No valid code found');
      }

      if (codes[0].code !== verificationCode) {
        throw new Error('Invalid verification code');
      }

      await supabase
        .from('profiles')
        .update({
          phone_number: phoneNumber,
          two_factor_enabled: true,
          two_factor_verified: true
        })
        .eq('id', user?.id);

      // Generate backup codes
      const backupCodes = generateBackupCodes();
      const hashedCodes = await Promise.all(backupCodes.map(hashCode));
      
      await supabase.from('backup_codes').insert(
        hashedCodes.map(hash => ({ user_id: user?.id, code_hash: hash }))
      );

      setIsEnabled(true);
      setIsVerified(true);
      setSuccess('2FA enabled! Please generate and save your backup codes below.');
      setStep('setup');
      setVerificationCode('');
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const generateBackupCodes = (): string[] => {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  };

  const hashCode = async (code: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(code);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleDisable2FA = async () => {
    setLoading(true);
    setError('');
    
    try {
      await supabase
        .from('profiles')
        .update({ two_factor_enabled: false })
        .eq('id', user?.id);

      setIsEnabled(false);
      setSuccess('2FA disabled');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-teal-600" />
            <CardTitle>Two-Factor Authentication</CardTitle>
          </div>
          <CardDescription>
            Add an extra layer of security with SMS verification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEnabled && isVerified ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">2FA is enabled</span>
              </div>
              <p className="text-sm text-gray-600">
                Phone: {phoneNumber}
              </p>
              <Button variant="destructive" onClick={handleDisable2FA} disabled={loading}>
                Disable 2FA
              </Button>
            </div>
          ) : step === 'setup' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
                <Smartphone className="h-5 w-5" />
                <span className="text-sm">Set up SMS verification for enhanced security</span>
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1234567890"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">Include country code (e.g., +1)</p>
              </div>
              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
              {success && <p className="text-sm text-green-600">{success}</p>}
              <Button onClick={handleSendCode} disabled={loading || !phoneNumber}>
                {loading ? 'Sending...' : 'Send Verification Code'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Enter the 6-digit code sent to {phoneNumber}
              </p>
              <div>
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2">
                <Button onClick={handleVerifyCode} disabled={loading || !verificationCode}>
                  {loading ? 'Verifying...' : 'Verify'}
                </Button>
                <Button variant="outline" onClick={() => setStep('setup')}>
                  Back
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {isEnabled && isVerified && <BackupCodesManager />}
    </div>
  );
};


import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { Shield, AlertCircle } from 'lucide-react';

interface TwoFactorModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  phoneNumber: string;
  onSuccess: () => void;
}

export const TwoFactorModal: React.FC<TwoFactorModalProps> = ({
  isOpen,
  onClose,
  userId,
  phoneNumber,
  onSuccess,
}) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);


  const handleSendCode = async () => {
    setLoading(true);
    setError('');
    
    try {
      const { data, error: funcError } = await supabase.functions.invoke('send-2fa-code', {
        body: { phoneNumber, userId, action: 'login' }
      });

      if (funcError) {
        console.error('Function error:', funcError);
        throw new Error(funcError.message || 'Failed to send code');
      }
      

      
      setCodeSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (useBackupCode) {
        await verifyBackupCode();
      } else {
        await verifySMSCode();
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const verifySMSCode = async () => {
    const { data: codes } = await supabase
      .from('two_factor_codes')
      .select('*')
      .eq('user_id', userId)
      .eq('phone_number', phoneNumber)
      .eq('verified', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (!codes || codes.length === 0) {
      throw new Error('No valid code found. Please request a new one.');
    }

    if (codes[0].code !== code) {
      throw new Error('Invalid verification code');
    }
  };

  const verifyBackupCode = async () => {
    const { data: backupCodes } = await supabase
      .from('backup_codes')
      .select('*')
      .eq('user_id', userId)
      .eq('used', false);

    if (!backupCodes || backupCodes.length === 0) {
      throw new Error('No backup codes available');
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(code.toUpperCase());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const codeHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const matchingCode = backupCodes.find(bc => bc.code_hash === codeHash);
    if (!matchingCode) {
      throw new Error('Invalid backup code');
    }

    await supabase
      .from('backup_codes')
      .update({ used: true, used_at: new Date().toISOString() })
      .eq('id', matchingCode.id);
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-teal-800 flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Two-Factor Authentication
          </DialogTitle>
        </DialogHeader>
        
        {!codeSent && !useBackupCode ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Your account has 2FA enabled. We'll send a verification code to {phoneNumber}
            </p>
            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            <Button onClick={handleSendCode} disabled={loading} className="w-full">
              {loading ? 'Sending...' : 'Send Verification Code'}
            </Button>
            <Button 
              type="button"
              variant="link" 
              onClick={() => setUseBackupCode(true)} 
              className="w-full text-sm"
            >
              Use backup code instead
            </Button>
          </div>
        ) : useBackupCode ? (
          <form onSubmit={handleVerify} className="space-y-4">
            <p className="text-sm text-gray-600">
              Enter one of your backup recovery codes
            </p>
            <div>
              <Label htmlFor="backup-code">Backup Code</Label>
              <Input
                id="backup-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="XXXXXXXX"
                required
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading || !code}>
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </Button>
            <Button 
              type="button"
              variant="link" 
              onClick={() => { setUseBackupCode(false); setCode(''); }} 
              className="w-full text-sm"
            >
              Use SMS code instead
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <p className="text-sm text-gray-600">
              Enter the 6-digit code sent to {phoneNumber}
            </p>
            <div>
              <Label htmlFor="2fa-code">Verification Code</Label>
              <Input
                id="2fa-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading || !code}>
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </Button>
            <Button 
              type="button"
              variant="link" 
              onClick={() => setUseBackupCode(true)} 
              className="w-full text-sm"
            >
              Use backup code instead
            </Button>
          </form>
        )}

      </DialogContent>
    </Dialog>
  );
};

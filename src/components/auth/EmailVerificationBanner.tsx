import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/Button';
import { Mail, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export const EmailVerificationBanner: React.FC = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (!user || !profile || profile.email_verified || dismissed) {
    return null;
  }

  const handleResend = async () => {
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-verification-email', {
        body: { 
          email: user.email, 
          userId: user.id,
          isResend: true 
        }
      });

      if (error) throw error;

      toast({
        title: 'Email Sent',
        description: 'Verification email has been sent. Please check your inbox.'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to send verification email',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Alert className="bg-amber-50 border-amber-200 mb-4">
      <Mail className="h-4 w-4 text-amber-600" />
      <AlertDescription className="flex items-center justify-between">
        <span className="text-amber-800">
          Please verify your email address to access all features.
        </span>
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleResend}
            disabled={sending}
            className="border-amber-300 text-amber-700 hover:bg-amber-100"
          >
            {sending ? 'Sending...' : 'Resend Email'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDismissed(true)}
            className="text-amber-700 hover:bg-amber-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

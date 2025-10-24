import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/Button';
import { Mail, ExternalLink, Settings, CheckCircle } from 'lucide-react';

export const EmailSetupGuide: React.FC = () => {
  return (
    <div className="space-y-4">
      <Alert className="border-amber-200 bg-amber-50">
        <Settings className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800">Email Configuration Required</AlertTitle>
        <AlertDescription className="text-amber-700 space-y-3 mt-2">
          <p>To enable email verification, please configure email settings in your Supabase dashboard:</p>
          
          <ol className="list-decimal list-inside space-y-2 ml-2">
            <li>Go to your Supabase Dashboard</li>
            <li>Navigate to Authentication → Email Templates</li>
            <li>Enable "Email Confirmations"</li>
            <li>Configure SMTP settings or use Supabase's built-in email service</li>
          </ol>

          <div className="flex gap-2 mt-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open('https://supabase.com/dashboard/project/_/auth/templates', '_blank')}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open Supabase Dashboard
            </Button>
          </div>

          <div className="bg-white rounded-lg p-3 border border-amber-200 mt-4">
            <p className="text-sm font-medium text-amber-800 mb-2">Alternative: Test Mode</p>
            <p className="text-xs text-amber-700">
              For testing, you can use Supabase's Inbucket service to view emails locally.
              Check your Supabase logs for the OTP code.
            </p>
          </div>
        </AlertDescription>
      </Alert>

      <Alert className="border-teal-200 bg-teal-50">
        <CheckCircle className="h-4 w-4 text-teal-600" />
        <AlertTitle className="text-teal-800">Using OTP Authentication</AlertTitle>
        <AlertDescription className="text-teal-700 space-y-2 mt-2">
          <p>This app uses passwordless authentication with OTP (One-Time Password) codes:</p>
          <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
            <li>Enter your email address</li>
            <li>Check your email for a 6-digit code</li>
            <li>Enter the code to sign in</li>
            <li>Codes expire after 10 minutes</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
};
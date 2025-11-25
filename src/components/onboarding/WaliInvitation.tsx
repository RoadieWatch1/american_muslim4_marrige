import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, ChevronRight } from 'lucide-react';

interface ExistingWali {
  email: string | null;
  phone: string | null;
}

interface WaliInvitationProps {
  onContinue: (waliData?: { email: string; phone: string; isUpdate?: boolean }) => void;
  existingWali?: ExistingWali | null;
}

export const WaliInvitation: React.FC<WaliInvitationProps> = ({
  onContinue,
  existingWali,
}) => {
  const [includeWali, setIncludeWali] = useState<boolean | null>(null);
  const [editingExisting, setEditingExisting] = useState(false);
  const [waliEmail, setWaliEmail] = useState(existingWali?.email || '');
  const [waliPhone, setWaliPhone] = useState(existingWali?.phone || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onContinue({
      email: waliEmail,
      phone: waliPhone,
      isUpdate: !!existingWali, // tells parent to UPDATE instead of INSERT
    });
  };

  // If wali already exists and not editing, show summary with option to change
  if (existingWali && !editingExisting) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-8 h-8 text-teal-600" />
              <CardTitle className="text-2xl">Wali Involvement</CardTitle>
            </div>
            <p className="text-gray-600">
              Your wali is already connected. You can review or update their details below.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-1">
                {existingWali.email && (
                  <p>
                    <span className="font-semibold">Email:</span>{' '}
                    {existingWali.email}
                  </p>
                )}
                {existingWali.phone && (
                  <p>
                    <span className="font-semibold">Phone:</span>{' '}
                    {existingWali.phone}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  className="flex-1"
                  variant="outline"
                  type="button"
                  onClick={() => setEditingExisting(true)}
                >
                  Change wali details
                </Button>
                <Button className="flex-1" onClick={() => onContinue()}>
                  Continue <ChevronRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Either:
  // - no wali yet, or
  // - user clicked "Change wali details" (editingExisting = true)
  const showDecisionScreen = !existingWali && includeWali === null;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-teal-600" />
            <CardTitle className="text-2xl">Wali Involvement</CardTitle>
          </div>
          <p className="text-gray-600">
            Would you like to involve your wali (guardian) in the matchmaking
            process?
          </p>
        </CardHeader>
        <CardContent>
          {showDecisionScreen ? (
            <div className="space-y-4">
              <Button
                className="w-full h-auto py-6 flex-col"
                onClick={() => setIncludeWali(true)}
              >
                <span className="text-lg font-semibold mb-1">
                  Yes, Include My Wali
                </span>
                <span className="text-sm opacity-90">
                  They'll approve introductions and can join chats
                </span>
              </Button>
              <Button
                variant="outline"
                className="w-full h-auto py-6 flex-col"
                onClick={() => onContinue()}
              >
                <span className="text-lg font-semibold mb-1">
                  Not Right Now
                </span>
                <span className="text-sm">
                  You can add them later from settings
                </span>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="waliEmail">Wali&apos;s Email</Label>
                <Input
                  id="waliEmail"
                  type="email"
                  value={waliEmail}
                  onChange={(e) => setWaliEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="waliPhone">Wali&apos;s Phone (Optional)</Label>
                <Input
                  id="waliPhone"
                  type="tel"
                  value={waliPhone}
                  onChange={(e) => setWaliPhone(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full">
                {existingWali ? 'Update Wali' : 'Send Invitation'}
                <ChevronRight className="ml-2 w-4 h-4" />
              </Button>
              {!existingWali && includeWali && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setIncludeWali(null)}
                >
                  Back
                </Button>
              )}
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

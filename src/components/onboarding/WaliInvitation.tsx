import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, ChevronRight } from 'lucide-react';

interface WaliInvitationProps {
  onContinue: (waliData?: { email: string; phone: string }) => void;
}

export const WaliInvitation: React.FC<WaliInvitationProps> = ({ onContinue }) => {
  const [includeWali, setIncludeWali] = useState<boolean | null>(null);
  const [waliEmail, setWaliEmail] = useState('');
  const [waliPhone, setWaliPhone] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (includeWali) {
      onContinue({ email: waliEmail, phone: waliPhone });
    } else {
      onContinue();
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-teal-600" />
            <CardTitle className="text-2xl">Wali Involvement</CardTitle>
          </div>
          <p className="text-gray-600">Would you like to involve your wali (guardian) in the matchmaking process?</p>
        </CardHeader>
        <CardContent>
          {includeWali === null ? (
            <div className="space-y-4">
              <Button className="w-full h-auto py-6 flex-col" onClick={() => setIncludeWali(true)}>
                <span className="text-lg font-semibold mb-1">Yes, Include My Wali</span>
                <span className="text-sm opacity-90">They'll approve introductions and can join chats</span>
              </Button>
              <Button variant="outline" className="w-full h-auto py-6 flex-col" onClick={() => setIncludeWali(false)}>
                <span className="text-lg font-semibold mb-1">Not Right Now</span>
                <span className="text-sm">You can add them later from settings</span>
              </Button>
            </div>
          ) : includeWali ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="waliEmail">Wali's Email</Label>
                <Input id="waliEmail" type="email" value={waliEmail} onChange={(e) => setWaliEmail(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="waliPhone">Wali's Phone (Optional)</Label>
                <Input id="waliPhone" type="tel" value={waliPhone} onChange={(e) => setWaliPhone(e.target.value)} />
              </div>
              <Button type="submit" className="w-full">
                Send Invitation <ChevronRight className="ml-2 w-4 h-4" />
              </Button>
            </form>
          ) : (
            <Button className="w-full" onClick={() => onContinue()}>
              Continue <ChevronRight className="ml-2 w-4 h-4" />
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

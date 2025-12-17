import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExistingWali {
  email: string | null;
  phone: string | null;
}

interface WaliInvitationProps {
  onContinue: (waliData?: {
    email: string;
    phone: string;
    isUpdate?: boolean;
  }) => void;
  existingWali?: ExistingWali | null;
  inviteUrl?: string;
  /** Optional callback to resend the invitation email via edge function */
  onResendInvite?: () => Promise<void> | void;
}

export const WaliInvitation: React.FC<WaliInvitationProps> = ({
  onContinue,
  existingWali,
  inviteUrl,
  onResendInvite,
}) => {
  const { toast } = useToast();
  const [includeWali, setIncludeWali] = useState<boolean | null>(null);
  const [editingExisting, setEditingExisting] = useState(false);
  const [waliEmail, setWaliEmail] = useState(existingWali?.email || '');
  const [waliPhone, setWaliPhone] = useState(existingWali?.phone || '');
  const [resendLoading, setResendLoading] = useState(false);

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
              Your wali invitation is already set up. You can review or update
              their details below.
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

                {/* Invite link (if available) */}
                {inviteUrl && (
                  <div className="mt-3 space-y-1">
                    <p className="text-xs text-gray-500">
                      Share this link with your wali so they can create their
                      account:
                    </p>
                    <div className="flex flex-wrap gap-2 items-center">
                      <Input
                        readOnly
                        value={inviteUrl}
                        className="text-xs flex-1"
                      />

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard
                            .writeText(inviteUrl || '')
                            .then(() => {
                              toast({
                                title: 'Copied!',
                                description: 'Invite link copied to clipboard.',
                              });
                            })
                            .catch((err) => {
                              console.error('Failed to copy', err);
                              toast({
                                title: 'Copy failed',
                                description: 'Could not copy to clipboard.',
                                variant: 'destructive',
                              });
                            });
                        }}
                      >
                        Copy
                      </Button>

                      {/* Resend email button, only if callback provided */}
                      {onResendInvite && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={resendLoading}
                          onClick={async () => {
                            try {
                              setResendLoading(true);
                              await onResendInvite();
                            } finally {
                              setResendLoading(false);
                            }
                          }}
                        >
                          {resendLoading ? 'Sending…' : 'Resend Email'}
                        </Button>
                      )}
                    </div>
                  </div>
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
            process? We’ll send them a secure link so they can create their own
            wali account.
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
                  They’ll be able to approve introductions and support your
                  decisions.
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
                  You can add them later from your dashboard.
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



// import React, { useState } from 'react';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/Button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Shield, ChevronRight } from 'lucide-react';
// import { useToast } from '@/hooks/use-toast';

// interface ExistingWali {
//   email: string | null;
//   phone: string | null;
// }

// interface WaliInvitationProps {
//   onContinue: (waliData?: {
//     email: string;
//     phone: string;
//     isUpdate?: boolean;
//   }) => void;
//   existingWali?: ExistingWali | null;
//   inviteUrl?: string;
// }

// export const WaliInvitation: React.FC<WaliInvitationProps> = ({
//   onContinue,
//   existingWali,
//   inviteUrl,
// }) => {
//   const { toast } = useToast();
//   const [includeWali, setIncludeWali] = useState<boolean | null>(null);
//   const [editingExisting, setEditingExisting] = useState(false);
//   const [waliEmail, setWaliEmail] = useState(existingWali?.email || '');
//   const [waliPhone, setWaliPhone] = useState(existingWali?.phone || '');

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     onContinue({
//       email: waliEmail,
//       phone: waliPhone,
//       isUpdate: !!existingWali, // tells parent to UPDATE instead of INSERT
//     });
//   };

//   // If wali already exists and not editing, show summary with option to change
//   if (existingWali && !editingExisting) {
//     return (
//       <div className="max-w-2xl mx-auto p-6">
//         <Card>
//           <CardHeader>
//             <div className="flex items-center gap-3 mb-2">
//               <Shield className="w-8 h-8 text-teal-600" />
//               <CardTitle className="text-2xl">Wali Involvement</CardTitle>
//             </div>
//             <p className="text-gray-600">
//               Your wali invitation is already set up. You can review or update
//               their details below.
//             </p>
//           </CardHeader>
//           <CardContent>
//             <div className="space-y-4">
//               <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-1">
//                 {existingWali.email && (
//                   <p>
//                     <span className="font-semibold">Email:</span>{' '}
//                     {existingWali.email}
//                   </p>
//                 )}
//                 {existingWali.phone && (
//                   <p>
//                     <span className="font-semibold">Phone:</span>{' '}
//                     {existingWali.phone}
//                   </p>
//                 )}

//                 {/* Invite link (if available) */}
//                 {inviteUrl && (
//                   <div className="mt-3 space-y-1">
//                     <p className="text-xs text-gray-500">
//                       Share this link with your wali so they can create their account:
//                     </p>
//                     <div className="flex gap-2 items-center">
//                       <Input readOnly value={inviteUrl} className="text-xs" />

//                       <Button
//                         type="button"
//                         variant="outline"
//                         size="sm"
//                         onClick={() => {
//                           navigator.clipboard
//                             .writeText(inviteUrl || '')
//                             .then(() => {
//                               toast({
//                                 title: "Copied!",
//                                 description: "Invite link copied to clipboard.",
//                               });
//                             })
//                             .catch((err) => {
//                               console.error("Failed to copy", err);
//                               toast({
//                                 title: "Copy failed",
//                                 description: "Could not copy to clipboard.",
//                                 variant: "destructive",
//                               });
//                             });
//                         }}
//                       >
//                         Copy
//                       </Button>
//                     </div>
//                   </div>
//                 )}

//               </div>

//               <div className="flex flex-col gap-3 sm:flex-row">
//                 <Button
//                   className="flex-1"
//                   variant="outline"
//                   type="button"
//                   onClick={() => setEditingExisting(true)}
//                 >
//                   Change wali details
//                 </Button>
//                 <Button className="flex-1" onClick={() => onContinue()}>
//                   Continue <ChevronRight className="ml-2 w-4 h-4" />
//                 </Button>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     );
//   }

//   // Either:
//   // - no wali yet, or
//   // - user clicked "Change wali details" (editingExisting = true)
//   const showDecisionScreen = !existingWali && includeWali === null;

//   return (
//     <div className="max-w-2xl mx-auto p-6">
//       <Card>
//         <CardHeader>
//           <div className="flex items-center gap-3 mb-2">
//             <Shield className="w-8 h-8 text-teal-600" />
//             <CardTitle className="text-2xl">Wali Involvement</CardTitle>
//           </div>
//           <p className="text-gray-600">
//             Would you like to involve your wali (guardian) in the matchmaking
//             process? We’ll send them a secure link so they can create their own
//             wali account.
//           </p>
//         </CardHeader>
//         <CardContent>
//           {showDecisionScreen ? (
//             <div className="space-y-4">
//               <Button
//                 className="w-full h-auto py-6 flex-col"
//                 onClick={() => setIncludeWali(true)}
//               >
//                 <span className="text-lg font-semibold mb-1">
//                   Yes, Include My Wali
//                 </span>
//                 <span className="text-sm opacity-90">
//                   They’ll be able to approve introductions and support your
//                   decisions.
//                 </span>
//               </Button>
//               <Button
//                 variant="outline"
//                 className="w-full h-auto py-6 flex-col"
//                 onClick={() => onContinue()}
//               >
//                 <span className="text-lg font-semibold mb-1">
//                   Not Right Now
//                 </span>
//                 <span className="text-sm">
//                   You can add them later from your dashboard.
//                 </span>
//               </Button>
//             </div>
//           ) : (
//             <form onSubmit={handleSubmit} className="space-y-4">
//               <div>
//                 <Label htmlFor="waliEmail">Wali&apos;s Email</Label>
//                 <Input
//                   id="waliEmail"
//                   type="email"
//                   value={waliEmail}
//                   onChange={(e) => setWaliEmail(e.target.value)}
//                   required
//                 />
//               </div>
//               <div>
//                 <Label htmlFor="waliPhone">Wali&apos;s Phone (Optional)</Label>
//                 <Input
//                   id="waliPhone"
//                   type="tel"
//                   value={waliPhone}
//                   onChange={(e) => setWaliPhone(e.target.value)}
//                 />
//               </div>
//               <Button type="submit" className="w-full">
//                 {existingWali ? 'Update Wali' : 'Send Invitation'}
//                 <ChevronRight className="ml-2 w-4 h-4" />
//               </Button>
//               {!existingWali && includeWali && (
//                 <Button
//                   type="button"
//                   variant="outline"
//                   className="w-full"
//                   onClick={() => setIncludeWali(null)}
//                 >
//                   Back
//                 </Button>
//               )}
//             </form>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

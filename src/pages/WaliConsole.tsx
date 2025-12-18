// src/pages/WaliConsole.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { WaliLink, IntroRequest } from '@/types/wali';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  Mail,
  UserCheck,
  UserX,
  Clock,
  Shield,
  Eye,
  EyeOff,
} from 'lucide-react';

type ProfileSummary = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  city: string | null;
  occupation: string | null;
  email?: string | null;
};

type IntroRequestWithProfile = IntroRequest & {
  from_profile?: ProfileSummary | null;
};

export default function WaliConsole() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [waliLinks, setWaliLinks] = useState<WaliLink[]>([]);
  const [introRequests, setIntroRequests] = useState<IntroRequestWithProfile[]>(
    [],
  );
  const [requireWaliApproval, setRequireWaliApproval] = useState(false);

  const [waliEmail, setWaliEmail] = useState('');
  const [waliName, setWaliName] = useState('');
  const [waliPhone, setWaliPhone] = useState('');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (user) void loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // 1) wali links for this ward
      const { data: links, error: linksError } = await supabase
        .from('wali_links')
        .select('*')
        .eq('ward_user_id', user.id)
        .order('created_at', { ascending: false });

      if (linksError) throw linksError;
      setWaliLinks(links || []);

      // 2) intro requests sent TO this user
      const { data: rawRequests, error: requestsError } = await supabase
        .from('intro_requests')
        .select('*')
        .eq('to_user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      let enrichedRequests: IntroRequestWithProfile[] = rawRequests || [];

      if (rawRequests && rawRequests.length > 0) {
        const fromIds = Array.from(
          new Set(rawRequests.map((r) => r.from_user_id)),
        );

        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select(
            'id, first_name, last_name, city, occupation',
          )
          .in('id', fromIds);

        if (profilesError) throw profilesError;

        const map = new Map<string, ProfileSummary>();
        (profiles || []).forEach((p: any) => map.set(p.id, p));

        enrichedRequests = rawRequests.map((r) => ({
          ...r,
          from_profile: map.get(r.from_user_id) || null,
        }));
      }

      setIntroRequests(enrichedRequests);

      // 3) wali setting from profile (use your real column name)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('wali_required')
        .eq('id', user.id)
        .single();

      if (!profileError && profile) {
        setRequireWaliApproval(profile.wali_required ?? false);
      }
    } catch (error: any) {
      console.error('Error loading wali console data:', error);
      toast({
        title: 'Error',
        description: 'Could not load wali data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInviteWali = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waliEmail || !user) return;

    try {
      setInviting(true);

      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single();

      const { error } = await supabase.from('wali_links').insert({
        ward_user_id: user.id,
        wali_email: waliEmail,
        wali_name: waliName || null,
        wali_phone: waliPhone || null,
        status: 'invited',
      });

      if (error) throw error;

      try {
        await supabase.functions.invoke('send-notification-email', {
          body: {
            type: 'wali_invitation',
            to: waliEmail,
            data: {
              womanName: `${profile?.first_name || ''} ${
                profile?.last_name || ''
              }`.trim(),
              waliName: waliName || 'Guardian',
              loginUrl: `${window.location.origin}/wali-console`,
            },
          },
        });
      } catch (emailError) {
        console.error('Failed to send wali invitation email:', emailError);
      }

      toast({
        title: 'Wali Invited',
        description: 'An invitation has been sent to your wali.',
      });

      setWaliEmail('');
      setWaliName('');
      setWaliPhone('');
      void loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setInviting(false);
    }
  };

  const handleToggleWaliApproval = async (checked: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ wali_required: checked })
        .eq('id', user.id);

      if (error) throw error;

      setRequireWaliApproval(checked);
      toast({
        title: checked ? 'Wali Approval Required' : 'Wali Approval Optional',
        description: checked
          ? 'All intro requests will now require wali approval.'
          : 'Intro requests no longer require wali approval.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleApproveRequest = async (
    requestId: string,
    approved: boolean,
  ) => {
    if (!user) return;

    try {
      // get request
      const { data: request, error: reqError } = await supabase
        .from('intro_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (reqError) throw reqError;

      // update status
      const { error } = await supabase
        .from('intro_requests')
        .update({
          wali_id: user.id,
          status: approved ? 'approved' : 'rejected',
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;

      // (Optional) load profiles for emails
      let fromProfileEmail: string | null = null;
      let toProfileEmail: string | null = null;
      let fromName = '';
      let toName = '';

      const { data: fromProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', request.from_user_id)
        .single();

      const { data: toProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', request.to_user_id)
        .single();

      if (fromProfile) {
        fromProfileEmail = fromProfile.email;
        fromName = `${fromProfile.first_name || ''} ${
          fromProfile.last_name || ''
        }`.trim();
      }
      if (toProfile) {
        toProfileEmail = toProfile.email;
        toName = `${toProfile.first_name || ''} ${
          toProfile.last_name || ''
        }`.trim();
      }

      try {
        if (toProfileEmail) {
          await supabase.functions.invoke('send-notification-email', {
            body: {
              type: approved ? 'match' : 'intro_request',
              to: toProfileEmail,
              recipientUserId: request.to_user_id,
              data: {
                matchName: approved ? fromName : '',
                message: approved
                  ? 'Your wali has approved this introduction request.'
                  : 'Your wali has reviewed an introduction request.',
                loginUrl: `${window.location.origin}/messages`,
              },
            },
          });
        }

        if (fromProfileEmail) {
          await supabase.functions.invoke('send-notification-email', {
            body: {
              type: approved ? 'match' : 'intro_request',
              to: fromProfileEmail,
              recipientUserId: request.from_user_id,
              data: {
                matchName: approved ? toName : '',
                message: approved
                  ? 'Your introduction request has been approved!'
                  : 'Your introduction request has been reviewed.',
                loginUrl: `${window.location.origin}/messages`,
              },
            },
          });
        }
      } catch (emailError) {
        console.error('Failed to send notification emails:', emailError);
      }

      toast({
        title: approved ? 'Request Approved' : 'Request Rejected',
        description: approved
          ? 'The introduction request has been approved.'
          : 'The introduction request has been rejected.',
      });

      void loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="h-8 w-8 text-emerald-600" />
            Wali Console
          </h1>
          <p className="mt-2 text-gray-600">
            Manage your guardian&apos;s involvement in your marriage search
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Invite Wali */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-emerald-600" />
                Invite Your Wali
              </CardTitle>
              <CardDescription>
                Send an invitation to your guardian to oversee your marriage
                search
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInviteWali} className="space-y-4">
                <div>
                  <Label htmlFor="waliEmail">Wali Email *</Label>
                  <Input
                    id="waliEmail"
                    type="email"
                    value={waliEmail}
                    onChange={(e) => setWaliEmail(e.target.value)}
                    placeholder="wali@example.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="waliName">Wali Name</Label>
                  <Input
                    id="waliName"
                    value={waliName}
                    onChange={(e) => setWaliName(e.target.value)}
                    placeholder="Father, Brother, Uncle, etc."
                  />
                </div>
                <div>
                  <Label htmlFor="waliPhone">Wali Phone</Label>
                  <Input
                    id="waliPhone"
                    value={waliPhone}
                    onChange={(e) => setWaliPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <Button type="submit" disabled={inviting} className="w-full">
                  {inviting ? 'Sending...' : 'Send Invitation'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Wali Approval Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {requireWaliApproval ? (
                  <Eye className="h-5 w-5 text-emerald-600" />
                ) : (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                )}
                Wali Approval Settings
              </CardTitle>
              <CardDescription>
                Control whether intro requests require wali approval
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Wali Approval</Label>
                  <p className="text-sm text-gray-500">
                    All intro requests will need wali approval before
                    proceeding
                  </p>
                </div>
                <Switch
                  checked={requireWaliApproval}
                  onCheckedChange={handleToggleWaliApproval}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Wali Connections */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Wali Connections</CardTitle>
            <CardDescription>
              View and manage your wali connections
            </CardDescription>
          </CardHeader>
          <CardContent>
            {waliLinks.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No wali connections yet. Invite your wali above.
              </p>
            ) : (
              <div className="space-y-4">
                {waliLinks.map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        {link.wali_name || 'Unnamed Wali'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {link.wali_email}
                      </p>
                      {link.wali_phone && (
                        <p className="text-sm text-gray-500">
                          {link.wali_phone}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={
                        link.status === 'active'
                          ? 'default'
                          : link.status === 'invited'
                          ? 'secondary'
                          : 'destructive'
                      }
                    >
                      {link.status === 'active' && (
                        <UserCheck className="h-3 w-3 mr-1" />
                      )}
                      {link.status === 'invited' && (
                        <Clock className="h-3 w-3 mr-1" />
                      )}
                      {link.status === 'removed' && (
                        <UserX className="h-3 w-3 mr-1" />
                      )}
                      {link.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Intro Requests Needing Wali Approval */}
        {requireWaliApproval && introRequests.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Intro Requests Pending Wali Approval</CardTitle>
              <CardDescription>
                Review and approve/reject introduction requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {introRequests.map((request) => (
                  <div
                    key={request.id}
                    className="p-4 border rounded-lg space-y-3"
                  >
                    <div>
                      <p className="font-medium">
                        {request.from_profile?.first_name}{' '}
                        {request.from_profile?.last_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {request.from_profile?.city}{' '}
                        {request.from_profile?.occupation &&
                          `• ${request.from_profile.occupation}`}
                      </p>
                      {request.message && (
                        <p className="text-sm text-gray-700 mt-2 italic">
                          &quot;{request.message}&quot;
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() =>
                          handleApproveRequest(request.id, true)
                        }
                        className="flex-1"
                      >
                        <UserCheck className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          handleApproveRequest(request.id, false)
                        }
                        className="flex-1"
                      >
                        <UserX className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

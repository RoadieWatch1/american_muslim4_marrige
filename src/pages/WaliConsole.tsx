import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { WaliLink, IntroRequest } from '@/types/wali';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Mail, UserCheck, UserX, Clock, Shield, Eye, EyeOff } from 'lucide-react';

export default function WaliConsole() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [waliLinks, setWaliLinks] = useState<WaliLink[]>([]);
  const [introRequests, setIntroRequests] = useState<IntroRequest[]>([]);
  const [requireWaliApproval, setRequireWaliApproval] = useState(false);
  
  // Invite wali form
  const [waliEmail, setWaliEmail] = useState('');
  const [waliName, setWaliName] = useState('');
  const [waliPhone, setWaliPhone] = useState('');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load wali links
      const { data: links, error: linksError } = await supabase
        .from('wali_links')
        .select('*')
        .eq('woman_id', user?.id)
        .order('created_at', { ascending: false });

      if (linksError) throw linksError;
      setWaliLinks(links || []);

      // Load intro requests
      const { data: requests, error: requestsError } = await supabase
        .from('intro_requests')
        .select(`
          *,
          requester_profile:profiles!intro_requests_requester_id_fkey(
            first_name,
            last_name,
            age,
            city,
            occupation
          )
        `)
        .eq('recipient_id', user?.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;
      setIntroRequests(requests || []);

      // Load wali approval setting from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('require_wali_approval')
        .eq('id', user?.id)
        .single();

      if (profile) {
        setRequireWaliApproval(profile.require_wali_approval || false);
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteWali = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waliEmail || !user) return;

    try {
      setInviting(true);
      
      // Get woman's profile name
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single();

      const { error } = await supabase
        .from('wali_links')
        .insert({
          woman_id: user.id,
          wali_email: waliEmail,
          wali_name: waliName || null,
          wali_phone: waliPhone || null,
          status: 'pending'
        });

      if (error) throw error;

      // Send email notification to wali (no recipientUserId since wali might not be a user yet)
      try {
        await supabase.functions.invoke('send-notification-email', {
          body: {
            type: 'wali_invitation',
            to: waliEmail,
            data: {
              womanName: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim(),
              waliName: waliName || 'Guardian',
              loginUrl: `${window.location.origin}/wali-console`
            }
          }
        });
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
        // Don't fail the whole operation if email fails
      }


      toast({
        title: 'Wali Invited',
        description: 'An invitation has been sent to your wali.',
      });

      setWaliEmail('');
      setWaliName('');
      setWaliPhone('');
      loadData();
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
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ require_wali_approval: checked })
        .eq('id', user?.id);

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

  const handleApproveRequest = async (requestId: string, approved: boolean, notes?: string) => {
    try {
      // Get the intro request details first
      const { data: request } = await supabase
        .from('intro_requests')
        .select(`
          *,
          requester_profile:profiles!intro_requests_requester_id_fkey(first_name, last_name, email),
          recipient_profile:profiles!intro_requests_recipient_id_fkey(first_name, last_name, email)
        `)
        .eq('id', requestId)
        .single();

      const { error } = await supabase
        .from('intro_requests')
        .update({
          wali_approved: approved,
          wali_notes: notes || null,
          status: approved ? 'approved' : 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      // Send email notifications
      if (request) {
        try {
          // Notify the woman with her user ID for preference checking
          await supabase.functions.invoke('send-notification-email', {
            body: {
              type: approved ? 'match' : 'intro_request',
              to: request.recipient_profile?.email,
              recipientUserId: request.recipient_id,
              data: {
                matchName: approved ? `${request.requester_profile?.first_name} ${request.requester_profile?.last_name}` : '',
                message: approved ? 'Your wali has approved this introduction request.' : 'Your wali has reviewed an introduction request.',
                loginUrl: `${window.location.origin}/messages`
              }
            }
          });


          // Notify the requester with their user ID for preference checking
          await supabase.functions.invoke('send-notification-email', {
            body: {
              type: approved ? 'match' : 'intro_request',
              to: request.requester_profile?.email,
              recipientUserId: request.requester_id,
              data: {
                matchName: approved ? `${request.recipient_profile?.first_name} ${request.recipient_profile?.last_name}` : '',
                message: approved ? 'Your introduction request has been approved!' : 'Your introduction request has been reviewed.',
                loginUrl: `${window.location.origin}/messages`
              }
            }
          });

        } catch (emailError) {
          console.error('Failed to send notification emails:', emailError);
        }
      }

      toast({
        title: approved ? 'Request Approved' : 'Request Rejected',
        description: approved 
          ? 'The introduction request has been approved.' 
          : 'The introduction request has been rejected.',
      });

      loadData();
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
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
            Manage your guardian's involvement in your marriage search
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
                Send an invitation to your guardian to oversee your marriage search
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
                    All intro requests will need wali approval before proceeding
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
                      <p className="font-medium">{link.wali_name || 'Unnamed Wali'}</p>
                      <p className="text-sm text-gray-600">{link.wali_email}</p>
                      {link.wali_phone && (
                        <p className="text-sm text-gray-500">{link.wali_phone}</p>
                      )}
                    </div>
                    <Badge
                      variant={
                        link.status === 'approved'
                          ? 'default'
                          : link.status === 'pending'
                          ? 'secondary'
                          : 'destructive'
                      }
                    >
                      {link.status === 'approved' && <UserCheck className="h-3 w-3 mr-1" />}
                      {link.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                      {link.status === 'rejected' && <UserX className="h-3 w-3 mr-1" />}
                      {link.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Intro Requests Needing Approval */}
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
                  <div key={request.id} className="p-4 border rounded-lg space-y-3">
                    <div>
                      <p className="font-medium">
                        {request.requester_profile?.first_name}{' '}
                        {request.requester_profile?.last_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {request.requester_profile?.age} years old •{' '}
                        {request.requester_profile?.city} •{' '}
                        {request.requester_profile?.occupation}
                      </p>
                      {request.message && (
                        <p className="text-sm text-gray-700 mt-2 italic">
                          "{request.message}"
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApproveRequest(request.id, true)}
                        className="flex-1"
                      >
                        <UserCheck className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleApproveRequest(request.id, false)}
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

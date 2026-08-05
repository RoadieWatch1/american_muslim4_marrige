import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Bell,
  Mail,
  MessageSquare,
  Save,
  ShieldCheck,
  UserCog,
  PauseCircle,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { TwoFactorSetup } from '@/components/settings/TwoFactorSetup';
import BillingManagement from '@/components/settings/BillingManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard } from 'lucide-react';

// Code-only flag (no env needed). Flip to true once send-2fa-code exists and
// Twilio is wired up — see PHONE_VERIFICATION_ENABLED in Onboarding.tsx for
// the same pattern applied to phone verification during onboarding.
const TWO_FACTOR_SMS_ENABLED = false;

type Frequency = 'instant' | 'daily' | 'weekly';

interface NotificationPreferences {
  // Email
  email_notifications_enabled: boolean;
  notify_wali_invitations: boolean;
  notify_intro_requests: boolean;
  notify_matches: boolean;
  notify_messages: boolean;
  notification_frequency: Frequency;

  // SMS
  sms_notifications_enabled: boolean;
  notify_matches_sms: boolean;
  notify_wali_approvals_sms: boolean;
  notify_messages_sms: boolean;

  // gate
  phone_verified: boolean;
}

const DEFAULT_PREFS: NotificationPreferences = {
  email_notifications_enabled: true,
  notify_wali_invitations: true,
  notify_intro_requests: true,
  notify_matches: true,
  notify_messages: true,
  notification_frequency: 'instant',

  sms_notifications_enabled: false,
  notify_matches_sms: true,
  notify_wali_approvals_sms: true,
  notify_messages_sms: false,

  phone_verified: false,
};

// only these columns should be read/updated from profiles for this page
const SELECT_PREFS =
  'email_notifications_enabled, notify_wali_invitations, notify_intro_requests, notify_matches, notify_messages, notification_frequency, sms_notifications_enabled, notify_matches_sms, notify_wali_approvals_sms, notify_messages_sms, phone_verified';

type PrefKey = keyof NotificationPreferences;

export default function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // track if anything changed (for save button UX)
  const [dirty, setDirty] = useState(false);

  const [preferences, setPreferences] =
    useState<NotificationPreferences>(DEFAULT_PREFS);

  const [allowPromotionalUse, setAllowPromotionalUse] = useState(false);
  const [promotionalUseSaving, setPromotionalUseSaving] = useState(false);

  // Account lifecycle (pause + delete)
  const [isActive, setIsActive] = useState(true);
  const [pausedAt, setPausedAt] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [subscriptionCancelAtPeriodEnd, setSubscriptionCancelAtPeriodEnd] = useState<boolean>(false);
  const [pauseSaving, setPauseSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Tabs synced with ?tab= query param so deep-links from inside the page work.
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const allowedTabs = ['notifications', 'privacy', 'security', 'account'] as const;
  const initialTab = (allowedTabs as readonly string[]).includes(tabFromUrl ?? '')
    ? (tabFromUrl as string)
    : 'notifications';
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  const onTabChange = (next: string) => {
    setActiveTab(next);
    const sp = new URLSearchParams(searchParams);
    sp.set('tab', next);
    setSearchParams(sp, { replace: true });
  };

  const isSelfPaused = isActive === false && pausedAt !== null;
  const isAdminDisabled = isActive === false && pausedAt === null;
  const hasActiveSub = subscriptionStatus === 'active' && subscriptionCancelAtPeriodEnd !== true;

  useEffect(() => {
    if (!user?.id) return;
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select(
            `${SELECT_PREFS}, allow_promotional_profile_use, is_active, paused_at, subscription_status, subscription_cancel_at_period_end`,
          )
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (mounted && data) {
          setPreferences((prev) => ({
            ...prev,
            ...data,
            notification_frequency:
              (data.notification_frequency as Frequency) ?? 'instant',
          }));
          const row = data as any;
          setAllowPromotionalUse(Boolean(row.allow_promotional_profile_use));
          setIsActive(row.is_active !== false);
          setPausedAt(row.paused_at ?? null);
          setSubscriptionStatus(row.subscription_status ?? null);
          setSubscriptionCancelAtPeriodEnd(row.subscription_cancel_at_period_end === true);
          setDirty(false);
        }
      } catch (err: any) {
        console.error('Error loading preferences:', err);
        toast({
          title: 'Error',
          description: err?.message ?? 'Failed to load settings.',
          variant: 'destructive',
        });
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  // Patch-save helper (optimistic + revert on fail)
  const patchPref = async <K extends PrefKey>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    if (!user?.id) return;

    const prev = preferences;

    // optimistic UI
    setPreferences((p) => ({ ...p, [key]: value }));
    setDirty(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          [key]: value,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', user.id);

      if (error) throw error;
    } catch (err: any) {
      console.error('Error saving preference:', err);
      // revert
      setPreferences(prev);
      toast({
        title: 'Error',
        description: err?.message ?? 'Failed to save. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Promotional-use opt-in: writes the boolean and the appropriate
  // consent/revocation timestamp atomically. Default is false; turning it
  // off again later stamps revoked_at without clearing consented_at, so the
  // audit trail of the most recent grant + revocation is preserved.
  const setPromotionalConsent = async (checked: boolean) => {
    if (!user?.id) return;

    const prev = allowPromotionalUse;
    setAllowPromotionalUse(checked);
    setPromotionalUseSaving(true);

    const nowIso = new Date().toISOString();
    const payload: Record<string, any> = {
      allow_promotional_profile_use: checked,
      updated_at: nowIso,
    };
    if (checked) {
      payload.promotional_profile_use_consented_at = nowIso;
    } else {
      payload.promotional_profile_use_revoked_at = nowIso;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: checked ? 'Promotional use enabled' : 'Promotional use turned off',
        description: checked
          ? 'You may now be featured in AM4M promotional materials. You can revoke this at any time.'
          : 'AM4M will not use your profile in new promotional materials going forward.',
      });
    } catch (err: any) {
      console.error('Error saving promotional consent:', err);
      setAllowPromotionalUse(prev);
      toast({
        title: 'Error',
        description: err?.message ?? 'Failed to save. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setPromotionalUseSaving(false);
    }
  };

  // Pause / resume the user's own account.
  // Pause: is_active=false, paused_at=now()
  // Resume: is_active=true, paused_at=null, guarded by paused_at IS NOT NULL
  //         so admin-disabled users (paused_at IS NULL) cannot self-reactivate.
  const setPauseState = async (shouldPause: boolean) => {
    if (!user?.id) return;

    const prevActive = isActive;
    const prevPausedAt = pausedAt;

    setPauseSaving(true);
    // optimistic
    setIsActive(!shouldPause);
    setPausedAt(shouldPause ? new Date().toISOString() : null);

    try {
      if (shouldPause) {
        const nowIso = new Date().toISOString();
        const { error } = await supabase
          .from('profiles')
          .update({ is_active: false, paused_at: nowIso, updated_at: nowIso })
          .eq('id', user.id);
        if (error) throw error;
        toast({
          title: 'Account paused',
          description:
            "You won't appear in new matches. Existing conversations stay. Resume any time.",
        });
      } else {
        const { error, data } = await supabase
          .from('profiles')
          .update({
            is_active: true,
            paused_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)
          .not('paused_at', 'is', null)
          .select('id');
        if (error) throw error;
        if (!data || data.length === 0) {
          // 0 rows updated => paused_at was already null, i.e. admin-disabled.
          throw new Error('This account cannot be resumed from here. Contact support.');
        }
        toast({
          title: 'Account resumed',
          description: 'Welcome back. You will appear in new matches again.',
        });
      }
    } catch (err: any) {
      console.error('Error toggling pause:', err);
      setIsActive(prevActive);
      setPausedAt(prevPausedAt);
      toast({
        title: 'Error',
        description: err?.message ?? 'Failed to update account state. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setPauseSaving(false);
    }
  };

  // Permanently delete the user's account.
  const handleDelete = async () => {
    if (!user?.id || deleting) return;
    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-account');

      if (error || !data?.ok) {
        const reason = (data?.error as string | undefined) ?? error?.message;
        if (reason === 'cancel_subscription_first') {
          toast({
            title: 'Cancel your subscription first',
            description:
              'Open the Billing tab and cancel your subscription before deleting your account.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Could not delete account',
            description: reason ?? 'Please try again later.',
            variant: 'destructive',
          });
        }
        setDeleting(false);
        return;
      }

      await supabase.auth.signOut();
      toast({
        title: 'Account deleted',
        description: 'Your account and personal data have been removed.',
      });
      navigate('/');
    } catch (err: any) {
      console.error('handleDelete error:', err);
      toast({
        title: 'Could not delete account',
        description: err?.message ?? 'Please try again later.',
        variant: 'destructive',
      });
      setDeleting(false);
    }
  };

  // Save button (bulk save current state)
  const savePreferences = async () => {
    if (!user?.id) return;

    setSaving(true);
    try {
      const payload: Partial<NotificationPreferences> = {
        email_notifications_enabled: preferences.email_notifications_enabled,
        notify_wali_invitations: preferences.notify_wali_invitations,
        notify_intro_requests: preferences.notify_intro_requests,
        notify_matches: preferences.notify_matches,
        notify_messages: preferences.notify_messages,
        notification_frequency: preferences.notification_frequency,

        sms_notifications_enabled: preferences.sms_notifications_enabled,
        notify_matches_sms: preferences.notify_matches_sms,
        notify_wali_approvals_sms: preferences.notify_wali_approvals_sms,
        notify_messages_sms: preferences.notify_messages_sms,

        phone_verified: preferences.phone_verified,
      };

      const { error } = await supabase
        .from('profiles')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (error) throw error;

      setDirty(false);
      toast({
        title: 'Settings saved',
        description: 'Your notification preferences have been updated.',
      });
    } catch (err: any) {
      console.error('Error saving preferences:', err);
      toast({
        title: 'Error',
        description: err?.message ?? 'Failed to save preferences. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  const emailEnabled = preferences.email_notifications_enabled;
  const smsEnabled = preferences.sms_notifications_enabled;
  const canUseSms = preferences.phone_verified;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account, notifications, and billing</p>
        </div>

        <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Privacy
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              Security
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <UserCog className="w-4 h-4" />
              Account
            </TabsTrigger>
            {/* <TabsTrigger value="billing" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Billing
            </TabsTrigger> */}
          </TabsList>

          <TabsContent value="notifications" className="space-y-6">
            {/* EMAIL */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-emerald-600" />
                  Email Notifications
                </CardTitle>
                <CardDescription>Control your email notification preferences</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-enabled" className="text-base font-medium">
                      Enable Email Notifications
                    </Label>
                    <p className="text-sm text-gray-500">
                      Receive email notifications for important events
                    </p>
                  </div>

                  <Switch
                    id="email-enabled"
                    checked={emailEnabled}
                    onCheckedChange={(checked) => patchPref('email_notifications_enabled', checked)}
                  />
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-medium mb-4">Notification Types</h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="wali-invitations">Wali Invitations</Label>
                        <p className="text-sm text-gray-500">When you invite or are invited as a wali</p>
                      </div>
                      <Switch
                        id="wali-invitations"
                        disabled={!emailEnabled}
                        checked={preferences.notify_wali_invitations}
                        onCheckedChange={(checked) => patchPref('notify_wali_invitations', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="intro-requests">Introduction Requests</Label>
                        <p className="text-sm text-gray-500">When someone requests an introduction</p>
                      </div>
                      <Switch
                        id="intro-requests"
                        disabled={!emailEnabled}
                        checked={preferences.notify_intro_requests}
                        onCheckedChange={(checked) => patchPref('notify_intro_requests', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="matches">Matches</Label>
                        <p className="text-sm text-gray-500">When you have a mutual match</p>
                      </div>
                      <Switch
                        id="matches"
                        disabled={!emailEnabled}
                        checked={preferences.notify_matches}
                        onCheckedChange={(checked) => patchPref('notify_matches', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="messages">Messages</Label>
                        <p className="text-sm text-gray-500">When you receive a new message</p>
                      </div>
                      <Switch
                        id="messages"
                        disabled={!emailEnabled}
                        checked={preferences.notify_messages}
                        onCheckedChange={(checked) => patchPref('notify_messages', checked)}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <Label htmlFor="frequency" className="text-base font-medium">
                    Notification Frequency
                  </Label>
                  <p className="text-sm text-gray-500 mb-3">
                    Choose how often you want to receive email notifications
                  </p>

                  <Select
                    value={preferences.notification_frequency}
                    onValueChange={(value: Frequency) => patchPref('notification_frequency', value)}
                    disabled={!emailEnabled}
                  >
                    <SelectTrigger id="frequency" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instant">Instant - Send immediately</SelectItem>
                      <SelectItem value="daily">Daily Digest - Once per day</SelectItem>
                      <SelectItem value="weekly">Weekly Digest - Once per week</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* SMS */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-emerald-600" />
                  SMS Notifications
                </CardTitle>
                <CardDescription>Receive text message alerts for critical events</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {!canUseSms ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-800">
                      📱 Verify your phone number during onboarding to enable SMS notifications
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="sms-enabled" className="text-base font-medium">
                          Enable SMS Notifications
                        </Label>
                        <p className="text-sm text-gray-500">
                          Receive SMS alerts for important events
                        </p>
                      </div>

                      <Switch
                        id="sms-enabled"
                        checked={smsEnabled}
                        onCheckedChange={(checked) => patchPref('sms_notifications_enabled', checked)}
                      />
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="font-medium mb-4">SMS Notification Types</h3>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="matches-sms">New Matches</Label>
                            <p className="text-sm text-gray-500">Get notified of mutual matches</p>
                          </div>
                          <Switch
                            id="matches-sms"
                            disabled={!smsEnabled}
                            checked={preferences.notify_matches_sms}
                            onCheckedChange={(checked) => patchPref('notify_matches_sms', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="wali-sms">Wali Approvals</Label>
                            <p className="text-sm text-gray-500">When approval is needed</p>
                          </div>
                          <Switch
                            id="wali-sms"
                            disabled={!smsEnabled}
                            checked={preferences.notify_wali_approvals_sms}
                            onCheckedChange={(checked) =>
                              patchPref('notify_wali_approvals_sms', checked)
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="messages-sms">New Messages</Label>
                            <p className="text-sm text-gray-500">Get notified of new messages</p>
                          </div>
                          <Switch
                            id="messages-sms"
                            disabled={!smsEnabled}
                            checked={preferences.notify_messages_sms}
                            onCheckedChange={(checked) => patchPref('notify_messages_sms', checked)}
                          />
                        </div>
                      </div>

                      <p className="text-xs text-gray-500 mt-4">
                        ⚠️ Rate limited to 1 SMS per 5 minutes to prevent spam
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                onClick={savePreferences}
                disabled={saving || !dirty}
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : dirty ? 'Save Preferences' : 'Saved'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  Promotional Profile Visibility
                </CardTitle>
                <CardDescription>
                  Optional. Off by default. You can turn this on or off at any time.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="promotional-use" className="text-base font-medium">
                      Allow promotional use of my profile
                    </Label>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      I want more visibility for my profile and allow AM4M to feature my profile
                      photo and profile name/kunya in AM4M social media posts, website promotions,
                      featured-member posts, ads, and other marketing materials. I understand this
                      may bring more attention to my profile while I am looking for a compatible
                      spouse, but AM4M does not guarantee views, messages, matches, marriage, or
                      any specific result. I can revoke consent for future use at any time.
                    </p>
                  </div>
                  <Switch
                    id="promotional-use"
                    checked={allowPromotionalUse}
                    disabled={promotionalUseSaving}
                    onCheckedChange={setPromotionalConsent}
                  />
                </div>

                <p className="text-xs text-gray-500">
                  Revocation stops future promotional use, but materials already posted, shared,
                  cached, screenshotted, reposted, or distributed by third parties may not be
                  fully removable.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            {TWO_FACTOR_SMS_ENABLED ? (
              <TwoFactorSetup />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-teal-600" />
                    Two-Factor Authentication
                  </CardTitle>
                  <CardDescription>
                    SMS-based two-factor authentication is temporarily unavailable. Your account is
                    still protected by email verification. Check back soon.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="account" className="space-y-6">
            {/* Pause / Resume */}
            {isAdminDisabled ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    Your account is currently disabled
                  </CardTitle>
                  <CardDescription>
                    This account has been disabled by AM4M. Please contact support if you believe
                    this was a mistake.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PauseCircle className="w-5 h-5 text-emerald-600" />
                    Pause your account
                  </CardTitle>
                  <CardDescription>
                    Take a break. You won't appear in new matches, but your existing conversations
                    and matches stay. You can resume any time.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="pause-account" className="text-base font-medium">
                        {isSelfPaused ? 'Account is paused' : 'Pause my account'}
                      </Label>
                      <p className="text-sm text-gray-600">
                        {isSelfPaused
                          ? "You're hidden from new discovery. Turn this off to come back."
                          : 'Hides you from new discovery. Existing matches and messages are preserved.'}
                      </p>
                    </div>
                    <Switch
                      id="pause-account"
                      checked={isSelfPaused}
                      disabled={pauseSaving}
                      onCheckedChange={setPauseState}
                    />
                  </div>

                  {isSelfPaused && (
                    <Alert>
                      <PauseCircle className="h-4 w-4" />
                      <AlertTitle>You are paused</AlertTitle>
                      <AlertDescription>
                        Your subscription (if any) is not affected by pause. Manage it in the
                        Billing section.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Delete account */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-red-600" />
                  Delete your account
                </CardTitle>
                <CardDescription className="text-red-700">
                  Permanent and not recoverable.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-gray-700 leading-relaxed">
                  Deleting your account permanently removes your profile, photos, likes,
                  introduction requests, matches, and the messages tied to those matches. You
                  cannot undo this. If you come back, you'll need to sign up again from scratch.
                </p>

                {hasActiveSub ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Cancel your subscription first</AlertTitle>
                    <AlertDescription className="space-y-2">
                      <p>
                        You still have an active subscription. Cancel it before deleting your
                        account so you aren't billed again.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/billing')}
                      >
                        Go to Billing
                      </Button>
                    </AlertDescription>
                  </Alert>
                ) : null}

                <Button
                  variant="destructive"
                  onClick={() => {
                    setDeleteConfirmText('');
                    setDeleteOpen(true);
                  }}
                  disabled={hasActiveSub || deleting}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete my account
                </Button>
              </CardContent>
            </Card>

            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete your account permanently?</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-2">
                    <span className="block">
                      This will remove your profile, photos, likes, introductions, matches, and
                      the messages tied to those matches. This cannot be undone.
                    </span>
                    <span className="block font-medium">
                      Type <span className="font-mono">DELETE</span> below to confirm.
                    </span>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <Input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  autoFocus
                />
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={deleting || deleteConfirmText !== 'DELETE'}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {deleting ? 'Deleting...' : 'Permanently delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TabsContent>

          {/* <TabsContent value="billing" className="space-y-6">
            <BillingManagement />
          </TabsContent> */}
        </Tabs>
      </div>
    </div>
  );
}

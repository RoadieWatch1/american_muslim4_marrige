import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Bell, Mail, MessageSquare, Save } from 'lucide-react';
import { TwoFactorSetup } from '@/components/settings/TwoFactorSetup';
import BillingManagement from '@/components/settings/BillingManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard } from 'lucide-react';


interface NotificationPreferences {
  email_notifications_enabled: boolean;
  notify_wali_invitations: boolean;
  notify_intro_requests: boolean;
  notify_matches: boolean;
  notify_messages: boolean;
  notification_frequency: 'instant' | 'daily' | 'weekly';
  sms_notifications_enabled: boolean;
  notify_matches_sms: boolean;
  notify_wali_approvals_sms: boolean;
  notify_messages_sms: boolean;
  phone_verified: boolean;
}


export default function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
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
  });


  useEffect(() => {
    loadPreferences();
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('email_notifications_enabled, notify_wali_invitations, notify_intro_requests, notify_matches, notify_messages, notification_frequency, sms_notifications_enabled, notify_matches_sms, notify_wali_approvals_sms, notify_messages_sms, phone_verified')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      if (data) {
        setPreferences(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };


  const savePreferences = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(preferences)
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Settings saved',
        description: 'Your notification preferences have been updated.',
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to save preferences. Please try again.',
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Settings
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your account, notifications, and billing
          </p>
        </div>

        <Tabs defaultValue="notifications" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              Security
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Billing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-emerald-600" />
                  Email Notifications
                </CardTitle>
                <CardDescription>
                  Control your email notification preferences
                </CardDescription>
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
                    checked={preferences.email_notifications_enabled}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, email_notifications_enabled: checked })
                    }
                  />
                </div>

                {preferences.email_notifications_enabled && (
                  <>
                    <div className="border-t pt-6">
                      <h3 className="font-medium mb-4">Notification Types</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="wali-invitations">Wali Invitations</Label>
                            <p className="text-sm text-gray-500">
                              When you invite or are invited as a wali
                            </p>
                          </div>
                          <Switch
                            id="wali-invitations"
                            checked={preferences.notify_wali_invitations}
                            onCheckedChange={(checked) =>
                              setPreferences({ ...preferences, notify_wali_invitations: checked })
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="intro-requests">Introduction Requests</Label>
                            <p className="text-sm text-gray-500">
                              When someone requests an introduction
                            </p>
                          </div>
                          <Switch
                            id="intro-requests"
                            checked={preferences.notify_intro_requests}
                            onCheckedChange={(checked) =>
                              setPreferences({ ...preferences, notify_intro_requests: checked })
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="matches">Matches</Label>
                            <p className="text-sm text-gray-500">
                              When you have a mutual match
                            </p>
                          </div>
                          <Switch
                            id="matches"
                            checked={preferences.notify_matches}
                            onCheckedChange={(checked) =>
                              setPreferences({ ...preferences, notify_matches: checked })
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="messages">Messages</Label>
                            <p className="text-sm text-gray-500">
                              When you receive a new message
                            </p>
                          </div>
                          <Switch
                            id="messages"
                            checked={preferences.notify_messages}
                            onCheckedChange={(checked) =>
                              setPreferences({ ...preferences, notify_messages: checked })
                            }
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
                        onValueChange={(value: 'instant' | 'daily' | 'weekly') =>
                          setPreferences({ ...preferences, notification_frequency: value })
                        }
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
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-emerald-600" />
                  SMS Notifications
                </CardTitle>
                <CardDescription>
                  Receive text message alerts for critical events
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!preferences.phone_verified ? (
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
                        checked={preferences.sms_notifications_enabled}
                        onCheckedChange={(checked) =>
                          setPreferences({ ...preferences, sms_notifications_enabled: checked })
                        }
                      />
                    </div>

                    {preferences.sms_notifications_enabled && (
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
                              checked={preferences.notify_matches_sms}
                              onCheckedChange={(checked) =>
                                setPreferences({ ...preferences, notify_matches_sms: checked })
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label htmlFor="wali-sms">Wali Approvals</Label>
                              <p className="text-sm text-gray-500">When approval is needed</p>
                            </div>
                            <Switch
                              id="wali-sms"
                              checked={preferences.notify_wali_approvals_sms}
                              onCheckedChange={(checked) =>
                                setPreferences({ ...preferences, notify_wali_approvals_sms: checked })
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
                              checked={preferences.notify_messages_sms}
                              onCheckedChange={(checked) =>
                                setPreferences({ ...preferences, notify_messages_sms: checked })
                              }
                            />
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-4">
                          ⚠️ Rate limited to 1 SMS per 5 minutes to prevent spam
                        </p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                onClick={savePreferences}
                disabled={saving}
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Preferences'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <TwoFactorSetup />
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <BillingManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

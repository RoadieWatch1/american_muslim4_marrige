import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/hooks/use-toast';
import WaliDashboard from '@/components/wali/WaliDashboard';
import MatchApproval from '@/components/wali/MatchApproval';
import ConversationMonitor from '@/components/wali/ConversationMonitor';
import CommunicationBoundaries from '@/components/wali/CommunicationBoundaries';
import { Shield, Users, MessageSquare, Settings, Activity, Bell } from 'lucide-react';

export default function WaliGuardianConsole() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [wardInfo, setWardInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (user) loadWardInfo();
  }, [user]);

  const loadWardInfo = async () => {
    try {
      setLoading(true);
      
      // Get ward connection
      const { data: waliLink } = await supabase
        .from('wali_links')
        .select(`
          *,
          ward:profiles!wali_links_woman_id_fkey(
            id, first_name, last_name, profile_photo_url
          )
        `)
        .eq('wali_email', user?.email)
        .eq('status', 'approved')
        .single();

      if (waliLink) {
        setWardInfo(waliLink);
        
        // Load recent notifications
        const { data: logs } = await supabase
          .from('wali_activity_logs')
          .select('*')
          .eq('ward_id', waliLink.woman_id)
          .order('created_at', { ascending: false })
          .limit(5);
        
        setNotifications(logs || []);
      }
    } catch (error) {
      console.error('Error loading ward info:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!wardInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Card>
            <CardContent className="py-16 text-center">
              <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">No Ward Connection</h2>
              <p className="text-gray-600">
                You need to be invited as a Wali to access this console.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Shield className="h-8 w-8 text-emerald-600" />
                Wali Guardian Console
              </h1>
              <p className="mt-2 text-gray-600">
                Protecting {wardInfo.ward?.first_name} {wardInfo.ward?.last_name}'s marriage journey
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
                {notifications.length > 0 && (
                  <Badge className="ml-2" variant="destructive">
                    {notifications.length}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="dashboard">
              <Activity className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="matches">
              <Users className="h-4 w-4 mr-2" />
              Match Approval
            </TabsTrigger>
            <TabsTrigger value="conversations">
              <MessageSquare className="h-4 w-4 mr-2" />
              Conversations
            </TabsTrigger>
            <TabsTrigger value="boundaries">
              <Settings className="h-4 w-4 mr-2" />
              Boundaries
            </TabsTrigger>
            <TabsTrigger value="wali-chat">
              <Shield className="h-4 w-4 mr-2" />
              Wali Network
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <WaliDashboard 
              waliId={user?.id || ''} 
              wardId={wardInfo.woman_id}
              wardName={`${wardInfo.ward?.first_name} ${wardInfo.ward?.last_name}`}
            />
          </TabsContent>

          <TabsContent value="matches">
            <MatchApproval 
              waliId={user?.id || ''} 
              wardId={wardInfo.woman_id} 
            />
          </TabsContent>

          <TabsContent value="conversations">
            <ConversationMonitor 
              waliId={user?.id || ''} 
              wardId={wardInfo.woman_id} 
            />
          </TabsContent>

          <TabsContent value="boundaries">
            <CommunicationBoundaries 
              waliId={user?.id || ''} 
              wardId={wardInfo.woman_id} 
            />
          </TabsContent>

          <TabsContent value="wali-chat">
            <Card>
              <CardHeader>
                <CardTitle>Wali Network</CardTitle>
              </CardHeader>
              <CardContent className="text-center py-12">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Connect with other Walis to discuss potential matches</p>
                <Button className="mt-4">Coming Soon</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
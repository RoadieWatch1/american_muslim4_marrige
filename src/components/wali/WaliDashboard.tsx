import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, Users, MessageSquare, Clock, AlertCircle, 
  PauseCircle, PlayCircle, Activity, Bell, Eye
} from 'lucide-react';

interface WaliDashboardProps {
  waliId: string;
  wardId: string;
  wardName: string;
}

export default function WaliDashboard({ waliId, wardId, wardName }: WaliDashboardProps) {
  const { toast } = useToast();
  const [stats, setStats] = useState({
    pendingMatches: 0,
    activeConversations: 0,
    todayMessages: 0,
    newMatches: 0
  });
  const [boundaries, setBoundaries] = useState<any>(null);
  const [matchingPaused, setMatchingPaused] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [wardId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load statistics
      const [matchesRes, conversationsRes, messagesRes, boundariesRes] = await Promise.all([
        // Pending match approvals
        supabase
          .from('match_approvals')
          .select('id')
          .eq('ward_id', wardId)
          .eq('status', 'pending'),
        
        // Active conversations
        supabase
          .from('messages')
          .select('sender_id, recipient_id')
          .or(`sender_id.eq.${wardId},recipient_id.eq.${wardId}`)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        
        // Today's messages
        supabase
          .from('messages')
          .select('id')
          .or(`sender_id.eq.${wardId},recipient_id.eq.${wardId}`)
          .gte('created_at', new Date().toISOString().split('T')[0]),
        
        // Communication boundaries
        supabase
          .from('communication_boundaries')
          .select('*')
          .eq('ward_id', wardId)
          .single()
      ]);

      // Count unique conversations
      const uniqueConversations = new Set();
      conversationsRes.data?.forEach(msg => {
        const other = msg.sender_id === wardId ? msg.recipient_id : msg.sender_id;
        uniqueConversations.add(other);
      });

      setStats({
        pendingMatches: matchesRes.data?.length || 0,
        activeConversations: uniqueConversations.size,
        todayMessages: messagesRes.data?.length || 0,
        newMatches: matchesRes.data?.filter((m: any) => 
          new Date(m.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        ).length || 0
      });

      if (boundariesRes.data) {
        setBoundaries(boundariesRes.data);
        setMatchingPaused(boundariesRes.data.pause_matching || false);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMatchingPause = async () => {
    try {
      const newPauseState = !matchingPaused;
      
      const { error } = await supabase
        .from('communication_boundaries')
        .upsert({
          ward_id: wardId,
          wali_id: waliId,
          pause_matching: newPauseState
        });

      if (error) throw error;

      setMatchingPaused(newPauseState);
      
      // Log activity
      await supabase.from('wali_activity_logs').insert({
        wali_id: waliId,
        ward_id: wardId,
        action: newPauseState ? 'paused_matching' : 'resumed_matching',
        details: { timestamp: new Date().toISOString() }
      });

      toast({
        title: newPauseState ? 'Matching Paused' : 'Matching Resumed',
        description: newPauseState 
          ? `${wardName} will not appear in searches` 
          : `${wardName} is now visible to potential matches`
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-gray-200 rounded-lg"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 bg-gray-200 rounded-lg"></div>
          <div className="h-24 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-600" />
            Guardian Overview for {wardName}
          </CardTitle>
          <CardDescription>Monitor and manage your ward's marriage search</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              {matchingPaused ? (
                <PauseCircle className="h-8 w-8 text-orange-500" />
              ) : (
                <PlayCircle className="h-8 w-8 text-green-500" />
              )}
              <div>
                <Label className="text-base font-medium">
                  Matching Status: {matchingPaused ? 'Paused' : 'Active'}
                </Label>
                <p className="text-sm text-gray-600">
                  {matchingPaused 
                    ? 'Profile hidden from searches' 
                    : 'Profile visible to potential matches'}
                </p>
              </div>
            </div>
            <Switch
              checked={!matchingPaused}
              onCheckedChange={() => toggleMatchingPause()}
            />
          </div>
        </CardContent>
      </Card>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Approvals</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.pendingMatches}</p>
              </div>
              <Users className="h-8 w-8 text-emerald-200" />
            </div>
            {stats.pendingMatches > 0 && (
              <Badge className="mt-2" variant="destructive">
                <AlertCircle className="h-3 w-3 mr-1" />
                Action Required
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Chats</p>
                <p className="text-2xl font-bold">{stats.activeConversations}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Messages</p>
                <p className="text-2xl font-bold">{stats.todayMessages}</p>
              </div>
              <Activity className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">New Matches</p>
                <p className="text-2xl font-bold">{stats.newMatches}</p>
              </div>
              <Bell className="h-8 w-8 text-orange-200" />
            </div>
            {stats.newMatches > 0 && (
              <Badge className="mt-2" variant="secondary">New</Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Communication Status */}
      {boundaries && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              Communication Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-gray-600">Daily Message Limit</span>
                <Badge variant="outline">{boundaries.max_messages_per_day} messages</Badge>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-gray-600">Allowed Hours</span>
                <Badge variant="outline">
                  {boundaries.allowed_hours_start?.slice(0, 5)} - {boundaries.allowed_hours_end?.slice(0, 5)}
                </Badge>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-gray-600">Wali Presence Required</span>
                <Badge variant={boundaries.require_wali_presence ? 'default' : 'secondary'}>
                  {boundaries.require_wali_presence ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">Auto-block Inappropriate</span>
                <Badge variant={boundaries.auto_block_inappropriate ? 'default' : 'secondary'}>
                  {boundaries.auto_block_inappropriate ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
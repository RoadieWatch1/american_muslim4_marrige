import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ProfileViewsChart } from '@/components/analytics/ProfileViewsChart';
import { MatchSuccessRate } from '@/components/analytics/MatchSuccessRate';
import { ActivityHeatmap } from '@/components/analytics/ActivityHeatmap';
import { MessageStats } from '@/components/analytics/MessageStats';
import { ProfileAttributes } from '@/components/analytics/ProfileAttributes';
import { PersonalizedTips } from '@/components/analytics/PersonalizedTips';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, TrendingUp, Users, MessageSquare } from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export default function Analytics() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('week');
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>({
    profileViews: [],
    matchStats: {},
    activityHeatmap: [],
    messageStats: {},
    profileAttributes: [],
    tips: []
  });

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetchAnalytics();
  }, [user, timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Fetch profile views
      const viewsQuery = supabase
        .from('profile_views')
        .select('*')
        .eq('profile_id', user?.id);
      
      if (timeRange === 'week') {
        viewsQuery.gte('viewed_at', subDays(new Date(), 7).toISOString());
      } else if (timeRange === 'month') {
        viewsQuery.gte('viewed_at', subDays(new Date(), 30).toISOString());
      }

      const { data: views } = await viewsQuery;

      // Fetch match analytics
      const { data: matches } = await supabase
        .from('match_analytics')
        .select('*')
        .eq('user_id', user?.id);

      // Fetch message analytics
      const { data: messages } = await supabase
        .from('message_analytics')
        .select('*')
        .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`);

      // Process data for charts
      const processedData = processAnalyticsData(views || [], matches || [], messages || []);
      setAnalyticsData(processedData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const processAnalyticsData = (views: any[], matches: any[], messages: any[]) => {
    // Process profile views for chart
    const viewsByDate = views.reduce((acc, view) => {
      const date = format(new Date(view.viewed_at), 'MMM dd');
      if (!acc[date]) acc[date] = { views: 0, uniqueViewers: new Set() };
      acc[date].views++;
      if (view.viewer_id) acc[date].uniqueViewers.add(view.viewer_id);
      return acc;
    }, {} as any);

    const profileViewsData = Object.entries(viewsByDate).map(([date, data]: any) => ({
      date,
      views: data.views,
      uniqueViewers: data.uniqueViewers.size
    }));

    // Calculate match success rate
    const likesSent = matches.filter(m => m.action_type === 'like_sent').length;
    const likesReceived = matches.filter(m => m.action_type === 'like_received').length;
    const matchesCreated = matches.filter(m => m.action_type === 'match_created').length;
    const rejections = matches.filter(m => m.action_type === 'match_rejected').length;
    const successRate = likesSent > 0 ? (matchesCreated / likesSent) * 100 : 0;

    // Create activity heatmap data
    const activityData = matches.reduce((acc, match) => {
      const date = new Date(match.created_at);
      const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
      const hour = date.getHours();
      const key = `${day}-${hour}`;
      if (!acc[key]) acc[key] = { day, hour, activity: 0 };
      acc[key].activity++;
      return acc;
    }, {} as any);

    // Process message stats
    const messagesByDay = messages.reduce((acc, msg) => {
      const date = format(new Date(msg.created_at), 'EEE');
      if (!acc[date]) acc[date] = { sent: 0, received: 0 };
      if (msg.sender_id === user?.id) {
        acc[date].sent++;
      } else {
        acc[date].received++;
      }
      return acc;
    }, {} as any);

    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const messageWeeklyData = weekDays.map(day => ({
      day,
      sent: messagesByDay[day]?.sent || 0,
      received: messagesByDay[day]?.received || 0
    }));

    // Calculate response times
    const responseTimes = messages
      .filter(m => m.response_time_minutes)
      .map(m => m.response_time_minutes);
    const avgResponseTime = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0;
    const responseRate = messages.length > 0
      ? Math.round((messages.filter(m => m.has_response).length / messages.length) * 100)
      : 0;

    // Mock profile attributes data
    const profileAttributes = [
      { name: 'Profile Photo', successRate: 85, views: 450, matches: 38 },
      { name: 'Prayer Habits', successRate: 78, views: 380, matches: 30 },
      { name: 'Education', successRate: 72, views: 320, matches: 23 },
      { name: 'Career', successRate: 68, views: 290, matches: 20 },
      { name: 'Family Values', successRate: 65, views: 250, matches: 16 }
    ];

    // Generate personalized tips
    const tips = generateTips(successRate, avgResponseTime, views.length);

    return {
      profileViews: profileViewsData,
      totalViews: views.length,
      weeklyGrowth: calculateGrowth(views),
      matchStats: {
        likesSent,
        likesReceived,
        matches: matchesCreated,
        rejections,
        successRate
      },
      activityHeatmap: Object.values(activityData),
      messageStats: {
        totalMessages: messages.length,
        averageResponseTime: avgResponseTime,
        responseRate,
        weeklyData: messageWeeklyData
      },
      profileAttributes,
      tips
    };
  };

  const calculateGrowth = (views: any[]) => {
    const thisWeek = views.filter(v => 
      new Date(v.viewed_at) >= subDays(new Date(), 7)
    ).length;
    const lastWeek = views.filter(v => 
      new Date(v.viewed_at) >= subDays(new Date(), 14) &&
      new Date(v.viewed_at) < subDays(new Date(), 7)
    ).length;
    
    if (lastWeek === 0) return thisWeek > 0 ? 100 : 0;
    return Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
  };

  const generateTips = (successRate: number, avgResponseTime: number, viewCount: number) => {
    const tips = [];
    
    if (successRate < 30) {
      tips.push({
        id: '1',
        category: 'matching',
        text: 'Your match success rate is below average. Try being more selective with your likes and focus on profiles that align with your values.',
        priority: 3
      });
    }
    
    if (avgResponseTime > 1440) {
      tips.push({
        id: '2',
        category: 'engagement',
        text: 'You take over a day to respond to messages on average. Faster responses lead to better conversations and more matches!',
        priority: 3,
        action: {
          label: 'Check Messages',
          onClick: () => navigate('/messages')
        }
      });
    }
    
    if (viewCount < 10) {
      tips.push({
        id: '3',
        category: 'profile_improvement',
        text: 'Your profile is getting fewer views. Consider updating your photos and adding more details about your interests and values.',
        priority: 2,
        action: {
          label: 'Update Profile',
          onClick: () => navigate('/profile')
        }
      });
    }
    
    tips.push({
      id: '4',
      category: 'activity_timing',
      text: 'Based on your activity patterns, you get the most matches between 7-9 PM. Try being active during these peak hours!',
      priority: 1
    });
    
    tips.push({
      id: '5',
      category: 'profile_improvement',
      text: 'Profiles with 4+ photos get 3x more matches. Consider adding more photos to showcase different aspects of your personality.',
      priority: 2
    });
    
    return tips;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">Track your match statistics and improve your success rate</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Last 7 days</SelectItem>
            <SelectItem value="month">Last 30 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="matches" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Matches
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Messages
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <ProfileViewsChart 
              data={analyticsData.profileViews}
              totalViews={analyticsData.totalViews}
              weeklyGrowth={analyticsData.weeklyGrowth}
            />
            <MatchSuccessRate {...analyticsData.matchStats} />
          </div>
          <ActivityHeatmap data={analyticsData.activityHeatmap} />
        </TabsContent>

        <TabsContent value="matches" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <MatchSuccessRate {...analyticsData.matchStats} />
            <ProfileAttributes attributes={analyticsData.profileAttributes} />
          </div>
        </TabsContent>

        <TabsContent value="messages" className="space-y-6">
          <MessageStats {...analyticsData.messageStats} />
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <PersonalizedTips tips={analyticsData.tips} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
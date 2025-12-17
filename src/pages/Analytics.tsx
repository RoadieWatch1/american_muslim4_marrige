// src/pages/Analytics.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
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

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BarChart3, TrendingUp, Users, MessageSquare } from 'lucide-react';
import { format, subDays } from 'date-fns';

type LikeRow = {
  id: string;
  from_user_id: string;
  to_user_id: string;
  type: 'like' | 'super_intro' | 'pass';
  created_at: string;
};

type MatchRow = {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
};

export default function Analytics() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>({
    profileViews: [],
    totalViews: 0,
    weeklyGrowth: 0,
    matchStats: {},
    activityHeatmap: [],
    messageStats: {},
    profileAttributes: [],
    tips: [],
  });

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, timeRange]);

  const fetchAnalytics = async () => {
    if (!user) return;
    try {
      setLoading(true);

      // ────────────────────────────
      // Time range filter
      // ────────────────────────────
      let since: Date | null = null;
      if (timeRange === 'week') since = subDays(new Date(), 7);
      if (timeRange === 'month') since = subDays(new Date(), 30);

      // ────────────────────────────
      // Likes (sent + received)
      // ────────────────────────────
      const likesQuery = supabase
        .from('likes')
        .select('*')
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`) as any;

      if (since) {
        likesQuery.gte('created_at', since.toISOString());
      }

      const {
        data: likesRaw,
        error: likesError,
      } = (await likesQuery) as { data: LikeRow[] | null; error: any };

      if (likesError) {
        console.error('Error fetching likes for analytics:', likesError);
      }

      const likes: LikeRow[] = likesRaw || [];

      // ────────────────────────────
      // Matches
      // ────────────────────────────
      const matchesQuery = supabase
        .from('matches')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`) as any;

      if (since) {
        matchesQuery.gte('created_at', since.toISOString());
      }

      const {
        data: matchesRaw,
        error: matchesError,
      } = (await matchesQuery) as { data: MatchRow[] | null; error: any };

      if (matchesError) {
        console.error('Error fetching matches for analytics:', matchesError);
      }

      const matches: MatchRow[] = matchesRaw || [];

      // ────────────────────────────
      // Messages (sent + received)
      // ────────────────────────────
      const messagesQuery = supabase
        .from('messages')
        .select('id, conversation_id, sender_id, receiver_id, created_at')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`) as any;

      if (since) {
        messagesQuery.gte('created_at', since.toISOString());
      }

      const {
        data: messagesRaw,
        error: messagesError,
      } = (await messagesQuery) as { data: MessageRow[] | null; error: any };

      if (messagesError) {
        console.error('Error fetching messages for analytics:', messagesError);
      }

      const messages: MessageRow[] = messagesRaw || [];

      const processed = processAnalyticsData(
        likes,
        matches,
        messages,
        user.id,
        navigate
      );
      setAnalyticsData(processed);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Transform likes + matches + messages into the shape widgets expect
  // ─────────────────────────────────────────────────────────────
  const processAnalyticsData = (
    likes: LikeRow[],
    matches: MatchRow[],
    messages: MessageRow[],
    userId: string,
    navigateFn: (path: string) => void
  ) => {
    // ---------------- Profile “views” (approx) ----------------
    // Treat any like / super_intro / pass directed *to* you as a view.
    const directedAtUser = likes.filter((l) => l.to_user_id === userId);

    const viewsByDate = directedAtUser.reduce((acc: any, like) => {
      const dateKey = format(new Date(like.created_at), 'MMM dd');
      if (!acc[dateKey]) {
        acc[dateKey] = { views: 0, uniqueViewers: new Set<string>() };
      }
      acc[dateKey].views += 1;
      acc[dateKey].uniqueViewers.add(like.from_user_id);
      return acc;
    }, {});

    const profileViewsData = Object.entries(viewsByDate).map(
      ([date, value]: any) => ({
        date,
        views: value.views,
        uniqueViewers: value.uniqueViewers.size,
      })
    );

    // ---------------- Match stats ----------------
    const likesSent = likes.filter(
      (l) => l.from_user_id === userId && l.type !== 'pass'
    ).length;

    const likesReceived = directedAtUser.filter(
      (l) => l.type !== 'pass'
    ).length;

    const matchesCreated = matches.length;

    const rejections = likes.filter(
      (l) => l.from_user_id === userId && l.type === 'pass'
    ).length;

    const successRate =
      likesSent > 0 ? (matchesCreated / likesSent) * 100 : 0;

    // ---------------- Activity heatmap ----------------
    // Use matches as “high-value” events on the heatmap.
    const activityDataObj = matches.reduce((acc: any, match) => {
      const d = new Date(match.created_at);
      const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
      const hour = d.getHours();
      const key = `${day}-${hour}`;
      if (!acc[key]) acc[key] = { day, hour, activity: 0 };
      acc[key].activity += 1;
      return acc;
    }, {});
    const activityHeatmap = Object.values(activityDataObj);

    // ---------------- Message stats (real data) ----------------
    const messagesForUser = messages || [];

    const totalMessages = messagesForUser.length;

    const sentMessages = messagesForUser.filter(
      (m) => m.sender_id === userId
    );
    const receivedMessages = messagesForUser.filter(
      (m) => m.receiver_id === userId
    );

    // Weekly sent/received counts
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyMap: Record<
      string,
      { day: string; sent: number; received: number }
    > = {};
    weekDays.forEach((d) => {
      weeklyMap[d] = { day: d, sent: 0, received: 0 };
    });

    messagesForUser.forEach((m) => {
      const d = new Date(m.created_at);
      const dayName = weekDays[d.getDay()];
      const bucket = weeklyMap[dayName];
      if (!bucket) return;
      if (m.sender_id === userId) bucket.sent += 1;
      if (m.receiver_id === userId) bucket.received += 1;
    });

    const weeklyData = weekDays.map((d) => weeklyMap[d]);

    // Approximate response time + response rate
    const msgsByConversation: Record<string, MessageRow[]> = {};
    messagesForUser.forEach((m) => {
      if (!msgsByConversation[m.conversation_id]) {
        msgsByConversation[m.conversation_id] = [];
      }
      msgsByConversation[m.conversation_id].push(m);
    });

    const responseDurationsMinutes: number[] = [];
    const incomingConversations = new Set<string>();
    const conversationsWithReply = new Set<string>();

    Object.entries(msgsByConversation).forEach(([convId, msgs]) => {
      const sorted = msgs.slice().sort((a, b) => {
        return (
          new Date(a.created_at).getTime() -
          new Date(b.created_at).getTime()
        );
      });

      let hasIncoming = false;
      let hasReply = false;

      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        const curr = sorted[i];

        if (prev.receiver_id === userId) {
          hasIncoming = true;
        }

        // someone else -> you reply
        if (prev.sender_id !== userId && curr.sender_id === userId) {
          const diffMs =
            new Date(curr.created_at).getTime() -
            new Date(prev.created_at).getTime();
          const diffMinutes = diffMs / (1000 * 60);
          responseDurationsMinutes.push(diffMinutes);
          hasReply = true;
        }
      }

      if (hasIncoming) incomingConversations.add(convId);
      if (hasReply) conversationsWithReply.add(convId);
    });

    const averageResponseTime =
      responseDurationsMinutes.length > 0
        ? responseDurationsMinutes.reduce((a, b) => a + b, 0) /
          responseDurationsMinutes.length
        : 0;

    const responseRate =
      incomingConversations.size > 0
        ? Math.round(
            (conversationsWithReply.size / incomingConversations.size) * 100
          )
        : 0;

    const messageStats = {
      totalMessages,
      averageResponseTime, // in minutes
      responseRate,
      weeklyData,
    };

    // ---------------- Profile attributes (still heuristic / static) ----------------
    const profileAttributes = [
      { name: 'Profile Photo', successRate: 85, views: 450, matches: 38 },
      { name: 'Prayer Habits', successRate: 78, views: 380, matches: 30 },
      { name: 'Education', successRate: 72, views: 320, matches: 23 },
      { name: 'Career', successRate: 68, views: 290, matches: 20 },
      { name: 'Family Values', successRate: 65, views: 250, matches: 16 },
    ];

    const tips = generateTips(
      successRate,
      averageResponseTime,
      directedAtUser.length,
      navigateFn
    );

    return {
      profileViews: profileViewsData,
      totalViews: directedAtUser.length,
      weeklyGrowth: calculateGrowth(directedAtUser),
      matchStats: {
        likesSent,
        likesReceived,
        matches: matchesCreated,
        rejections,
        successRate,
      },
      activityHeatmap,
      messageStats,
      profileAttributes,
      tips,
    };
  };

  // Growth based on “views” in last 7 days vs previous 7 days
  const calculateGrowth = (directedLikes: LikeRow[]) => {
    const now = new Date();
    const sevenDaysAgo = subDays(now, 7);
    const fourteenDaysAgo = subDays(now, 14);

    const thisWeek = directedLikes.filter(
      (l) => new Date(l.created_at) >= sevenDaysAgo
    ).length;

    const lastWeek = directedLikes.filter((l) => {
      const d = new Date(l.created_at);
      return d >= fourteenDaysAgo && d < sevenDaysAgo;
    }).length;

    if (lastWeek === 0) return thisWeek > 0 ? 100 : 0;
    return Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
  };

  const generateTips = (
    successRate: number,
    avgResponseTimeMinutes: number,
    viewCount: number,
    navigateFn: (path: string) => void
  ) => {
    const tips: any[] = [];

    if (successRate < 30) {
      tips.push({
        id: '1',
        category: 'matching',
        text: 'Your match success rate is below average. Try being more selective with your likes and focus on profiles that align with your values.',
        priority: 3,
      });
    }

    // avgResponseTimeMinutes is in minutes – 1440 = 24h
    if (avgResponseTimeMinutes > 1440) {
      tips.push({
        id: '2',
        category: 'engagement',
        text: 'You take over a day to respond to messages on average. Faster responses lead to better conversations and more matches!',
        priority: 3,
        action: {
          label: 'Check Messages',
          onClick: () => navigateFn('/messages'),
        },
      });
    }

    if (viewCount < 10) {
      tips.push({
        id: '3',
        category: 'profile_improvement',
        text: 'Your profile is getting fewer interactions. Consider updating your photos and adding more details about your interests and values.',
        priority: 2,
        action: {
          label: 'Update Profile',
          onClick: () => navigateFn('/profile'),
        },
      });
    }

    tips.push({
      id: '4',
      category: 'activity_timing',
      text: 'Try being active during the evening hours – that’s when most users tend to like and match.',
      priority: 1,
    });

    tips.push({
      id: '5',
      category: 'profile_improvement',
      text: 'Profiles with 4+ photos typically get more matches. Consider adding a few more photos.',
      priority: 2,
    });

    return tips;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Track your match statistics and improve your success rate
          </p>
        </div>
        <Select
          value={timeRange}
          onValueChange={(v) =>
            setTimeRange(v as 'week' | 'month' | 'all')
          }
        >
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
            <ProfileAttributes
              attributes={analyticsData.profileAttributes}
            />
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





// // src/pages/Analytics.tsx
// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '@/contexts/AuthContext';
// import { supabase } from '@/lib/supabase';

// import { ProfileViewsChart } from '@/components/analytics/ProfileViewsChart';
// import { MatchSuccessRate } from '@/components/analytics/MatchSuccessRate';
// import { ActivityHeatmap } from '@/components/analytics/ActivityHeatmap';
// import { MessageStats } from '@/components/analytics/MessageStats';
// import { ProfileAttributes } from '@/components/analytics/ProfileAttributes';
// import { PersonalizedTips } from '@/components/analytics/PersonalizedTips';

// import {
//   Tabs,
//   TabsContent,
//   TabsList,
//   TabsTrigger,
// } from '@/components/ui/tabs';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';
// import { BarChart3, TrendingUp, Users, MessageSquare } from 'lucide-react';
// import { format, subDays } from 'date-fns';

// type LikeRow = {
//   id: string;
//   from_user_id: string;
//   to_user_id: string;
//   type: 'like' | 'super_intro' | 'pass';
//   created_at: string;
// };

// type MatchRow = {
//   id: string;
//   user1_id: string;
//   user2_id: string;
//   created_at: string;
// };

// export default function Analytics() {
//   const { user } = useAuth();
//   const navigate = useNavigate();
//   const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');
//   const [loading, setLoading] = useState(true);
//   const [analyticsData, setAnalyticsData] = useState<any>({
//     profileViews: [],
//     totalViews: 0,
//     weeklyGrowth: 0,
//     matchStats: {},
//     activityHeatmap: [],
//     messageStats: {},
//     profileAttributes: [],
//     tips: [],
//   });

//   useEffect(() => {
//     if (!user) {
//       navigate('/');
//       return;
//     }
//     fetchAnalytics();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [user, timeRange]);

//   const fetchAnalytics = async () => {
//     if (!user) return;
//     try {
//       setLoading(true);

//       // ────────────────────────────
//       // Time range filter
//       // ────────────────────────────
//       let since: Date | null = null;
//       if (timeRange === 'week') since = subDays(new Date(), 7);
//       if (timeRange === 'month') since = subDays(new Date(), 30);

//       // ────────────────────────────
//       // Likes (sent + received)
//       // ────────────────────────────
//       const likesQuery = supabase
//         .from('likes')
//         .select('*')
//         .or(
//           `from_user_id.eq.${user.id},to_user_id.eq.${user.id}`
//         ) as any;

//       if (since) {
//         likesQuery.gte('created_at', since.toISOString());
//       }

//       const { data: likesRaw, error: likesError } =
//         await likesQuery as { data: LikeRow[] | null; error: any };

//       if (likesError) {
//         console.error('Error fetching likes for analytics:', likesError);
//       }

//       const likes: LikeRow[] = likesRaw || [];

//       // ────────────────────────────
//       // Matches
//       // ────────────────────────────
//       const matchesQuery = supabase
//         .from('matches')
//         .select('*')
//         .or(
//           `user1_id.eq.${user.id},user2_id.eq.${user.id}`
//         ) as any;

//       if (since) {
//         matchesQuery.gte('created_at', since.toISOString());
//       }

//       const { data: matchesRaw, error: matchesError } =
//         await matchesQuery as { data: MatchRow[] | null; error: any };

//       if (matchesError) {
//         console.error('Error fetching matches for analytics:', matchesError);
//       }

//       const matches: MatchRow[] = matchesRaw || [];

//       const processed = processAnalyticsData(likes, matches, user.id, navigate);
//       setAnalyticsData(processed);
//     } catch (error) {
//       console.error('Error fetching analytics:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ─────────────────────────────────────────────────────────────
//   // Transform likes + matches into the shape the widgets expect
//   // ─────────────────────────────────────────────────────────────
//   const processAnalyticsData = (
//     likes: LikeRow[],
//     matches: MatchRow[],
//     userId: string,
//     navigateFn: (path: string) => void
//   ) => {
//     // ---------------- Profile “views” (approx) ----------------
//     // Treat any like / super_intro / pass directed *to* you as a view.
//     const directedAtUser = likes.filter((l) => l.to_user_id === userId);

//     const viewsByDate = directedAtUser.reduce((acc: any, like) => {
//       const dateKey = format(new Date(like.created_at), 'MMM dd');
//       if (!acc[dateKey]) {
//         acc[dateKey] = { views: 0, uniqueViewers: new Set<string>() };
//       }
//       acc[dateKey].views += 1;
//       acc[dateKey].uniqueViewers.add(like.from_user_id);
//       return acc;
//     }, {});

//     const profileViewsData = Object.entries(viewsByDate).map(
//       ([date, value]: any) => ({
//         date,
//         views: value.views,
//         uniqueViewers: value.uniqueViewers.size,
//       })
//     );

//     // ---------------- Match stats ----------------
//     const likesSent = likes.filter(
//       (l) => l.from_user_id === userId && l.type !== 'pass'
//     ).length;

//     const likesReceived = directedAtUser.filter(
//       (l) => l.type !== 'pass'
//     ).length;

//     const matchesCreated = matches.length;

//     const rejections = likes.filter(
//       (l) => l.from_user_id === userId && l.type === 'pass'
//     ).length;

//     const successRate =
//       likesSent > 0 ? (matchesCreated / likesSent) * 100 : 0;

//     // ---------------- Activity heatmap ----------------
//     // Use matches as “high-value” events on the heatmap.
//     const activityDataObj = matches.reduce((acc: any, match) => {
//       const d = new Date(match.created_at);
//       const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
//       const hour = d.getHours();
//       const key = `${day}-${hour}`;
//       if (!acc[key]) acc[key] = { day, hour, activity: 0 };
//       acc[key].activity += 1;
//       return acc;
//     }, {});
//     const activityHeatmap = Object.values(activityDataObj);

//     // ---------------- Message stats (placeholder for now) ----------------
//     const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
//     const messageWeeklyData = weekDays.map((day) => ({
//       day,
//       sent: 0,
//       received: 0,
//     }));

//     const messageStats = {
//       totalMessages: 0,
//       averageResponseTime: 0,
//       responseRate: 0,
//       weeklyData: messageWeeklyData,
//     };

//     // ---------------- Mock profile attributes ----------------
//     const profileAttributes = [
//       { name: 'Profile Photo', successRate: 85, views: 450, matches: 38 },
//       { name: 'Prayer Habits', successRate: 78, views: 380, matches: 30 },
//       { name: 'Education', successRate: 72, views: 320, matches: 23 },
//       { name: 'Career', successRate: 68, views: 290, matches: 20 },
//       { name: 'Family Values', successRate: 65, views: 250, matches: 16 },
//     ];

//     const tips = generateTips(
//       successRate,
//       0, // avg response time (we don't have messages yet)
//       directedAtUser.length,
//       navigateFn
//     );

//     return {
//       profileViews: profileViewsData,
//       totalViews: directedAtUser.length,
//       weeklyGrowth: calculateGrowth(directedAtUser),
//       matchStats: {
//         likesSent,
//         likesReceived,
//         matches: matchesCreated,
//         rejections,
//         successRate,
//       },
//       activityHeatmap,
//       messageStats,
//       profileAttributes,
//       tips,
//     };
//   };

//   // Growth based on “views” in last 7 days vs previous 7 days
//   const calculateGrowth = (directedLikes: LikeRow[]) => {
//     const now = new Date();
//     const sevenDaysAgo = subDays(now, 7);
//     const fourteenDaysAgo = subDays(now, 14);

//     const thisWeek = directedLikes.filter(
//       (l) => new Date(l.created_at) >= sevenDaysAgo
//     ).length;

//     const lastWeek = directedLikes.filter((l) => {
//       const d = new Date(l.created_at);
//       return d >= fourteenDaysAgo && d < sevenDaysAgo;
//     }).length;

//     if (lastWeek === 0) return thisWeek > 0 ? 100 : 0;
//     return Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
//   };

//   const generateTips = (
//     successRate: number,
//     avgResponseTime: number,
//     viewCount: number,
//     navigateFn: (path: string) => void
//   ) => {
//     const tips: any[] = [];

//     if (successRate < 30) {
//       tips.push({
//         id: '1',
//         category: 'matching',
//         text: 'Your match success rate is below average. Try being more selective with your likes and focus on profiles that align with your values.',
//         priority: 3,
//       });
//     }

//     if (avgResponseTime > 1440) {
//       tips.push({
//         id: '2',
//         category: 'engagement',
//         text: 'You take over a day to respond to messages on average. Faster responses lead to better conversations and more matches!',
//         priority: 3,
//         action: {
//           label: 'Check Messages',
//           onClick: () => navigateFn('/messages'),
//         },
//       });
//     }

//     if (viewCount < 10) {
//       tips.push({
//         id: '3',
//         category: 'profile_improvement',
//         text: 'Your profile is getting fewer interactions. Consider updating your photos and adding more details about your interests and values.',
//         priority: 2,
//         action: {
//           label: 'Update Profile',
//           onClick: () => navigateFn('/profile'),
//         },
//       });
//     }

//     tips.push({
//       id: '4',
//       category: 'activity_timing',
//       text: 'Try being active during the evening hours – that’s when most users tend to like and match.',
//       priority: 1,
//     });

//     tips.push({
//       id: '5',
//       category: 'profile_improvement',
//       text: 'Profiles with 4+ photos typically get more matches. Consider adding a few more photos.',
//       priority: 2,
//     });

//     return tips;
//   };

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
//       </div>
//     );
//   }

//   return (
//     <div className="container mx-auto px-4 py-8 max-w-7xl">
//       <div className="flex items-center justify-between mb-8">
//         <div>
//           <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
//           <p className="text-muted-foreground mt-1">
//             Track your match statistics and improve your success rate
//           </p>
//         </div>
//         <Select
//           value={timeRange}
//           onValueChange={(v) =>
//             setTimeRange(v as 'week' | 'month' | 'all')
//           }
//         >
//           <SelectTrigger className="w-32">
//             <SelectValue />
//           </SelectTrigger>
//           <SelectContent>
//             <SelectItem value="week">Last 7 days</SelectItem>
//             <SelectItem value="month">Last 30 days</SelectItem>
//             <SelectItem value="all">All time</SelectItem>
//           </SelectContent>
//         </Select>
//       </div>

//       <Tabs defaultValue="overview" className="space-y-6">
//         <TabsList className="grid w-full grid-cols-4 max-w-2xl">
//           <TabsTrigger value="overview" className="flex items-center gap-2">
//             <BarChart3 className="h-4 w-4" />
//             Overview
//           </TabsTrigger>
//           <TabsTrigger value="matches" className="flex items-center gap-2">
//             <Users className="h-4 w-4" />
//             Matches
//           </TabsTrigger>
//           <TabsTrigger value="messages" className="flex items-center gap-2">
//             <MessageSquare className="h-4 w-4" />
//             Messages
//           </TabsTrigger>
//           <TabsTrigger value="insights" className="flex items-center gap-2">
//             <TrendingUp className="h-4 w-4" />
//             Insights
//           </TabsTrigger>
//         </TabsList>

//         <TabsContent value="overview" className="space-y-6">
//           <div className="grid gap-6 md:grid-cols-2">
//             <ProfileViewsChart
//               data={analyticsData.profileViews}
//               totalViews={analyticsData.totalViews}
//               weeklyGrowth={analyticsData.weeklyGrowth}
//             />
//             <MatchSuccessRate {...analyticsData.matchStats} />
//           </div>
//           <ActivityHeatmap data={analyticsData.activityHeatmap} />
//         </TabsContent>

//         <TabsContent value="matches" className="space-y-6">
//           <div className="grid gap-6 md:grid-cols-2">
//             <MatchSuccessRate {...analyticsData.matchStats} />
//             <ProfileAttributes
//               attributes={analyticsData.profileAttributes}
//             />
//           </div>
//         </TabsContent>

//         <TabsContent value="messages" className="space-y-6">
//           <MessageStats {...analyticsData.messageStats} />
//         </TabsContent>

//         <TabsContent value="insights" className="space-y-6">
//           <PersonalizedTips tips={analyticsData.tips} />
//         </TabsContent>
//       </Tabs>
//     </div>
//   );
// }

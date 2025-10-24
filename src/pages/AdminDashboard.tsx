import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserManagement } from '@/components/admin/UserManagement';
import { ReportedProfiles } from '@/components/admin/ReportedProfiles';
import { ActivityLogViewer } from '@/components/admin/ActivityLogViewer';
import { CronJobMonitor } from '@/components/admin/CronJobMonitor';
import { DigestAnalytics } from '@/components/admin/DigestAnalytics';
import { Users, AlertTriangle, Activity, Mail, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0, pendingReports: 0, admins: 0 });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const { data: profiles } = await supabase.from('profiles').select('is_active, is_admin');
    const { data: reports } = await supabase.from('reported_profiles').select('id').eq('status', 'pending');
    
    setStats({
      totalUsers: profiles?.length || 0,
      activeUsers: profiles?.filter(p => p.is_active !== false).length || 0,
      pendingReports: reports?.length || 0,
      admins: profiles?.filter(p => p.is_admin).length || 0
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4" />Total Users
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.totalUsers}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="w-4 h-4" />Active Users
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.activeUsers}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />Pending Reports
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.pendingReports}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="w-4 h-4" />Admins
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.admins}</div></CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="reports">Reported Profiles</TabsTrigger>
            <TabsTrigger value="activity">Activity Logs</TabsTrigger>
            <TabsTrigger value="email">Email System</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <UserManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Reported Profiles</CardTitle>
              </CardHeader>
              <CardContent>
                <ReportedProfiles />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <ActivityLogViewer startDate={new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} endDate={new Date().toISOString().split('T')[0]} />
          </TabsContent>

          <TabsContent value="email">
            <div className="space-y-4">
              <CronJobMonitor jobs={[]} />
              <DigestAnalytics volumeData={[]} typeData={[]} successRate={95} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

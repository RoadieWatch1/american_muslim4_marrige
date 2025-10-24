import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Calendar, User, Activity, Download, FileJson, FileText } from 'lucide-react';


interface ActivityLog {
  id: string;
  admin_id: string;
  action_type: string;
  details: Record<string, any>;
  ip_address: string;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

interface ActivityLogViewerProps {
  startDate?: string;
  endDate?: string;
}

export const ActivityLogViewer = ({ startDate, endDate }: ActivityLogViewerProps) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>('all');

  useEffect(() => {
    fetchLogs();
  }, [startDate, endDate, actionFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('admin_activity_logs')
        .select(`
          *,
          profiles:admin_id (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }
      if (actionFilter !== 'all') {
        query = query.eq('action_type', actionFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadgeColor = (actionType: string) => {
    const colors: Record<string, string> = {
      view_analytics: 'bg-blue-100 text-blue-800',
      trigger_digest: 'bg-purple-100 text-purple-800',
      view_user_data: 'bg-yellow-100 text-yellow-800',
      view_cron_logs: 'bg-green-100 text-green-800',
      access_dashboard: 'bg-gray-100 text-gray-800',
    };
    return colors[actionType] || 'bg-gray-100 text-gray-800';
  };

  const exportToCSV = () => {
    if (logs.length === 0) return;

    const headers = ['Timestamp', 'Admin Name', 'Admin Email', 'Action Type', 'Details', 'IP Address'];
    const csvRows = [headers.join(',')];

    logs.forEach((log) => {
      const row = [
        new Date(log.created_at).toISOString(),
        log.profiles?.full_name || 'Unknown',
        log.profiles?.email || 'N/A',
        log.action_type,
        JSON.stringify(log.details).replace(/"/g, '""'),
        log.ip_address,
      ];
      csvRows.push(row.map(cell => `"${cell}"`).join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `admin_activity_logs_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = () => {
    if (logs.length === 0) return;

    const exportData = logs.map((log) => ({
      timestamp: log.created_at,
      admin_name: log.profiles?.full_name || 'Unknown',
      admin_email: log.profiles?.email || 'N/A',
      action_type: log.action_type,
      details: log.details,
      ip_address: log.ip_address,
    }));

    const jsonContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `admin_activity_logs_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Admin Activity
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              onClick={exportToCSV}
              disabled={logs.length === 0}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              Export CSV
            </Button>
            <Button
              onClick={exportToJSON}
              disabled={logs.length === 0}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <FileJson className="h-4 w-4" />
              Export JSON
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="view_analytics">View Analytics</SelectItem>
              <SelectItem value="trigger_digest">Trigger Digest</SelectItem>
              <SelectItem value="view_user_data">View User Data</SelectItem>
              <SelectItem value="view_cron_logs">View Cron Logs</SelectItem>
              <SelectItem value="access_dashboard">Access Dashboard</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading activity logs...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No activity logs found</div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">
                      {log.profiles?.full_name || 'Unknown Admin'}
                    </span>
                    <Badge className={getActionBadgeColor(log.action_type)}>
                      {log.action_type.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Calendar className="h-3 w-3" />
                    {new Date(log.created_at).toLocaleString()}
                  </div>
                </div>
                {Object.keys(log.details).length > 0 && (
                  <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    <strong>Details:</strong> {JSON.stringify(log.details, null, 2)}
                  </div>
                )}
                <div className="mt-2 text-xs text-gray-400">
                  IP: {log.ip_address}
                </div>
              </div>
            ))}

          </div>
        )}
      </CardContent>
    </Card>
  );
};

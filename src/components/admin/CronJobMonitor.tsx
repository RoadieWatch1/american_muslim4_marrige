import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface CronJob {
  id: string;
  job_name: string;
  status: 'success' | 'error';
  executed_at: string;
  duration_ms: number;
  emails_sent: number;
  notifications_processed: number;
  error_message?: string;
}

interface Props {
  jobs: CronJob[];
}

export function CronJobMonitor({ jobs }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Cron Job Executions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {jobs.map((job) => (
            <div key={job.id} className="flex items-start justify-between p-3 border rounded-lg">
              <div className="flex items-start gap-3 flex-1">
                {job.status === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{job.job_name}</span>
                    <Badge variant={job.status === 'success' ? 'default' : 'destructive'}>
                      {job.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {new Date(job.executed_at).toLocaleString()}
                    </div>
                    <div>
                      {job.emails_sent} emails sent • {job.notifications_processed} notifications • {job.duration_ms}ms
                    </div>
                    {job.error_message && (
                      <div className="text-red-600 mt-2">{job.error_message}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {jobs.length === 0 && (
            <p className="text-center text-gray-500 py-8">No cron job executions found</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

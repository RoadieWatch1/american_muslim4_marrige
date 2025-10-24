import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { AlertTriangle, Eye, CheckCircle, XCircle } from 'lucide-react';

export function ReportedProfiles() {
  const [reports, setReports] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadReports();
  }, [statusFilter]);

  const loadReports = async () => {
    const query = supabase
      .from('reported_profiles')
      .select(`
        *,
        reporter:reporter_id(first_name, last_name, email),
        reported_user:reported_user_id(first_name, last_name, email)
      `)
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query.eq('status', statusFilter);
    }

    const { data } = await query;
    setReports(data || []);
  };

  const updateReport = async (reportId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('reported_profiles')
        .update({
          status,
          admin_notes: adminNotes,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (error) throw error;
      toast({ title: 'Success', description: 'Report updated successfully' });
      setSelectedReport(null);
      setAdminNotes('');
      loadReports();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Reports</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Reported User</TableHead>
            <TableHead>Reporter</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map(report => (
            <TableRow key={report.id}>
              <TableCell>{report.reported_user?.first_name} {report.reported_user?.last_name}</TableCell>
              <TableCell>{report.reporter?.first_name} {report.reporter?.last_name}</TableCell>
              <TableCell>{report.reason}</TableCell>
              <TableCell>
                <Badge variant={report.status === 'pending' ? 'destructive' : 'default'}>
                  {report.status}
                </Badge>
              </TableCell>
              <TableCell>{new Date(report.created_at).toLocaleDateString()}</TableCell>
              <TableCell>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" onClick={() => { setSelectedReport(report); setAdminNotes(report.admin_notes || ''); }}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Report Details</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div><strong>Reason:</strong> {report.reason}</div>
                      <div><strong>Description:</strong> {report.description}</div>
                      <Textarea placeholder="Admin notes..." value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} />
                      <div className="flex gap-2">
                        <Button onClick={() => updateReport(report.id, 'resolved')}><CheckCircle className="w-4 h-4 mr-2" />Resolve</Button>
                        <Button variant="outline" onClick={() => updateReport(report.id, 'dismissed')}><XCircle className="w-4 h-4 mr-2" />Dismiss</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

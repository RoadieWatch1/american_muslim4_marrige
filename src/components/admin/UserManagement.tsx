import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Search, UserX, UserCheck, Shield, RefreshCw } from 'lucide-react';

export function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [search, roleFilter, statusFilter, users]);

  const loadUsers = async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setUsers(data || []);
    setLoading(false);
  };

  const filterUsers = () => {
    let filtered = users;
    if (search) {
      filtered = filtered.filter(u => 
        u.first_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.last_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (roleFilter !== 'all') filtered = filtered.filter(u => u.role === roleFilter);
    if (statusFilter === 'active') filtered = filtered.filter(u => u.is_active !== false);
    if (statusFilter === 'disabled') filtered = filtered.filter(u => u.is_active === false);
    setFilteredUsers(filtered);
  };

  const handleAction = async (action: string, userId: string) => {
    try {
      const { error } = await supabase.functions.invoke('admin-user-actions', {
        body: { action, userId, adminId: user?.id }
      });
      if (error) throw error;
      toast({ title: 'Success', description: `User ${action} successfully` });
      loadUsers();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="wali">Wali</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="disabled">Disabled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>2FA</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredUsers.map(u => (
            <TableRow key={u.id}>
              <TableCell>{u.first_name} {u.last_name}</TableCell>
              <TableCell>{u.email}</TableCell>
              <TableCell><Badge variant="outline">{u.role}</Badge></TableCell>
              <TableCell><Badge variant={u.is_active !== false ? 'default' : 'destructive'}>{u.is_active !== false ? 'Active' : 'Disabled'}</Badge></TableCell>
              <TableCell>{u.two_factor_enabled ? '✓' : '✗'}</TableCell>
              <TableCell className="space-x-2">
                {u.is_active !== false ? (
                  <Button size="sm" variant="destructive" onClick={() => handleAction('disable', u.id)}><UserX className="w-4 h-4" /></Button>
                ) : (
                  <Button size="sm" variant="default" onClick={() => handleAction('enable', u.id)}><UserCheck className="w-4 h-4" /></Button>
                )}
                {u.two_factor_enabled && <Button size="sm" variant="outline" onClick={() => handleAction('reset_2fa', u.id)}><Shield className="w-4 h-4" /></Button>}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

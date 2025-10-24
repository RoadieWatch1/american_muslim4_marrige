import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Trash2, Search, Plus, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { SavedSearch, AdvancedSearchFilters } from '@/types/search';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  onApplySearch: (filters: AdvancedSearchFilters) => void;
  currentFilters: AdvancedSearchFilters;
}

export default function SavedSearchesComponent({ onApplySearch, currentFilters }: Props) {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSavedSearches();
  }, []);

  const loadSavedSearches = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('saved_searches')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedSearches(data || []);
    } catch (error) {
      console.error('Error loading saved searches:', error);
      toast({
        title: 'Error',
        description: 'Failed to load saved searches',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const saveCurrentSearch = async () => {
    if (!searchName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a name for this search',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('saved_searches')
        .insert({
          user_id: user.id,
          name: searchName,
          filters: currentFilters,
          notification_enabled: notificationEnabled
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Search saved successfully'
      });

      setSaveDialogOpen(false);
      setSearchName('');
      loadSavedSearches();
    } catch (error) {
      console.error('Error saving search:', error);
      toast({
        title: 'Error',
        description: 'Failed to save search',
        variant: 'destructive'
      });
    }
  };

  const toggleNotifications = async (searchId: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('saved_searches')
        .update({ notification_enabled: enabled })
        .eq('id', searchId);

      if (error) throw error;

      setSavedSearches(prev =>
        prev.map(s => s.id === searchId ? { ...s, notificationEnabled: enabled } : s)
      );

      toast({
        title: 'Success',
        description: `Notifications ${enabled ? 'enabled' : 'disabled'}`
      });
    } catch (error) {
      console.error('Error updating notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to update notification settings',
        variant: 'destructive'
      });
    }
  };

  const deleteSearch = async (searchId: string) => {
    try {
      const { error } = await supabase
        .from('saved_searches')
        .delete()
        .eq('id', searchId);

      if (error) throw error;

      setSavedSearches(prev => prev.filter(s => s.id !== searchId));
      
      toast({
        title: 'Success',
        description: 'Search deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting search:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete search',
        variant: 'destructive'
      });
    }
  };

  const getFilterSummary = (filters: AdvancedSearchFilters) => {
    const parts = [];
    if (filters.minAge && filters.maxAge) {
      parts.push(`Age ${filters.minAge}-${filters.maxAge}`);
    }
    if (filters.city) parts.push(filters.city);
    if (filters.educationLevel?.length) {
      parts.push(`${filters.educationLevel.length} education levels`);
    }
    if (filters.prayerFrequency?.length) {
      parts.push(`${filters.prayerFrequency.length} prayer preferences`);
    }
    return parts.join(', ') || 'No filters';
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Saved Searches</h3>
        <Button
          size="sm"
          onClick={() => setSaveDialogOpen(true)}
          disabled={Object.keys(currentFilters).length === 0}
        >
          <Plus className="h-4 w-4 mr-2" />
          Save Current
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : savedSearches.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No saved searches yet</p>
            <p className="text-sm text-gray-500 mt-2">
              Save your search filters to quickly apply them later
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {savedSearches.map((search) => (
            <Card key={search.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{search.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {getFilterSummary(search.filters)}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={search.notificationEnabled}
                      onCheckedChange={(checked) => toggleNotifications(search.id, checked)}
                    />
                    {search.notificationEnabled ? (
                      <Bell className="h-4 w-4 text-green-600" />
                    ) : (
                      <BellOff className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>
                      Last checked {formatDistanceToNow(new Date(search.lastChecked), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onApplySearch(search.filters)}
                    >
                      Apply
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteSearch(search.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Search</DialogTitle>
            <DialogDescription>
              Give your search a name to easily find and apply it later
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="search-name">Search Name</Label>
              <Input
                id="search-name"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="e.g., Local professionals with similar values"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications">
                Get notified when new matches join
              </Label>
              <Switch
                id="notifications"
                checked={notificationEnabled}
                onCheckedChange={setNotificationEnabled}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveCurrentSearch}>Save Search</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
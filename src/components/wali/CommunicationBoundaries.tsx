import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { Shield, Clock, MessageSquare, AlertCircle, Save } from 'lucide-react';

interface CommunicationBoundariesProps {
  waliId: string;
  wardId: string;
}

export default function CommunicationBoundaries({ waliId, wardId }: CommunicationBoundariesProps) {
  const { toast } = useToast();
  const [boundaries, setBoundaries] = useState({
    max_messages_per_day: 50,
    allowed_hours_start: '09:00',
    allowed_hours_end: '21:00',
    require_wali_presence: false,
    auto_block_inappropriate: true,
    pause_matching: false
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBoundaries();
  }, [wardId]);

  const loadBoundaries = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('communication_boundaries')
        .select('*')
        .eq('ward_id', wardId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setBoundaries({
          max_messages_per_day: data.max_messages_per_day || 50,
          allowed_hours_start: data.allowed_hours_start?.slice(0, 5) || '09:00',
          allowed_hours_end: data.allowed_hours_end?.slice(0, 5) || '21:00',
          require_wali_presence: data.require_wali_presence || false,
          auto_block_inappropriate: data.auto_block_inappropriate !== false,
          pause_matching: data.pause_matching || false
        });
      }
    } catch (error) {
      console.error('Error loading boundaries:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveBoundaries = async () => {
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('communication_boundaries')
        .upsert({
          ward_id: wardId,
          wali_id: waliId,
          max_messages_per_day: boundaries.max_messages_per_day,
          allowed_hours_start: `${boundaries.allowed_hours_start}:00`,
          allowed_hours_end: `${boundaries.allowed_hours_end}:00`,
          require_wali_presence: boundaries.require_wali_presence,
          auto_block_inappropriate: boundaries.auto_block_inappropriate,
          pause_matching: boundaries.pause_matching,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Log activity
      await supabase.from('wali_activity_logs').insert({
        wali_id: waliId,
        ward_id: wardId,
        action: 'updated_boundaries',
        details: boundaries
      });

      toast({
        title: 'Settings Saved',
        description: 'Communication boundaries have been updated.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-96 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-emerald-600" />
          Communication Boundaries
        </CardTitle>
        <CardDescription>
          Set rules and limits for your ward's interactions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Message Limits */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Daily Message Limit: {boundaries.max_messages_per_day}
          </Label>
          <Slider
            value={[boundaries.max_messages_per_day]}
            onValueChange={([value]) => setBoundaries(prev => ({ ...prev, max_messages_per_day: value }))}
            min={10}
            max={200}
            step={10}
            className="w-full"
          />
          <p className="text-sm text-gray-600">
            Limit the number of messages your ward can send per day
          </p>
        </div>

        {/* Allowed Hours */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Allowed Communication Hours
          </Label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start-time" className="text-sm">Start Time</Label>
              <Input
                id="start-time"
                type="time"
                value={boundaries.allowed_hours_start}
                onChange={(e) => setBoundaries(prev => ({ ...prev, allowed_hours_start: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="end-time" className="text-sm">End Time</Label>
              <Input
                id="end-time"
                type="time"
                value={boundaries.allowed_hours_end}
                onChange={(e) => setBoundaries(prev => ({ ...prev, allowed_hours_end: e.target.value }))}
              />
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Messages outside these hours will be held for review
          </p>
        </div>

        {/* Wali Presence */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="space-y-0.5">
            <Label className="text-base">Require Wali Presence</Label>
            <p className="text-sm text-gray-600">
              All conversations must have wali actively monitoring
            </p>
          </div>
          <Switch
            checked={boundaries.require_wali_presence}
            onCheckedChange={(checked) => setBoundaries(prev => ({ ...prev, require_wali_presence: checked }))}
          />
        </div>

        {/* Auto-block Inappropriate */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="space-y-0.5">
            <Label className="text-base">Auto-block Inappropriate Content</Label>
            <p className="text-sm text-gray-600">
              Automatically flag and block potentially inappropriate messages
            </p>
          </div>
          <Switch
            checked={boundaries.auto_block_inappropriate}
            onCheckedChange={(checked) => setBoundaries(prev => ({ ...prev, auto_block_inappropriate: checked }))}
          />
        </div>

        {/* Pause Matching */}
        <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
          <div className="space-y-0.5">
            <Label className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              Pause All Matching
            </Label>
            <p className="text-sm text-gray-600">
              Temporarily hide profile from all searches and matches
            </p>
          </div>
          <Switch
            checked={boundaries.pause_matching}
            onCheckedChange={(checked) => setBoundaries(prev => ({ ...prev, pause_matching: checked }))}
          />
        </div>

        {/* Save Button */}
        <Button 
          onClick={saveBoundaries} 
          disabled={saving}
          className="w-full"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Boundaries'}
        </Button>
      </CardContent>
    </Card>
  );
}
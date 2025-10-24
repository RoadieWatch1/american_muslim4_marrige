import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  UserCheck, UserX, MessageSquare, Clock, 
  Heart, MapPin, Briefcase, Calendar, Star
} from 'lucide-react';

interface MatchApprovalProps {
  waliId: string;
  wardId: string;
}

export default function MatchApproval({ waliId, wardId }: MatchApprovalProps) {
  const { toast } = useToast();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [waliNotes, setWaliNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadPendingMatches();
  }, [wardId]);

  const loadPendingMatches = async () => {
    try {
      setLoading(true);
      
      // Get pending match approvals
      const { data: approvals, error } = await supabase
        .from('match_approvals')
        .select(`
          *,
          match_profile:profiles!match_approvals_match_id_fkey(
            id,
            first_name,
            last_name,
            age,
            city,
            country,
            occupation,
            education,
            religious_practice,
            marital_status,
            has_children,
            bio,
            profile_photo_url
          )
        `)
        .eq('ward_id', wardId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Also get recent likes to show as potential matches
      const { data: likes } = await supabase
        .from('likes')
        .select(`
          *,
          liker_profile:profiles!likes_liker_id_fkey(
            id,
            first_name,
            last_name,
            age,
            city,
            country,
            occupation,
            education,
            religious_practice,
            marital_status,
            has_children,
            bio,
            profile_photo_url
          )
        `)
        .eq('liked_id', wardId)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      // Combine and deduplicate
      const allMatches = [
        ...(approvals || []),
        ...(likes?.map(like => ({
          id: `like_${like.id}`,
          match_id: like.liker_id,
          match_profile: like.liker_profile,
          status: 'pending',
          created_at: like.created_at,
          is_like: true
        })) || [])
      ];

      setMatches(allMatches);
    } catch (error) {
      console.error('Error loading matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (matchId: string, approved: boolean) => {
    try {
      setProcessing(true);
      
      const match = matches.find(m => m.id === matchId);
      if (!match) return;

      if (match.is_like) {
        // Create a new match approval entry
        const { error } = await supabase
          .from('match_approvals')
          .upsert({
            ward_id: wardId,
            match_id: match.match_id,
            wali_id: waliId,
            status: approved ? 'approved' : 'rejected',
            wali_notes: waliNotes || null
          });

        if (error) throw error;
      } else {
        // Update existing match approval
        const { error } = await supabase
          .from('match_approvals')
          .update({
            status: approved ? 'approved' : 'rejected',
            wali_notes: waliNotes || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', matchId);

        if (error) throw error;
      }

      // Log the activity
      await supabase.from('wali_activity_logs').insert({
        wali_id: waliId,
        ward_id: wardId,
        action: approved ? 'approved_match' : 'rejected_match',
        details: {
          match_id: match.match_id,
          match_name: `${match.match_profile?.first_name} ${match.match_profile?.last_name}`,
          notes: waliNotes
        }
      });

      toast({
        title: approved ? 'Match Approved' : 'Match Rejected',
        description: approved 
          ? 'The match has been approved and they can now communicate.'
          : 'The match has been rejected.',
      });

      setWaliNotes('');
      setSelectedMatch(null);
      loadPendingMatches();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2].map(i => (
          <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No pending matches to review</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {matches.map((match) => (
        <Card key={match.id} className="overflow-hidden">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                {match.match_profile?.profile_photo_url ? (
                  <img
                    src={match.match_profile.profile_photo_url}
                    alt={match.match_profile.first_name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xl font-bold">
                    {match.match_profile?.first_name?.[0]}
                  </div>
                )}
                <div>
                  <CardTitle className="text-xl">
                    {match.match_profile?.first_name} {match.match_profile?.last_name}
                  </CardTitle>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {match.match_profile?.age} years
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {match.match_profile?.city}, {match.match_profile?.country}
                    </span>
                  </div>
                </div>
              </div>
              <Badge variant={match.is_like ? 'secondary' : 'default'}>
                {match.is_like ? 'Liked Your Ward' : 'Match Request'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-gray-600">Occupation</Label>
                <p className="font-medium flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  {match.match_profile?.occupation || 'Not specified'}
                </p>
              </div>
              <div>
                <Label className="text-gray-600">Education</Label>
                <p className="font-medium">{match.match_profile?.education || 'Not specified'}</p>
              </div>
              <div>
                <Label className="text-gray-600">Religious Practice</Label>
                <p className="font-medium flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  {match.match_profile?.religious_practice || 'Not specified'}
                </p>
              </div>
              <div>
                <Label className="text-gray-600">Marital Status</Label>
                <p className="font-medium">{match.match_profile?.marital_status || 'Not specified'}</p>
              </div>
            </div>

            {match.match_profile?.bio && (
              <div>
                <Label className="text-gray-600">About</Label>
                <p className="text-sm mt-1">{match.match_profile.bio}</p>
              </div>
            )}

            {selectedMatch === match.id && (
              <div className="space-y-2 pt-4 border-t">
                <Label htmlFor={`notes-${match.id}`}>Add Notes (Optional)</Label>
                <Textarea
                  id={`notes-${match.id}`}
                  placeholder="Add any notes or conditions for this match..."
                  value={waliNotes}
                  onChange={(e) => setWaliNotes(e.target.value)}
                  rows={3}
                />
              </div>
            )}

            <div className="flex gap-2 pt-4">
              {selectedMatch === match.id ? (
                <>
                  <Button
                    className="flex-1"
                    onClick={() => handleApproval(match.id, true)}
                    disabled={processing}
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Confirm Approval
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => handleApproval(match.id, false)}
                    disabled={processing}
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    Confirm Rejection
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedMatch(null);
                      setWaliNotes('');
                    }}
                    disabled={processing}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    className="flex-1"
                    variant="outline"
                    onClick={() => setSelectedMatch(match.id)}
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setSelectedMatch(match.id)}
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    View Messages
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
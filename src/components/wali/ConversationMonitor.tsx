import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageSquare, AlertTriangle, Shield, Search, 
  Flag, Eye, EyeOff, Users, Clock
} from 'lucide-react';

interface ConversationMonitorProps {
  waliId: string;
  wardId: string;
}

export default function ConversationMonitor({ waliId, wardId }: ConversationMonitorProps) {
  const { toast } = useToast();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showFlagged, setShowFlagged] = useState(false);

  useEffect(() => {
    loadConversations();
  }, [wardId]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      
      // Get all conversations involving the ward
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(
            id, first_name, last_name, profile_photo_url
          ),
          recipient:profiles!messages_recipient_id_fkey(
            id, first_name, last_name, profile_photo_url
          )
        `)
        .or(`sender_id.eq.${wardId},recipient_id.eq.${wardId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group messages by conversation
      const conversationMap = new Map();
      messages?.forEach(msg => {
        const otherId = msg.sender_id === wardId ? msg.recipient_id : msg.sender_id;
        const otherProfile = msg.sender_id === wardId ? msg.recipient : msg.sender;
        
        if (!conversationMap.has(otherId)) {
          conversationMap.set(otherId, {
            id: otherId,
            profile: otherProfile,
            lastMessage: msg.message,
            lastMessageTime: msg.created_at,
            unreadCount: 0,
            totalMessages: 0,
            flaggedMessages: 0
          });
        }
        
        const conv = conversationMap.get(otherId);
        conv.totalMessages++;
        
        // Check for potentially inappropriate content (simplified)
        if (msg.message && (
          msg.message.toLowerCase().includes('phone') ||
          msg.message.toLowerCase().includes('meet') ||
          msg.message.toLowerCase().includes('private')
        )) {
          conv.flaggedMessages++;
        }
      });

      setConversations(Array.from(conversationMap.values()));
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (otherUserId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${wardId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${wardId})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Log activity
      await supabase.from('wali_activity_logs').insert({
        wali_id: waliId,
        ward_id: wardId,
        action: 'viewed_conversation',
        details: { other_user_id: otherUserId }
      });
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const flagConversation = async (conversationId: string) => {
    try {
      // Log the flagged conversation
      await supabase.from('wali_activity_logs').insert({
        wali_id: waliId,
        ward_id: wardId,
        action: 'flagged_conversation',
        details: { 
          conversation_id: conversationId,
          reason: 'Inappropriate content detected'
        }
      });

      toast({
        title: 'Conversation Flagged',
        description: 'This conversation has been marked for review.',
      });

      loadConversations();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const filteredConversations = conversations.filter(conv => {
    if (showFlagged && conv.flaggedMessages === 0) return false;
    if (searchTerm) {
      const name = `${conv.profile?.first_name} ${conv.profile?.last_name}`.toLowerCase();
      return name.includes(searchTerm.toLowerCase());
    }
    return true;
  });

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-96 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Conversations List */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-600" />
            Active Conversations
          </CardTitle>
          <CardDescription>Monitor your ward's conversations</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-4 border-b space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={showFlagged ? 'default' : 'outline'}
                onClick={() => setShowFlagged(!showFlagged)}
              >
                <Flag className="h-3 w-3 mr-1" />
                Flagged Only
              </Button>
            </div>
          </div>
          
          <ScrollArea className="h-[400px]">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No conversations found</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full p-4 hover:bg-gray-50 text-left transition-colors ${
                      selectedConversation?.id === conv.id ? 'bg-emerald-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {conv.profile?.profile_photo_url ? (
                        <img
                          src={conv.profile.profile_photo_url}
                          alt={conv.profile.first_name}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          {conv.profile?.first_name?.[0]}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium truncate">
                            {conv.profile?.first_name} {conv.profile?.last_name}
                          </p>
                          {conv.flaggedMessages > 0 && (
                            <Badge variant="destructive" className="ml-2">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {conv.flaggedMessages}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 truncate">{conv.lastMessage}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">
                            {conv.totalMessages} messages
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">
                            {new Date(conv.lastMessageTime).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Messages View */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              {selectedConversation ? (
                `Chat with ${selectedConversation.profile?.first_name} ${selectedConversation.profile?.last_name}`
              ) : (
                'Select a conversation'
              )}
            </span>
            {selectedConversation && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => flagConversation(selectedConversation.id)}
              >
                <Flag className="h-4 w-4 mr-1" />
                Flag
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedConversation ? (
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_id === wardId ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        msg.sender_id === wardId
                          ? 'bg-emerald-100 text-emerald-900'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{msg.message}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(msg.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="h-[500px] flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Eye className="h-12 w-12 mx-auto mb-3" />
                <p>Select a conversation to view messages</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
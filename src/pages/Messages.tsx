import { useState, useEffect } from 'react';
import { Conversation } from '@/types';
import { ConversationList } from '@/components/messages/ConversationList';
import { ChatInterface } from '@/components/messages/ChatInterface';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { MessageSquare } from 'lucide-react';

export default function Messages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, [user]);

  const loadConversations = async () => {
    if (!user) return;
    
    setLoading(true);
    
    // Get all matches for the current user
    const { data: matches } = await supabase
      .from('matches')
      .select('*')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

    if (!matches) {
      setLoading(false);
      return;
    }

    // For each match, get the other user's profile and last message
    const conversationsData = await Promise.all(
      matches.map(async (match) => {
        const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;
        
        // Get other user's profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', otherUserId)
          .single();

        // Get last message
        const { data: lastMessage } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', match.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Get unread count
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', match.id)
          .eq('receiver_id', user.id)
          .eq('is_read', false);

        return {
          id: match.id,
          match_id: match.id,
          other_user: profile,
          last_message: lastMessage || undefined,
          unread_count: count || 0,
          wali_can_view: true
        } as Conversation;
      })
    );

    // Sort by last message time
    conversationsData.sort((a, b) => {
      if (!a.last_message) return 1;
      if (!b.last_message) return -1;
      return new Date(b.last_message.created_at).getTime() - new Date(a.last_message.created_at).getTime();
    });

    setConversations(conversationsData);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex">
      {/* Conversation List - Desktop always visible, mobile hidden when chat selected */}
      <div className={`w-full md:w-96 border-r ${selectedConversation ? 'hidden md:block' : 'block'}`}>
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Messages</h1>
          </div>
        </div>
        <ConversationList
          conversations={conversations}
          selectedId={selectedConversation?.id}
          onSelect={setSelectedConversation}
        />
      </div>

      {/* Chat Interface - Desktop always visible, mobile only when selected */}
      <div className={`flex-1 ${selectedConversation ? 'block' : 'hidden md:block'}`}>
        {selectedConversation ? (
          <ChatInterface
            conversation={selectedConversation}
            onBack={() => setSelectedConversation(null)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Select a conversation</h2>
            <p className="text-muted-foreground">Choose a conversation from the list to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}

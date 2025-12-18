// src/pages/Messages.tsx
import { useState, useEffect, useRef } from 'react';
import { Conversation } from '@/types';
import { ConversationList } from '@/components/messages/ConversationList';
import { ChatInterface } from '@/components/messages/ChatInterface';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { MessageSquare } from 'lucide-react';

type BasicProfile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
};

type WaliLink = {
  ward_user_id: string;
  status: string;
};

const LAST_SEEN_PING_MS = 30_000;

export default function Messages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);

  // keep latest selected id for realtime callback
  const selectedIdRef = useRef<string | null>(null);
  useEffect(() => {
    selectedIdRef.current = selectedConversation?.id ?? null;
  }, [selectedConversation?.id]);

  // ─────────────────────────────────────────────────────────────
  // Presence: keep profiles.last_seen_at fresh while user is in Messages
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    let interval: number | null = null;

    const ping = async () => {
      try {
        // Your edge function should set profiles.last_seen_at for auth user
        const { error } = await supabase.functions.invoke('touch_last_seen', {
          body: {},
        });
        if (error) console.warn('touch_last_seen error:', error);
      } catch (e) {
        console.warn('touch_last_seen failed:', e);
      }
    };

    // initial ping immediately
    void ping();

    // periodic ping
    interval = window.setInterval(() => {
      void ping();
    }, LAST_SEEN_PING_MS);

    // when user returns to tab, ping again
    const onVis = () => {
      if (document.visibilityState === 'visible') void ping();
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      if (interval) window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;

    let chan: ReturnType<typeof supabase.channel> | null = null;

    const init = async () => {
      await loadConversations();

      // realtime: update conversation list when new messages arrive
      chan = supabase
        .channel(`messages-inbox:${user.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages' },
          (payload) => {
            const newMsg = payload.new as any;
            const convId = newMsg.conversation_id as string;

            setConversations((prev) => {
              const idx = prev.findIndex((c) => c.id === convId);
              if (idx === -1) return prev;

              const copy = [...prev];
              const existing = copy[idx];

              const isIncomingToMe =
                newMsg.receiver_id === user.id &&
                newMsg.sender_id !== user.id;

              const isCurrentlyOpen = selectedIdRef.current === convId;

              copy[idx] = {
                ...existing,
                last_message: newMsg,
                unread_count: isIncomingToMe
                  ? isCurrentlyOpen
                    ? 0
                    : (existing.unread_count || 0) + 1
                  : existing.unread_count || 0,
              } as Conversation;

              // move updated conversation to top
              const updated = copy.splice(idx, 1)[0];
              return [updated, ...copy];
            });

            // if the user is currently viewing this conversation, mark it read immediately
            if (
              newMsg.receiver_id === user.id &&
              selectedIdRef.current === convId
            ) {
              void markConversationRead(convId);
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'messages' },
          (payload) => {
            const msg = payload.new as any;
            const convId = msg.conversation_id as string;

            // keep last_message in sync if the updated row is the last one we show
            setConversations((prev) =>
              prev.map((c) => {
                if (c.id !== convId) return c;
                if (!c.last_message) return c;

                return c.last_message.id === msg.id
                  ? ({ ...c, last_message: msg } as Conversation)
                  : c;
              })
            );
          }
        )
        .subscribe();
    };

    void init();

    return () => {
      if (chan) supabase.removeChannel(chan);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const loadConversations = async () => {
    if (!user) return;

    setLoading(true);

    try {
      // 0) Find wards for whom this user is an active wali
      const { data: waliLinks, error: waliError } = await supabase
        .from('wali_links')
        .select('ward_user_id, status')
        .eq('wali_user_id', user.id)
        .eq('status', 'active');

      if (waliError) console.error('Error loading wali links:', waliError);

      const wardIds: string[] =
        (waliLinks as WaliLink[] | null)?.map((w) => w.ward_user_id) ?? [];

      // 1) Matches where *this user* is directly a participant
      const { data: matchesForUser, error: matchesErrorUser } = await supabase
        .from('matches')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      if (matchesErrorUser) {
        console.error('Error loading matches for user:', matchesErrorUser);
      }

      // 2) Matches where ANY of the wards is a participant (for wali view)
      let matchesForWards: any[] = [];
      if (wardIds.length > 0) {
        const wardIdList = wardIds.map((id) => `"${id}"`).join(',');
        const orFilter = `user1_id.in.(${wardIdList}),user2_id.in.(${wardIdList})`;

        const { data: wardMatches, error: matchesErrorWards } = await supabase
          .from('matches')
          .select('*')
          .or(orFilter);

        if (matchesErrorWards) {
          console.error('Error loading matches for wards:', matchesErrorWards);
        } else if (wardMatches) {
          matchesForWards = wardMatches;
        }
      }

      // 3) Merge matches (avoid duplicates)
      const matchMap = new Map<string, any>();
      (matchesForUser || []).forEach((m: any) => matchMap.set(m.id, m));
      (matchesForWards || []).forEach((m: any) => matchMap.set(m.id, m));
      const allMatches: any[] = Array.from(matchMap.values());

      if (!allMatches || allMatches.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // 4) Build Conversation objects
      const conversationsData: Conversation[] = await Promise.all(
        allMatches.map(async (match: any) => {
          const isDirectParticipant =
            match.user1_id === user.id || match.user2_id === user.id;

          let otherUserId: string;

          if (isDirectParticipant) {
            otherUserId =
              match.user1_id === user.id ? match.user2_id : match.user1_id;
          } else {
            const wardIdInMatch =
              wardIds.find(
                (wid) => wid === match.user1_id || wid === match.user2_id
              ) ?? match.user1_id;

            otherUserId =
              match.user1_id === wardIdInMatch ? match.user2_id : match.user1_id;
          }

          // basic profile via RPC
          const { data: profile, error: profileError } = await supabase
            .rpc('get_profile_basic_for_message', { p_user_id: otherUserId })
            .maybeSingle<BasicProfile>();

          if (profileError) {
            console.error(
              'Error loading profile for conversation:',
              profileError
            );
          }

          const displayFirstName =
            profile?.first_name || profile?.last_name || 'Member';

          const other_user = {
            id: profile?.id || otherUserId,
            firstName: displayFirstName,
            lastName: profile?.last_name ?? null,
            photos: [] as string[],
          };

          // last message
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', match.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // unread count (only for the actual logged-in user)
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', match.id)
            .eq('receiver_id', user.id)
            .eq('is_read', false);

          return {
            id: match.id,
            match_id: match.id,
            other_user,
            last_message: lastMessage || undefined,
            unread_count: count || 0,
            wali_can_view: !isDirectParticipant,
          } as Conversation;
        })
      );

      // 5) Sort by last message time
      conversationsData.sort((a, b) => {
        if (!a.last_message) return 1;
        if (!b.last_message) return -1;
        return (
          new Date(b.last_message.created_at).getTime() -
          new Date(a.last_message.created_at).getTime()
        );
      });

      setConversations(conversationsData);

      if (!selectedConversation && conversationsData.length > 0) {
        setSelectedConversation(conversationsData[0]);
      }
    } catch (err) {
      console.error('Error loading conversations:', err);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const markConversationRead = async (conversationId: string) => {
    if (!user) return;

    // 1) Update DB
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .eq('receiver_id', user.id)
      .eq('is_read', false);

    // 2) Update UI immediately
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, unread_count: 0 } : c))
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="flex" style={{ height: 'calc(100vh - 70px)' }}>
      {/* Conversation List */}
      <div
        className={`w-full md:w-96 border-r ${
          selectedConversation ? 'hidden md:block' : 'block'
        }`}
      >
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Messages</h1>
          </div>
        </div>

        <ConversationList
          conversations={conversations}
          selectedId={selectedConversation?.id}
          onSelect={(conv) => {
            setSelectedConversation(conv);

            // if it has unread, mark read and update UI immediately
            if (conv.unread_count > 0) void markConversationRead(conv.id);
          }}
        />
      </div>

      {/* Chat Interface */}
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
            <p className="text-muted-foreground">
              Choose a conversation from the list to start messaging
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

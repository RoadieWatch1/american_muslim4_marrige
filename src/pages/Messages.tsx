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
  city: string | null;
  state: string | null;
  dob: string | null;
  profile_photo_url: string | null;
};

type WaliLink = {
  ward_user_id: string;
  status: string;
};

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

  // Presence heartbeat is handled globally in DashboardLayout so
  // last_seen_at reflects whole-app activity, not just /messages.

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
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` },
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
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false, nullsFirst: false });

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

      // 4) Pre-compute other-user-id and direct-participant flag for every match
      const matchIds: string[] = [];
      const otherUserIdByMatch = new Map<string, string>();
      const isDirectByMatch = new Map<string, boolean>();

      for (const match of allMatches) {
        const isDirect = match.user1_id === user.id || match.user2_id === user.id;
        isDirectByMatch.set(match.id, isDirect);
        matchIds.push(match.id);

        let otherId: string;
        if (isDirect) {
          otherId = match.user1_id === user.id ? match.user2_id : match.user1_id;
        } else {
          const wardInMatch =
            wardIds.find((w) => w === match.user1_id || w === match.user2_id) ??
            match.user1_id;
          otherId = match.user1_id === wardInMatch ? match.user2_id : match.user1_id;
        }
        otherUserIdByMatch.set(match.id, otherId);
      }

      const otherUserIds = [...new Set(otherUserIdByMatch.values())];

      // 5) Three batched queries fired in parallel
      const [profilesResult, unreadResult, lastMessagesResult] = await Promise.all([
        // Batch A: all profiles + photo URL via SECURITY DEFINER RPC
        // (direct queries on `media` are blocked by RLS for non-owners)
        supabase.rpc('get_basic_profiles', { p_user_ids: otherUserIds }),

        // Batch B: all unread messages for this user across all convs
        supabase
          .from('messages')
          .select('conversation_id')
          .in('conversation_id', matchIds)
          .eq('receiver_id', user.id)
          .eq('is_read', false),

        // Batch C: last message per conversation (all parallel, 1 RTT)
        Promise.all(
          matchIds.map((id) =>
            supabase
              .from('messages')
              .select('*')
              .eq('conversation_id', id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle()
              .then((r) => ({ id, msg: r.data as Message | null }))
          )
        ),
      ]);

      // Build lookup maps from batch results
      const profileMap = new Map(
        (profilesResult.data ?? []).map((p) => [p.id, p as BasicProfile])
      );

      const unreadByConv = new Map<string, number>();
      for (const row of unreadResult.data ?? []) {
        const cid = (row as any).conversation_id as string;
        unreadByConv.set(cid, (unreadByConv.get(cid) ?? 0) + 1);
      }

      const lastMessageByConv = new Map(
        lastMessagesResult.map(({ id, msg }) => [id, msg])
      );

      // 6) Assemble Conversation objects — no more async needed
      const conversationsData: Conversation[] = allMatches.map((match: any) => {
        const otherId = otherUserIdByMatch.get(match.id)!;
        const profile = profileMap.get(otherId);
        const displayName = profile?.first_name || 'Member';

        return {
          id: match.id,
          match_id: match.id,
          other_user: {
            id: profile?.id ?? otherId,
            firstName: displayName,
            lastName: null,
            photos: profile?.profile_photo_url ? [profile.profile_photo_url] : [],
          },
          last_message: lastMessageByConv.get(match.id) ?? undefined,
          unread_count: unreadByConv.get(match.id) ?? 0,
          wali_can_view: !isDirectByMatch.get(match.id),
        } as Conversation;
      });

      // 7) Sort by last message time
      conversationsData.sort((a, b) => {
        if (!a.last_message) return 1;
        if (!b.last_message) return -1;
        return (
          new Date(b.last_message.created_at).getTime() -
          new Date(a.last_message.created_at).getTime()
        );
      });

      setConversations(conversationsData);

      // Auto-select the most recent conversation on desktop only.
      // On mobile, leave the list visible so users can pick who to talk to,
      // especially when they have multiple new matches.
      const isDesktop =
        typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches;

      if (isDesktop && !selectedConversation && conversationsData.length > 0) {
        // Prefer the latest conversation that already has messages over a
        // brand-new match — opening an empty chat is jarring on first load.
        const firstWithMessages = conversationsData.find((c) => c.last_message);
        setSelectedConversation(firstWithMessages ?? conversationsData[0]);
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
            onConversationGone={() => {
              const goneId = selectedConversation.id;
              setConversations((prev) => prev.filter((c) => c.id !== goneId));
              setSelectedConversation(null);
            }}
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

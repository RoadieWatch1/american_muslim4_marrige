// src/components/messages/ChatInterface.tsx
import { useState, useEffect, useRef } from 'react';
import { Message, Conversation } from '@/types';
import { MessageBubble } from './MessageBubble';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Send, ArrowLeft, ShieldOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { notifyNewMessage } from '@/lib/notifications';
import { toast } from 'sonner';
import PublicProfileModal from '@/components/profile/PublicProfileModal';
import type { PublicProfile } from '@/components/profile/PublicProfileView';

// same helper as in ConversationList
const AVATAR_COLORS = [
  'bg-pink-500',
  'bg-purple-500',
  'bg-emerald-500',
  'bg-sky-500',
  'bg-amber-500',
  'bg-rose-500',
];

function getAvatarColor(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash + userId.charCodeAt(i)) % AVATAR_COLORS.length;
  }
  return AVATAR_COLORS[hash];
}

interface ChatInterfaceProps {
  conversation: Conversation;
  onBack: () => void;
  onConversationGone?: () => void;
}

// Consider user “offline” if they haven’t been seen in X minutes
const OFFLINE_MINUTES = 2;

const PAGE_SIZE = 50;

export function ChatInterface({ conversation, onBack, onConversationGone }: ChatInterfaceProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping] = useState(false); // placeholder if you add typing later
  const [loading, setLoading] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedProfile, setSelectedProfile] = useState<PublicProfile | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const openProfile = async () => {
    if (loadingProfile) return;
    setLoadingProfile(true);
    try {
      const { data, error } = await supabase
        .rpc('get_public_profile', { p_user_id: conversation.other_user.id })
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast.error('Profile not found.');
        return;
      }

      setSelectedProfile(data as PublicProfile);
      setProfileModalOpen(true);
    } catch (err) {
      console.error('Failed to load profile:', err);
      toast.error('Could not load profile.');
    } finally {
      setLoadingProfile(false);
    }
  };

  const closeProfile = () => {
    setProfileModalOpen(false);
    setSelectedProfile(null);
  };

  // Load + subscribe
  useEffect(() => {
    let chan: ReturnType<typeof supabase.channel> | null = null;

    const init = async () => {
      await loadMessages();
      await markAsRead();

      chan = supabase
        .channel(`messages:${conversation.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversation.id}`,
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setMessages((prev) => [...prev, payload.new as Message]);
              // if this client is receiver, we mark as read
              void markAsRead();
            } else if (payload.eventType === 'UPDATE') {
              setMessages((prev) =>
                prev.map((m) =>
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  m.id === (payload.new as any).id ? (payload.new as Message) : m
                )
              );
            }
          }
        )
        .subscribe();
    };

    void init();

    return () => {
      if (chan) supabase.removeChannel(chan);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.id]);

  const loadMessages = async () => {
    // Load the most recent page, then reverse so oldest-of-page is on top.
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);

    if (data) {
      const ordered = (data as Message[]).slice().reverse();
      setMessages(ordered);
      setHasMoreOlder(data.length === PAGE_SIZE);
    }
  };

  const loadOlder = async () => {
    if (loadingOlder || messages.length === 0) return;
    setLoadingOlder(true);
    try {
      const oldest = messages[0];
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .lt('created_at', oldest.created_at)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (data) {
        const olderOrdered = (data as Message[]).slice().reverse();
        setMessages((prev) => [...olderOrdered, ...prev]);
        setHasMoreOlder(data.length === PAGE_SIZE);
      }
    } finally {
      setLoadingOlder(false);
    }
  };

  const markAsRead = async () => {
    if (!user) return;
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversation.id)
      .eq('receiver_id', user.id)
      .eq('is_read', false);
  };

  function isOfflineByLastSeen(lastSeenAt?: string | null) {
    if (!lastSeenAt) return true; // if never seen, treat as offline
    const last = new Date(lastSeenAt).getTime();
    const cutoff = Date.now() - OFFLINE_MINUTES * 60 * 1000;
    return last < cutoff;
  }

  const shouldSendEmailForReceiver = async (receiverId: string) => {
    // 1) Load receiver presence + prefs related fields (email fetched separately below)
    const { data: receiver, error: receiverErr } = await supabase
      .from('profiles')
      .select('id, email, last_seen_at, email_notifications_enabled, notify_messages, notification_frequency')
      .eq('id', receiverId)
      .single();

    if (receiverErr) throw receiverErr;

    // basic checks
    if (!receiver?.email) return { ok: false as const, email: null as string | null, reason: 'no_email' };
    if (!receiver.email_notifications_enabled) return { ok: false as const, email: receiver.email, reason: 'emails_disabled' };
    if (!receiver.notify_messages) return { ok: false as const, email: receiver.email, reason: 'message_emails_disabled' };
    if ((receiver.notification_frequency || 'instant') !== 'instant')
      return { ok: false as const, email: receiver.email, reason: 'digest_mode' };

    // 2) Presence check
    const offline = isOfflineByLastSeen(receiver.last_seen_at);
    if (!offline) return { ok: false as const, email: receiver.email, reason: 'user_online' };

    // 3) Anti-spam: if there are already unread messages for receiver in this conversation, skip email
    // (means we already notified once, or they’re away and messages are piling up)
    const { count, error: unreadErr } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversation.id)
      .eq('receiver_id', receiverId)
      .eq('is_read', false);

    if (unreadErr) {
      // don’t block sending on count failure; just proceed
      return { ok: true as const, email: receiver.email, reason: 'offline_unread_check_failed' };
    }

    if ((count || 0) > 0) {
      return { ok: false as const, email: receiver.email, reason: 'already_has_unread' };
    }

    return { ok: true as const, email: receiver.email, reason: 'offline_no_unread' };
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || loading || !user) return;

    setLoading(true);

    const messageContent = newMessage.trim();
    const messagePreview =
      messageContent.length > 50 ? messageContent.substring(0, 50) + '...' : messageContent;

    try {
      const receiverId = conversation.other_user.id;

      // 1) Decide if we should email BEFORE inserting message
      //    (so unread_count check is “0” for receiver at this moment)
      let emailDecision: { ok: boolean; email: string | null; reason: string } = {
        ok: false,
        email: null,
        reason: 'unknown',
      };

      try {
        emailDecision = await shouldSendEmailForReceiver(receiverId);
      } catch (e2) {
        // don’t block message send if this fails
        console.warn('shouldSendEmailForReceiver failed:', e2);
      }

      // 2) Insert message
      const { error: insertError } = await supabase.from('messages').insert({
        conversation_id: conversation.id,
        sender_id: user.id,
        receiver_id: receiverId,
        content: messageContent,
      });

      if (insertError) throw insertError;

      // 3) Send email only if receiver is offline
      if (emailDecision.ok && emailDecision.email) {
        await notifyNewMessage({
          userId: receiverId,
          email: emailDecision.email,
          senderName: user.user_metadata?.first_name || 'Someone',
          message: messagePreview,
        });
      }
    } catch (err) {
      console.error('sendMessage error:', err);
      // optional toast
    } finally {
      setNewMessage('');
      setLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleBlock = async () => {
    if (!user || blocking) return;
    setBlocking(true);
    try {
      const { error } = await supabase.rpc('block_user', {
        p_blocked_id: conversation.other_user.id,
      });
      if (error) {
        console.error('block_user error:', error);
        toast.error('Could not block this member. Please try again.');
        return;
      }
      toast.success('User blocked. The conversation has been removed.');
      onConversationGone?.();
    } finally {
      setBlocking(false);
    }
  };

  const displayName = conversation.other_user.firstName || 'Member';
  const initial = displayName.charAt(0).toUpperCase();
  const avatarColor = getAvatarColor(conversation.other_user.id);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <button
          type="button"
          onClick={openProfile}
          className="rounded-full hover:ring-2 hover:ring-teal-300 transition-all flex-shrink-0"
          title="View full profile"
        >
          <Avatar>
            {conversation.other_user.photos?.[0] && (
              <AvatarImage src={conversation.other_user.photos[0]} />
            )}
            <AvatarFallback className={`${avatarColor} text-white font-semibold`}>
              {initial}
            </AvatarFallback>
          </Avatar>
        </button>

        <button
          type="button"
          onClick={openProfile}
          className="flex-1 text-left hover:opacity-80 transition-opacity min-w-0"
          title="View full profile"
        >
          <h3 className="font-semibold hover:text-teal-700 hover:underline underline-offset-2 truncate">
            {displayName}
          </h3>
          {isTyping && <p className="text-xs text-muted-foreground">typing...</p>}
        </button>

        {!conversation.wali_can_view && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" title="Block & unmatch">
                <ShieldOff className="h-5 w-5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Block {displayName}?</AlertDialogTitle>
                <AlertDialogDescription>
                  They will be unmatched, this conversation will be removed,
                  and you will no longer see each other in Discover. This
                  cannot be undone from the chat — you will need to unblock
                  them from settings.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleBlock}
                  disabled={blocking}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {blocking ? 'Blocking...' : 'Block & unmatch'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {hasMoreOlder && (
          <div className="text-center mb-3">
            <Button
              variant="outline"
              size="sm"
              onClick={loadOlder}
              disabled={loadingOlder}
            >
              {loadingOlder ? 'Loading...' : 'Load earlier messages'}
            </Button>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} isSender={msg.sender_id === user?.id} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      {conversation.wali_can_view ? (
        <div className="border-t p-4 text-sm text-muted-foreground text-center">
          You are viewing this conversation as a wali. You can read messages but cannot send messages
          in this chat.
        </div>
      ) : (
        <form onSubmit={sendMessage} className="border-t p-4 flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={loading}>
            <Send className="h-5 w-5" />
          </Button>
        </form>
      )}

      <PublicProfileModal
        open={profileModalOpen}
        onClose={closeProfile}
        profile={selectedProfile}
      />
    </div>
  );
}

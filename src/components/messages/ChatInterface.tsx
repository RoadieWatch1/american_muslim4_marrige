// src/components/messages/ChatInterface.tsx
import { useState, useEffect, useRef } from 'react';
import { Message, Conversation } from '@/types';
import { MessageBubble } from './MessageBubble';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { notifyNewMessage } from '@/lib/notifications';

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
}

// Consider user “offline” if they haven’t been seen in X minutes
const OFFLINE_MINUTES = 2;

export function ChatInterface({ conversation, onBack }: ChatInterfaceProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping] = useState(false); // placeholder if you add typing later
  const [waliVisible, setWaliVisible] = useState(conversation.wali_can_view);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true });

    if (data) setMessages(data as Message[]);
  };

  const markAsRead = async () => {
    if (!user) return;
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversation.id)
      .eq('receiver_id', user.id);
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

        <Avatar>
          {conversation.other_user.photos?.[0] && (
            <AvatarImage src={conversation.other_user.photos[0]} />
          )}
          <AvatarFallback className={`${avatarColor} text-white font-semibold`}>
            {initial}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <h3 className="font-semibold">{displayName}</h3>
          {isTyping && <p className="text-xs text-muted-foreground">typing...</p>}
        </div>

        <Button variant="ghost" size="icon" onClick={() => setWaliVisible((v) => !v)}>
          {waliVisible ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
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
    </div>
  );
}

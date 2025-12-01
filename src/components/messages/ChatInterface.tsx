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
              // 🔹 keep read-status in sync (double tick)
              setMessages((prev) =>
                prev.map((m) =>
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  m.id === (payload.new as any).id
                    ? (payload.new as Message)
                    : m
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

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || loading || !user) return;

    setLoading(true);

    const messageContent = newMessage.trim();
    const messagePreview =
      messageContent.length > 50
        ? messageContent.substring(0, 50) + '...'
        : messageContent;

    await supabase.from('messages').insert({
      conversation_id: conversation.id,
      sender_id: user.id,
      receiver_id: conversation.other_user.id,
      content: messageContent,
    });

    await notifyNewMessage(
      conversation.other_user.id,
      user.user_metadata?.first_name || 'Someone',
      messagePreview
    );

    setNewMessage('');
    setLoading(false);
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
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="md:hidden"
        >
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
          {isTyping && (
            <p className="text-xs text-muted-foreground">typing...</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setWaliVisible((v) => !v)}
        >
          {waliVisible ? (
            <Eye className="h-5 w-5" />
          ) : (
            <EyeOff className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isSender={msg.sender_id === user?.id}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
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
    </div>
  );
}

// src/components/messages/ConversationList.tsx
import { Conversation } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/Badge';
import { formatDistanceToNow } from 'date-fns';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (conversation: Conversation) => void;
}

// Small helper to give each user a consistent color
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

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
}: ConversationListProps) {
  return (
    <div className="h-full overflow-y-auto">
      {conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center p-6">
          <p className="text-muted-foreground">No conversations yet</p>
          <p className="text-sm text-muted-foreground mt-2">
            Start swiping to make matches!
          </p>
        </div>
      ) : (
        conversations.map((conv) => {
          const name = conv.other_user.firstName || 'Member';
          const initial = name.charAt(0).toUpperCase();
          const color = getAvatarColor(conv.other_user.id);

          return (
            <button
              key={conv.id}
              onClick={() => onSelect(conv)}
              className={`w-full p-4 flex items-start gap-3 hover:bg-accent transition-colors border-b ${
                selectedId === conv.id ? 'bg-accent' : ''
              }`}
            >
              <Avatar className="h-12 w-12">
                {/* if you later store photo urls, plug into AvatarImage */}
                {conv.other_user.photos?.[0] && (
                  <AvatarImage src={conv.other_user.photos[0]} />
                )}
                <AvatarFallback className={`${color} text-white font-semibold`}>
                  {initial}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold truncate">{name}</span>
                  {conv.last_message && (
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(
                        new Date(conv.last_message.created_at),
                        { addSuffix: true }
                      )}
                    </span>
                  )}
                </div>
                {conv.last_message && (
                  <p className="text-sm text-muted-foreground truncate">
                    {conv.last_message.content || '📷 Photo'}
                  </p>
                )}
              </div>
              {conv.unread_count > 0 && (
                <Badge variant="default" className="ml-2">
                  {conv.unread_count}
                </Badge>
              )}
            </button>
          );
        })
      )}
    </div>
  );
}

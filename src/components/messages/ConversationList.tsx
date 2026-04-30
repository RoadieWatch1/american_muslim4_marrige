// src/components/messages/ConversationList.tsx
import { Conversation } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/Badge';
import { formatDistanceToNow } from 'date-fns';
import { Sparkles } from 'lucide-react';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (conversation: Conversation) => void;
}

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
  const newMatches = conversations.filter((c) => !c.last_message);
  const activeConversations = conversations.filter((c) => c.last_message);

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <p className="text-muted-foreground">No conversations yet</p>
        <p className="text-sm text-muted-foreground mt-2">
          Start swiping to make matches!
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* New Matches row */}
      {newMatches.length > 0 && (
        <div className="border-b bg-gradient-to-br from-teal-50 to-emerald-50 px-4 py-3">
          <div className="flex items-center gap-1.5 mb-3">
            <Sparkles className="h-4 w-4 text-teal-600" />
            <span className="text-xs font-semibold uppercase tracking-wide text-teal-700">
              New Matches · {newMatches.length}
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
            {newMatches.map((conv) => {
              const name = conv.other_user.firstName || 'Member';
              const initial = name.charAt(0).toUpperCase();
              const color = getAvatarColor(conv.other_user.id);

              return (
                <button
                  key={conv.id}
                  onClick={() => onSelect(conv)}
                  className="flex-shrink-0 flex flex-col items-center gap-1.5 group"
                  title={`Say hi to ${name}`}
                >
                  <div className="relative">
                    <Avatar className="h-14 w-14 ring-2 ring-teal-400 ring-offset-2 ring-offset-teal-50 group-hover:ring-teal-500 transition-all">
                      {conv.other_user.photos?.[0] && (
                        <AvatarImage src={conv.other_user.photos[0]} />
                      )}
                      <AvatarFallback
                        className={`${color} text-white font-semibold`}
                      >
                        {initial}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute -bottom-0.5 -right-0.5 bg-teal-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center ring-2 ring-white">
                      ✦
                    </span>
                  </div>
                  <span className="text-xs font-medium text-foreground truncate max-w-[64px]">
                    {name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Active conversations */}
      {activeConversations.length > 0 && (
        <>
          {newMatches.length > 0 && (
            <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground bg-muted/30">
              Messages
            </div>
          )}
          {activeConversations.map((conv) => {
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
          })}
        </>
      )}
    </div>
  );
}

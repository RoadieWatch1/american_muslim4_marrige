import { Message } from '@/types';
import { format } from 'date-fns';
import { Check, CheckCheck } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  isSender: boolean;
  // Position within a run of consecutive messages from the same sender
  // (same day, no other sender in between). Used to visually merge the
  // run into one burst instead of a series of evenly-spaced, separately
  // timestamped messages.
  isGroupStart: boolean;
  isGroupEnd: boolean;
}

export function MessageBubble({
  message,
  isSender,
  isGroupStart,
  isGroupEnd,
}: MessageBubbleProps) {
  // Tighter spacing between messages in the same burst; normal spacing
  // once the burst ends (next message is a different sender/day, or this
  // is the last message overall).
  const spacingClass = isGroupEnd ? 'mb-4' : 'mb-1';

  // Taper the corner shared with the adjacent same-sender bubble so the
  // run reads as one connected shape rather than repeated separate bubbles.
  const cornerClass = isSender
    ? [!isGroupStart && 'rounded-tr-md', !isGroupEnd && 'rounded-br-md']
        .filter(Boolean)
        .join(' ')
    : [!isGroupStart && 'rounded-tl-md', !isGroupEnd && 'rounded-bl-md']
        .filter(Boolean)
        .join(' ');

  return (
    <div className={`flex ${isSender ? 'justify-end' : 'justify-start'} ${spacingClass}`}>
      <div className={`max-w-[70%] ${isSender ? 'items-end' : 'items-start'} flex flex-col`}>
        {message.image_url && (
          <img
            src={message.image_url}
            alt="Shared"
            className="rounded-lg mb-1 max-h-64 object-cover"
          />
        )}
        {message.content && (
          <div
            className={`px-4 py-2 rounded-2xl ${cornerClass} ${
              isSender
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted'
            }`}
          >
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          </div>
        )}
        {isGroupEnd && (
          <div className="flex items-center gap-1 mt-1 px-2">
            <span className="text-xs text-muted-foreground">
              {format(new Date(message.created_at), 'h:mm a')}
            </span>
            {isSender && (
              message.is_read ? (
                <CheckCheck className="h-3 w-3 text-primary" />
              ) : (
                <Check className="h-3 w-3 text-muted-foreground" />
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

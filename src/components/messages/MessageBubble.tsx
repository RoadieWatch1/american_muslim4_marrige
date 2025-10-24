import { Message } from '@/types';
import { format } from 'date-fns';
import { Check, CheckCheck } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  isSender: boolean;
}

export function MessageBubble({ message, isSender }: MessageBubbleProps) {
  return (
    <div className={`flex ${isSender ? 'justify-end' : 'justify-start'} mb-4`}>
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
            className={`px-4 py-2 rounded-2xl ${
              isSender
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted'
            }`}
          >
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          </div>
        )}
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
      </div>
    </div>
  );
}

import { Message } from "@/types/chat.types";
import { AnimatePresence } from "framer-motion";
import { CheckCheck, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { memo } from "react";

interface MessageBubbleProps {
  message: Message;
  currentUserId: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = memo(({ message, currentUserId }) => {
  const isSender = message.senderId === currentUserId;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.8 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={`flex ${isSender ? "justify-end" : "justify-start"} mb-2`}
    >
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`max-w-[85%] px-4 py-3 rounded-2xl relative ${
          isSender
            ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25"
            : "bg-white/10 backdrop-blur-md text-white border border-white/10"
        } ${message.isSending ? "opacity-70" : ""}`}
      >
        {isSender ? (
          <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rotate-45 rounded-sm" />
        ) : (
          <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-white/10 backdrop-blur-md rotate-45 rounded-sm" />
        )}

        <div className="relative z-10">
          <p className="text-sm break-all whitespace-normal word-break-break-word">
            {message.content}
          </p>

          <div className={`flex items-center justify-end gap-1 mt-1.5 ${isSender ? "text-white/70" : "text-white/50"}`}>
            <span className="text-xs whitespace-nowrap">
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
              {message.isSending && " (sending...)"}
            </span>
            {isSender && !message.isSending && (
              <CheckCheck
                className={`w-3.5 h-3.5 flex-shrink-0 ${message.read ? "text-blue-300" : "text-white/50"}`}
              />
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
});

MessageBubble.displayName = "MessageBubble";

interface ChatMessagesProps {
  messages: Message[];
  currentUserId: string;
  loadingMore: boolean;
  hasMoreMessages: boolean;
  onLoadMore: () => void;
  loadMoreTriggerRef: React.RefObject<HTMLDivElement | null>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  currentUserId,
  loadingMore,
  hasMoreMessages,
  onLoadMore,
  loadMoreTriggerRef,
  messagesEndRef,
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 no-scrollbar">
      {hasMoreMessages && (
        <div ref={loadMoreTriggerRef} className="flex justify-center py-4">
          {loadingMore ? (
            <div className="flex items-center gap-2 text-white/60">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading older messages...</span>
            </div>
          ) : (
            <button
              onClick={onLoadMore}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-xl transition-colors text-sm font-medium"
            >
              Load older messages
            </button>
          )}
        </div>
      )}

      <AnimatePresence mode="popLayout">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            currentUserId={currentUserId}
          />
        ))}
      </AnimatePresence>
      <div ref={messagesEndRef} className="h-4" />
    </div>
  );
};

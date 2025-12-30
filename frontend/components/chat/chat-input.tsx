import { motion } from 'framer-motion';
import { Send } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onTyping: (isTyping: boolean) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  disabled: boolean;
  sending: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  onTyping,
  onKeyDown,
  disabled,
  sending,
  textareaRef,
}) => {
  return (
    <div className="absolut bottom-0 left-0 right-0 md:relative md:bottom-auto p-4 border-t border-white/20 backdrop-blur-lg z-30">
      <div className="container mx-auto max-w-7xl">
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            placeholder="Type a message..."
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              onTyping(true);
            }}
            onKeyDown={onKeyDown}
            onBlur={() => onTyping(false)}
            rows={1}
            className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent resize-none min-h-[44px] max-h-[120px] backdrop-blur-sm"
            disabled={disabled || sending}
          />

          <motion.button
            onClick={onSend}
            disabled={!value.trim() || disabled || sending}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-5 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 shadow-lg min-h-[44px]"
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </div>
        <div className="text-xs text-white/40 mt-2 text-center">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
};

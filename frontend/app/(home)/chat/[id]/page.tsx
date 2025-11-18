"use client";

import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
// import { useChat } from '@/contexts/chat-context';
// import { useGlobal } from '@/contexts/global-context';
import { ArrowLeft, Send } from "lucide-react";
import { useGlobal } from "@/contexts/globalcontext";

export default function ChatDetailPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = parseInt(params.id as string);

  //   const { messages, currentConversation, fetchConversationMessages, sendMessage, loading, error } = useChat();
  const { user } = useGlobal();
  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentConversation = {
    otherUser: {
        firstName: "sarita",
        lastName: "hehe"
    }
  } 

  const messages = [
    {
      id: 1,
      senderId: 10,
      content: "Hey! How are you doing?",
      createdAt: "2025-02-17T14:22:00Z",
    },
    {
      id: 2,
      senderId: 20,
      content: "I'm good! Just finished working on the project.",
      createdAt: "2025-02-17T14:23:15Z",
    },
    {
      id: 3,
      senderId: 10,
      content: "Nice! Want to hop on a call later?",
      createdAt: "2025-02-17T14:24:00Z",
    },
    {
      id: 4,
      senderId: 20,
      content: "Sure! Give me 10 minutes.",
      createdAt: "2025-02-17T14:25:30Z",
    },
    {
      id: 5,
      senderId: 10,
      content: "Perfect, ping me whenever you're ready.",
      createdAt: "2025-02-17T14:26:10Z",
    },
  ];

//   useEffect(() => {
//     if (conversationId) {
//       fetchConversationMessages(conversationId);
//     }
//   }, [conversationId, fetchConversationMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  //   const handleSendMessage = async (e: React.FormEvent) => {
  //     e.preventDefault();
  //     if (!messageInput.trim() || !user?.id || sending) return;

  //     setSending(true);
  //     try {
  //       await sendMessage(conversationId, messageInput, user.id);
  //       setMessageInput('');
  //     } finally {
  //       setSending(false);
  //     }
  //   };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full flex flex-col bg-linear-to-br from-indigo-900 via-purple-900 to-pink-800"
    >
      {/* Header */}
      <div className="p-4 bg-white/5 backdrop-blur-lg border-b border-white/10 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <div className="flex-1 ml-4">
          <h2 className="text-white font-semibold">
            {currentConversation?.otherUser?.firstName}{" "}
            {currentConversation?.otherUser?.lastName}
          </h2>
          <p className="text-white/60 text-sm">Active now</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200 text-sm"
          >
            {error}
          </motion.div>
        )}

        {loading && messages.length === 0 ? (
          <div className="text-center text-white/60 py-8">
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-white/60 py-8">
            No messages yet. Start the conversation!
          </div>
        ) : ( */}
          {
          messages &&
          messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex ${message.senderId === user?.id ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-2xl ${
                  message.senderId === user?.id
                    ? "bg-purple-600 text-white"
                    : "bg-white/10 text-white border border-white/20"
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.senderId === user?.id
                      ? "text-white/70"
                      : "text-white/50"
                  }`}
                >
                  {new Date(message.createdAt).toLocaleTimeString()}
                </p>
              </div>
            </motion.div>
            ))}
          {/* ))
        )} */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        // onSubmit={handleSendMessage}
        className="p-4 bg-white/5 backdrop-blur-lg border-t border-white/10 flex gap-2"
      >
        <input
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          placeholder="Type a message..."
          disabled={sending}
          className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-full text-white placeholder-white/50 focus:outline-none focus:border-purple-400/50 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!messageInput.trim() || sending}
          className="p-2 bg-purple-600 hover:bg-purple-700 rounded-full text-white transition-colors disabled:opacity-50"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </motion.div>
  );
}

"use client";

import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    useMemo,
    useRef,
    ReactNode,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useWebSocket } from "./WebSocketContext";
import { ChatState, Message, User, ConversationCache } from "@/types/chat.types";
import { chatService, notificationService } from "@/services/chat.services";
import {
    ChatMessage,
    TypingStartMessage,
    TypingStopMessage,
} from "@/types/websocket.types";
import { toast } from "sonner";

// ==== Context Types ====

interface ChatContextType {
    // State
    state: ChatState;

    // Actions
    selectUser: (userId: string) => Promise<void>;
    sendMessage: () => Promise<void>;
    loadMoreMessages: () => Promise<void>;
    handleTyping: (isTyping: boolean) => void;
    retryFailedMessage: (messageId: string) => void;
    clearError: () => void;
    toggleSound: () => void;
    toggleSidebar: () => void;
    setSearchTerm: (term: string) => void;
    setNewMessage: (message: string) => void;

    // Helpers
    getUnreadCount: (userId: string) => number;
    getLastMessage: (userId: string) => { content: string; timestamp: string; senderId: string } | null;
    clearUnreadCount: (userId: string) => void;

    // Refs (for components that need direct access)
    refs: {
        messagesContainerRef: React.RefObject<HTMLDivElement | null>;
        messagesEndRef: React.RefObject<HTMLDivElement | null>;
        textareaRef: React.RefObject<HTMLTextAreaElement | null>;
        loadMoreTriggerRef: React.RefObject<HTMLDivElement | null>;
    };
}

// ==== Initial State ====

const initialState: ChatState = {
    users: [],
    currentUserId: "",
    selectedUserId: null,
    messages: [],
    loading: true,
    loadingMore: false,
    hasMoreMessages: false,
    nextCursor: null,
    totalMessages: 0,
    newMessage: "",
    sending: false,
    searchTerm: "",
    typingUsers: new Set(),
    soundEnabled: true,
    notificationPermission: "default",
    sidebarOpen: false,
    isMobile: false,
    error: null,
    connectionStatus: "disconnected",
    conversationMeta: {},
    totalUnread: 0,
};

// ==== Context ====

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// ==== Provider ====

interface ChatProviderProps {
    children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { send, registerHandler, connectionStatus, isConnected } = useWebSocket();

    const [state, setState] = useState<ChatState>(initialState);

    // Refs
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const loadMoreTriggerRef = useRef<HTMLDivElement>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);

    // State references for WebSocket callbacks
    const currentStateRef = useRef<{
        currentUserId: string;
        selectedUserId: string | null;
        messages: Message[];
        users: User[];
        soundEnabled: boolean;
    }>({
        currentUserId: "",
        selectedUserId: null,
        messages: [],
        users: [],
        soundEnabled: true,
    });

    // Conversation cache for instant switching
    const conversationCache = useRef<ConversationCache>({});
    const initializationRef = useRef({ initialized: false });
    const messageQueueRef = useRef<Message[]>([]);
    const processingQueueRef = useRef(false);

    // Update connection status from WebSocket context
    useEffect(() => {
        setState((prev) => ({ ...prev, connectionStatus }));
    }, [connectionStatus]);

    // Update state ref when state changes
    useEffect(() => {
        currentStateRef.current = {
            currentUserId: state.currentUserId,
            selectedUserId: state.selectedUserId,
            messages: state.messages,
            users: state.users,
            soundEnabled: state.soundEnabled,
        };
    }, [
        state.currentUserId,
        state.selectedUserId,
        state.messages,
        state.users,
        state.soundEnabled,
    ]);

    // Process message queue to prevent duplicates
    const processMessageQueue = useCallback(() => {
        if (processingQueueRef.current || messageQueueRef.current.length === 0) return;

        processingQueueRef.current = true;
        const messagesToProcess = [...messageQueueRef.current];
        messageQueueRef.current = [];

        setState((prev) => {
            const existingIds = new Set(prev.messages.map((m) => m.databaseId || m.id));
            const newMessages: Message[] = [];

            for (const message of messagesToProcess) {
                const isDuplicate =
                    existingIds.has(message.databaseId || message.id) ||
                    prev.messages.some(
                        (m) =>
                            m.content === message.content &&
                            m.senderId === message.senderId &&
                            Math.abs(
                                new Date(m.timestamp).getTime() - new Date(message.timestamp).getTime()
                            ) < 1000
                    );

                if (!isDuplicate) {
                    newMessages.push(message);
                    existingIds.add(message.databaseId || message.id);
                }
            }

            if (newMessages.length === 0) {
                processingQueueRef.current = false;
                return prev;
            }

            processingQueueRef.current = false;
            return {
                ...prev,
                messages: [...prev.messages, ...newMessages],
            };
        });
    }, []);

    // ==== WebSocket Handlers ====

    // Handle incoming chat messages
    const handleChatMessage = useCallback(
        (data: ChatMessage) => {
            const messageData = (data as any).data?.data || (data as any).data || data;

            if (!messageData.senderId || !messageData.content) return;

            const { currentUserId, selectedUserId } = currentStateRef.current;
            const senderId = messageData.senderId.toString();
            const receiverId = (messageData.receiverId || "").toString();

            const conversationUserId = senderId === currentUserId ? receiverId : senderId;

            const isRelevant =
                selectedUserId &&
                (Number(senderId) === Number(selectedUserId) ||
                    Number(messageData.receiverId) === Number(selectedUserId));

            // Update conversation meta
            setState((prev) => {
                const newConversationMeta = { ...prev.conversationMeta };

                if (!newConversationMeta[conversationUserId]) {
                    newConversationMeta[conversationUserId] = { unreadCount: 0, lastMessage: null };
                }

                newConversationMeta[conversationUserId].lastMessage = {
                    content: messageData.content,
                    timestamp: messageData.timestamp || new Date().toISOString(),
                    senderId: senderId,
                };

                let newTotalUnread = prev.totalUnread;
                if (senderId !== currentUserId && conversationUserId !== selectedUserId) {
                    newConversationMeta[conversationUserId].unreadCount += 1;
                    newTotalUnread += 1;
                }

                return {
                    ...prev,
                    conversationMeta: newConversationMeta,
                    totalUnread: newTotalUnread,
                };
            });

            if (isRelevant) {
                const newMessage: Message = {
                    id: messageData.messageId || `msg_${Date.now()}`,
                    senderId: senderId,
                    receiverId: receiverId,
                    content: messageData.content,
                    timestamp: messageData.timestamp || new Date().toISOString(),
                    read: messageData.read || false,
                    databaseId: messageData.databaseId,
                };

                messageQueueRef.current.push(newMessage);
                processMessageQueue();

                if (senderId !== currentUserId) {
                    const { soundEnabled, users } = currentStateRef.current;
                    notificationService.playSound(soundEnabled);

                    const sender = users.find((u) => u.id === senderId);
                    const senderName = sender?.username || "Someone";
                    
                    // Show browser notification
                    notificationService.showBrowserNotification(
                        "New Message",
                        `${senderName}: ${messageData.content}`
                    );

                    // Show toast notification with nice styling
                    toast.success(`New message from ${senderName}`, {
                        description: messageData.content.substring(0, 100) + (messageData.content.length > 100 ? "..." : ""),
                        duration: 4000,
                    });
                }
            } else if (senderId !== currentUserId) {
                const { soundEnabled, users } = currentStateRef.current;
                notificationService.playSound(soundEnabled);

                const sender = users.find((u) => u.id === senderId);
                const senderName = sender?.username || "Someone";
                
                // Show browser notification
                notificationService.showBrowserNotification(
                    "New Message",
                    `${senderName}: ${messageData.content}`
                );

                // Show toast notification with nice styling
                toast.success(`New message from ${senderName}`, {
                    description: messageData.content.substring(0, 100) + (messageData.content.length > 100 ? "..." : ""),
                    duration: 4000,
                });
            }
        },
        [processMessageQueue]
    );

    // Handle typing start
    const handleTypingStart = useCallback((data: TypingStartMessage) => {
        const senderId = data.senderId;
        if (senderId && senderId !== currentStateRef.current.currentUserId) {
            setState((prev) => {
                const newTypingUsers = new Set(prev.typingUsers);
                newTypingUsers.add(senderId);
                return { ...prev, typingUsers: newTypingUsers };
            });
        }
    }, []);

    // Handle typing stop
    const handleTypingStop = useCallback((data: TypingStopMessage) => {
        const senderId = data.senderId;
        if (senderId) {
            setState((prev) => {
                const newTypingUsers = new Set(prev.typingUsers);
                newTypingUsers.delete(senderId);
                return { ...prev, typingUsers: newTypingUsers };
            });
        }
    }, []);

    // Register WebSocket handlers
    useEffect(() => {
        const unsubscribeChatMessage = registerHandler("chat_message", handleChatMessage);
        const unsubscribeTypingStart = registerHandler("typing_start", handleTypingStart);
        const unsubscribeTypingStop = registerHandler("typing_stop", handleTypingStop);

        return () => {
            unsubscribeChatMessage();
            unsubscribeTypingStart();
            unsubscribeTypingStop();
        };
    }, [registerHandler, handleChatMessage, handleTypingStart, handleTypingStop]);

    // ==== Data Fetching ====

    const fetchCurrentUser = useCallback(async () => {
        try {
            const response = await chatService.getCurrentUser();
            const user = response.user;
            setState((prev) => ({
                ...prev,
                currentUserId: user.id.toString(),
                error: null,
            }));
            return user.id.toString();
        } catch (error) {
            console.error("Failed to get current user:", error);

            try {
                const usersResponse = await chatService.getUsers();
                if (usersResponse.currentUserId) {
                    setState((prev) => ({
                        ...prev,
                        currentUserId: usersResponse.currentUserId.toString(),
                        error: null,
                    }));
                    return usersResponse.currentUserId.toString();
                }
            } catch (fallbackError) {
                console.error("Fallback also failed:", fallbackError);
                setState((prev) => ({
                    ...prev,
                    error: "Failed to authenticate. Please refresh the page.",
                }));
            }

            throw error;
        }
    }, []);

    const fetchUsers = useCallback(async () => {
        try {
            setState((prev) => ({ ...prev, loading: true, error: null }));
            const response = await chatService.getUsers();

            const conversationMeta: Record<string, any> = {};
            let totalUnread = 0;

            for (const user of response.users) {
                const unreadCount = (user as any).unreadCount || 0;
                const lastMessage = (user as any).lastMessage || null;

                conversationMeta[user.id] = {
                    unreadCount,
                    lastMessage,
                };
                totalUnread += unreadCount;
            }

            setState((prev) => ({
                ...prev,
                users: response.users,
                conversationMeta,
                totalUnread,
                error: null,
            }));
        } catch (error) {
            console.error("Failed to fetch users:", error);
            setState((prev) => ({
                ...prev,
                error: "Failed to load users. Please try again.",
            }));
        } finally {
            setState((prev) => ({ ...prev, loading: false }));
        }
    }, []);

    const fetchMessages = useCallback(
        async (userId: string, cursor: string | null = null, isLoadMore = false) => {
            if (!userId || !state.currentUserId) return;

            try {
                if (isLoadMore) {
                    setState((prev) => ({ ...prev, loadingMore: true, error: null }));
                } else {
                    setState((prev) => ({ ...prev, loading: true, error: null }));
                }

                const data = await chatService.getMessages(userId, cursor ?? undefined, 20);

                const normalized = (data.messages || []).map((m) => ({
                    ...m,
                    id: String(m.id),
                    senderId: String(m.senderId),
                    receiverId: String(m.receiverId),
                }));

                normalized.sort(
                    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                );

                setState((prev) => {
                    const newMessages = isLoadMore ? [...normalized, ...prev.messages] : normalized;

                    conversationCache.current[userId] = {
                        messages: newMessages,
                        timestamp: Date.now(),
                        totalMessages: data.pagination?.totalMessages || 0,
                    };

                    const lastMsg = newMessages[newMessages.length - 1];
                    const newConversationMeta = { ...prev.conversationMeta };

                    if (!newConversationMeta[userId]) {
                        newConversationMeta[userId] = { unreadCount: 0, lastMessage: null };
                    }

                    if (lastMsg) {
                        newConversationMeta[userId].lastMessage = {
                            content: lastMsg.content,
                            timestamp: lastMsg.timestamp,
                            senderId: lastMsg.senderId,
                        };
                    }

                    return {
                        ...prev,
                        messages: newMessages,
                        loading: false,
                        loadingMore: false,
                        hasMoreMessages: data.pagination?.hasMore || false,
                        nextCursor: data.pagination?.nextCursor || null,
                        totalMessages: data.pagination?.totalMessages || 0,
                        conversationMeta: newConversationMeta,
                        error: null,
                    };
                });

                if (!isLoadMore && normalized.length > 0) {
                    await chatService.markAsRead(userId);

                    setState((prev) => {
                        const newConversationMeta = { ...prev.conversationMeta };
                        const prevUnread = newConversationMeta[userId]?.unreadCount || 0;

                        if (newConversationMeta[userId]) {
                            newConversationMeta[userId].unreadCount = 0;
                        }

                        return {
                            ...prev,
                            conversationMeta: newConversationMeta,
                            totalUnread: Math.max(0, prev.totalUnread - prevUnread),
                        };
                    });
                }
            } catch (error: unknown) {
                console.error("Failed to fetch messages:", error);
                setState((prev) => ({
                    ...prev,
                    loading: false,
                    loadingMore: false,
                    error: error instanceof Error ? error.message : "Failed to load messages",
                }));
            }
        },
        [state.currentUserId]
    );

    // ==== Actions ====

    const selectUser = useCallback(
        async (userId: string) => {
            if (userId === state.selectedUserId) return;

            const cached = conversationCache.current[userId];
            const cachedMessages = cached?.messages || [];

            setState((prev) => ({
                ...prev,
                selectedUserId: userId,
                messages: cachedMessages,
                loading: true,
                hasMoreMessages: false,
                nextCursor: null,
                totalMessages: cached?.totalMessages || 0,
                newMessage: "",
                error: null,
            }));

            const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
            params.set("user", userId);
            router.replace(`?${params.toString()}`, { scroll: false });

            if (state.isMobile) {
                setState((prev) => ({ ...prev, sidebarOpen: false }));
            }

            await fetchMessages(userId);
        },
        [state.selectedUserId, state.isMobile, router, searchParams, fetchMessages]
    );

    const sendMessage = useCallback(async () => {
        const messageContent = state.newMessage.trim();
        if (!messageContent || !state.selectedUserId || state.sending || !state.currentUserId) {
            return;
        }

        const tempId = `temp_${Date.now()}`;
        const tempMessage: Message = {
            id: tempId,
            senderId: state.currentUserId,
            receiverId: state.selectedUserId,
            content: messageContent,
            timestamp: new Date().toISOString(),
            read: false,
            isSending: true,
        };

        setState((prev) => ({
            ...prev,
            messages: [...prev.messages, tempMessage],
            newMessage: "",
            sending: true,
            error: null,
        }));

        // Send typing stop via centralized WebSocket
        if (isConnected && state.selectedUserId) {
            send({
                type: "typing_stop",
                receiverId: state.selectedUserId,
            });
        }

        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.focus();
        }

        try {
            await chatService.sendMessage(state.selectedUserId, messageContent);

            setState((prev) => ({
                ...prev,
                messages: prev.messages.map((msg) =>
                    msg.id === tempId ? { ...msg, isSending: false } : msg
                ),
                sending: false,
            }));
        } catch (error: unknown) {
            console.error("Failed to send message:", error);

            setState((prev) => ({
                ...prev,
                messages: prev.messages.map((msg) =>
                    msg.id === tempId ? { ...msg, isSending: false, isFailed: true } : msg
                ),
                sending: false,
                error: error instanceof Error ? error.message : "Failed to send message",
            }));

            setTimeout(() => {
                setState((prev) => ({ ...prev, newMessage: messageContent }));
            }, 100);
        }
    }, [state.newMessage, state.selectedUserId, state.sending, state.currentUserId, isConnected, send]);

    const loadMoreMessages = useCallback(async () => {
        if (state.nextCursor && !state.loadingMore && state.hasMoreMessages && state.selectedUserId) {
            await fetchMessages(state.selectedUserId, state.nextCursor, true);
        }
    }, [state.nextCursor, state.loadingMore, state.hasMoreMessages, state.selectedUserId, fetchMessages]);

    const handleTyping = useCallback(
        (isTyping: boolean) => {
            if (!isConnected || !state.selectedUserId) return;

            send({
                type: isTyping ? "typing_start" : "typing_stop",
                receiverId: state.selectedUserId,
            });
        },
        [isConnected, state.selectedUserId, send]
    );

    const retryFailedMessage = useCallback(
        (messageId: string) => {
            const failedMessage = state.messages.find((msg) => msg.id === messageId && msg.isFailed);
            if (failedMessage && state.selectedUserId) {
                setState((prev) => ({
                    ...prev,
                    newMessage: failedMessage.content,
                    messages: prev.messages.filter((msg) => msg.id !== messageId),
                }));

                setTimeout(() => {
                    textareaRef.current?.focus();
                }, 100);
            }
        },
        [state.messages, state.selectedUserId]
    );

    const clearError = useCallback(() => {
        setState((prev) => ({ ...prev, error: null }));
    }, []);

    const toggleSound = useCallback(() => {
        setState((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }));
    }, []);

    const toggleSidebar = useCallback(() => {
        setState((prev) => ({ ...prev, sidebarOpen: !prev.sidebarOpen }));
    }, []);

    const setSearchTerm = useCallback((term: string) => {
        setState((prev) => ({ ...prev, searchTerm: term }));
    }, []);

    const setNewMessage = useCallback((message: string) => {
        setState((prev) => ({ ...prev, newMessage: message }));
    }, []);

    // Helpers
    const getUnreadCount = useCallback(
        (userId: string) => state.conversationMeta[userId]?.unreadCount || 0,
        [state.conversationMeta]
    );

    const getLastMessage = useCallback(
        (userId: string) => state.conversationMeta[userId]?.lastMessage || null,
        [state.conversationMeta]
    );

    const clearUnreadCount = useCallback((userId: string) => {
        setState((prev) => {
            const newConversationMeta = { ...prev.conversationMeta };
            const prevUnread = newConversationMeta[userId]?.unreadCount || 0;

            if (newConversationMeta[userId]) {
                newConversationMeta[userId].unreadCount = 0;
            }

            return {
                ...prev,
                conversationMeta: newConversationMeta,
                totalUnread: Math.max(0, prev.totalUnread - prevUnread),
            };
        });
    }, []);

    // ==== Initialization ====

    useEffect(() => {
        notificationService.initialize();

        if ("Notification" in window) {
            setState((prev) => ({
                ...prev,
                notificationPermission: Notification.permission,
            }));
        }

        const checkScreenSize = () => {
            const isMobile = window.innerWidth < 768;
            setState((prev) => ({
                ...prev,
                isMobile,
                sidebarOpen: isMobile ? false : prev.sidebarOpen,
            }));
        };

        checkScreenSize();
        window.addEventListener("resize", checkScreenSize);

        return () => {
            window.removeEventListener("resize", checkScreenSize);
        };
    }, []);

    // Initialize from URL
    useEffect(() => {
        const initializeFromURL = async () => {
            const urlUser = searchParams ? searchParams.get("user") : null;
            if (urlUser) {
                try {
                    const usersResponse = await chatService.getUsers();
                    const userExists = usersResponse.users.some((user: User) => user.id === urlUser);

                    if (userExists) {
                        await selectUser(urlUser);
                    } else {
                        const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
                        params.delete("user");
                        router.replace(`?${params.toString()}`, { scroll: false });
                        setState((prev) => ({ ...prev, error: "Selected user not found" }));
                    }
                } catch (error) {
                    console.error("Failed to validate user from URL:", error);
                    setState((prev) => ({ ...prev, error: "Failed to load user data" }));
                }
            }
        };

        initializeFromURL();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    // Initialize app
    useEffect(() => {
        if (initializationRef.current.initialized) return;

        initializationRef.current.initialized = true;

        const initializeApp = async () => {
            try {
                await fetchCurrentUser();
                await fetchUsers();
            } catch (error) {
                console.error("Failed to initialize chat:", error);
                setState((prev) => ({
                    ...prev,
                    error: "Failed to initialize. Please refresh the page.",
                    loading: false,
                }));
            }
        };

        initializeApp();

        return () => {
            initializationRef.current.initialized = false;
            notificationService.cleanup();
            chatService.clearCache();
        };
    }, [fetchCurrentUser, fetchUsers]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    }, [state.newMessage]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (state.messages.length > 0 && !state.loadingMore && !state.loading) {
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
        }
    }, [state.messages.length, state.loadingMore, state.loading]);

    // Intersection Observer for lazy loading
    useEffect(() => {
        if (!loadMoreTriggerRef.current || !state.hasMoreMessages) return;

        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !state.loadingMore && state.hasMoreMessages) {
                    loadMoreMessages();
                }
            },
            {
                threshold: 0.1,
                rootMargin: "100px",
            }
        );

        observerRef.current.observe(loadMoreTriggerRef.current);

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [state.hasMoreMessages, state.loadingMore, loadMoreMessages]);

    // ==== Context Value ====

    const value = useMemo(
        () => ({
            state,
            selectUser,
            sendMessage,
            loadMoreMessages,
            handleTyping,
            retryFailedMessage,
            clearError,
            toggleSound,
            toggleSidebar,
            setSearchTerm,
            setNewMessage,
            getUnreadCount,
            getLastMessage,
            clearUnreadCount,
            refs: {
                messagesContainerRef,
                messagesEndRef,
                textareaRef,
                loadMoreTriggerRef,
            },
        }),
        [
            state,
            selectUser,
            sendMessage,
            loadMoreMessages,
            handleTyping,
            retryFailedMessage,
            clearError,
            toggleSound,
            toggleSidebar,
            setSearchTerm,
            setNewMessage,
            getUnreadCount,
            getLastMessage,
            clearUnreadCount,
        ]
    );

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

// ==== Hook ====

export const useChat = (): ChatContextType => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error("useChat must be used within a ChatProvider");
    }
    return context;
};

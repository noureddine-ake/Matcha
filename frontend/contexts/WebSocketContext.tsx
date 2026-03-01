"use client";

import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    useMemo,
    ReactNode,
} from "react";
import {
    webSocketService,
    connectWebSocket,
    disconnectWebSocket,
} from "@/lib/websocket.service";

// Types
type ConnectionStatus = "connected" | "disconnected" | "connecting" | "error";

interface UserStatus {
    userId: string;
    status: "online" | "offline";
    lastSeen: Date | string | null;
    username?: string;
}

interface WebSocketContextType {
    connectionStatus: ConnectionStatus;
    isConnected: boolean;
    onlineUsers: UserStatus[];
    userStatuses: Map<string, UserStatus>;
    connect: () => void;
    disconnect: () => void;
    send: (message: any) => boolean;
    getUserStatus: (userId: string) => UserStatus | undefined;
    registerHandler: (type: string, handler: (data: any) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
    children: ReactNode;
    autoConnect?: boolean;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
    children,
    autoConnect = true,
}) => {
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
    const [onlineUsers, setOnlineUsers] = useState<UserStatus[]>([]);
    const [userStatuses, setUserStatuses] = useState<Map<string, UserStatus>>(new Map());

    const isConnected = connectionStatus === "connected";

    // Initialize WebSocket service listeners
    useEffect(() => {
        // Listen for connection status changes
        const unsubscribeStatus = webSocketService.onStatusChange((status) => {
            setConnectionStatus(status);
            
            if (status === "disconnected" || status === "error") {
                setOnlineUsers([]);
                setUserStatuses(new Map());
            }
        });

        // Handle initial online users list
        const unsubscribeOnlineUsers = webSocketService.registerHandler("users_online", (message: any) => {
            if (message.users && Array.isArray(message.users)) {
                setOnlineUsers(message.users);
                
                const newStatuses = new Map(userStatuses);
                message.users.forEach((user: UserStatus) => {
                    newStatuses.set(user.userId, user);
                });
                setUserStatuses(newStatuses);
            }
        });

        // Handle individual status changes
        const unsubscribeStatusChange = webSocketService.registerHandler("user_status_change", (message: any) => {
            if (message.data) {
                const { userId, status, lastSeen, username } = message.data;
                
                // Update online users list
                setOnlineUsers(prev => {
                    if (status === "online") {
                        const exists = prev.find(u => u.userId === userId);
                        if (exists) {
                            return prev.map(u => 
                                u.userId === userId 
                                    ? { ...u, status, lastSeen, username: username || u.username }
                                    : u
                            );
                        } else {
                            return [...prev, { userId, status, lastSeen, username }];
                        }
                    } else {
                        return prev.filter(u => u.userId !== userId);
                    }
                });

                // Update userStatuses map
                setUserStatuses(prev => {
                    const newMap = new Map(prev);
                    newMap.set(userId, { userId, status, lastSeen, username });
                    return newMap;
                });

                // Dispatch custom event for components
                window.dispatchEvent(new CustomEvent("userStatusChange", { 
                    detail: { userId, status, lastSeen } 
                }));
            }
        });

        // Handle bulk status responses
        const unsubscribeStatuses = webSocketService.registerHandler("user_statuses", (message: any) => {
            if (message.data) {
                const newStatuses = new Map(userStatuses);
                Object.entries(message.data).forEach(([userId, statusData]: [string, any]) => {
                    newStatuses.set(userId, {
                        userId,
                        status: statusData.status,
                        lastSeen: statusData.lastSeen,
                        username: statusData.username
                    });
                });
                setUserStatuses(newStatuses);
            }
        });

        return () => {
            unsubscribeStatus();
            unsubscribeOnlineUsers();
            unsubscribeStatusChange();
            unsubscribeStatuses();
        };
    }, []);

    // Auto-connect if enabled
    useEffect(() => {
        if (autoConnect) {
            // Small delay to ensure component is mounted
            const timer = setTimeout(() => {
                connectWebSocket();
            }, 100);
            
            return () => clearTimeout(timer);
        }
        
        return () => {
            disconnectWebSocket();
        };
    }, [autoConnect]);

    const connect = useCallback(() => {
        connectWebSocket();
    }, []);

    const disconnect = useCallback(() => {
        disconnectWebSocket();
        setOnlineUsers([]);
        setUserStatuses(new Map());
    }, []);

    const send = useCallback((message: any): boolean => {
        return webSocketService.send(message);
    }, []);

    const registerHandler = useCallback((type: string, handler: (data: any) => void) => {
        return webSocketService.registerHandler(type, handler);
    }, []);

    const getUserStatus = useCallback((userId: string): UserStatus | undefined => {
        return userStatuses.get(userId);
    }, [userStatuses]);

    const value = useMemo(
        () => ({
            connectionStatus,
            isConnected,
            onlineUsers,
            userStatuses,
            connect,
            disconnect,
            send,
            getUserStatus,
            registerHandler,
        }),
        [connectionStatus, isConnected, onlineUsers, userStatuses, connect, disconnect, send, registerHandler, getUserStatus]
    );

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket = (): WebSocketContextType => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error("useWebSocket must be used within a WebSocketProvider");
    }
    return context;
};

// Hook to track specific user status
export function useUserStatus(userId: string) {
    const { getUserStatus, isConnected } = useWebSocket();
    const [status, setStatus] = useState<UserStatus | undefined>();

    useEffect(() => {
        if (!userId) return;

        setStatus(getUserStatus(userId));

        const handleStatusChange = (event: CustomEvent) => {
            if (event.detail.userId === userId) {
                setStatus({
                    userId,
                    status: event.detail.status,
                    lastSeen: event.detail.lastSeen
                });
            }
        };

        window.addEventListener("userStatusChange", handleStatusChange as EventListener);

        return () => {
            window.removeEventListener("userStatusChange", handleStatusChange as EventListener);
        };
    }, [userId, getUserStatus]);

    return {
        isOnline: status?.status === "online",
        status: status?.status,
        lastSeen: status?.lastSeen,
        loading: !status && isConnected
    };
}

// Hook to get all online users
export function useOnlineUsers() {
    const { onlineUsers, isConnected } = useWebSocket();
    return {
        onlineUsers,
        count: onlineUsers.length,
        isConnected
    };
}
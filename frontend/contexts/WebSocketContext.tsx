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
import {
    ConnectionStatus,
    MessageHandler,
    MessageType,
    OutgoingWebSocketMessage,
    WebSocketMessage,
} from "@/types/websocket.types";

// ==== Context Types ====

interface WebSocketContextType {
    // Connection state
    connectionStatus: ConnectionStatus;
    isConnected: boolean;

    // Actions
    connect: () => void;
    disconnect: () => void;
    send: (message: OutgoingWebSocketMessage) => boolean;

    // Handler registration
    registerHandler: <T extends WebSocketMessage>(
        type: MessageType,
        handler: MessageHandler<T>
    ) => () => void;
}

// ==== Context ====

const WebSocketContext = createContext<WebSocketContextType | undefined>(
    undefined
);

// ==== Provider ====

interface WebSocketProviderProps {
    children: ReactNode;
    autoConnect?: boolean;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
    children,
    autoConnect = true,
}) => {
    const [connectionStatus, setConnectionStatus] =
        useState<ConnectionStatus>("disconnected");

    // Derived state
    const isConnected = connectionStatus === "connected";

    // Connect to WebSocket
    const connect = useCallback(() => {
        connectWebSocket();
    }, []);

    // Disconnect from WebSocket
    const disconnect = useCallback(() => {
        disconnectWebSocket();
    }, []);

    // Send message
    const send = useCallback((message: OutgoingWebSocketMessage): boolean => {
        return webSocketService.send(message);
    }, []);

    // Register handler (memoized to prevent unnecessary re-renders)
    const registerHandler = useCallback(
        <T extends WebSocketMessage>(
            type: MessageType,
            handler: MessageHandler<T>
        ): (() => void) => {
            return webSocketService.registerHandler(type, handler);
        },
        []
    );

    // Subscribe to connection status changes
    useEffect(() => {
        const unsubscribe = webSocketService.onStatusChange((status) => {
            setConnectionStatus(status);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    // Auto-connect on mount
    useEffect(() => {
        if (autoConnect) {
            connect();
        }

        return () => {
            disconnect();
        };
    }, [autoConnect, connect, disconnect]);

    // Memoized context value
    const value = useMemo(
        () => ({
            connectionStatus,
            isConnected,
            connect,
            disconnect,
            send,
            registerHandler,
        }),
        [connectionStatus, isConnected, connect, disconnect, send, registerHandler]
    );

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
};

// ==== Hook ====

export const useWebSocket = (): WebSocketContextType => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error("useWebSocket must be used within a WebSocketProvider");
    }
    return context;
};

// ==== Utility Hook for registering handlers ====

/**
 * Hook to register a WebSocket message handler
 * Automatically unregisters when component unmounts
 */
export function useWebSocketHandler<T extends WebSocketMessage>(
    type: MessageType,
    handler: MessageHandler<T>,
    deps: React.DependencyList = []
) {
    const { registerHandler } = useWebSocket();

    useEffect(() => {
        const unsubscribe = registerHandler(type, handler);
        return () => {
            unsubscribe();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [type, registerHandler, ...deps]);
}

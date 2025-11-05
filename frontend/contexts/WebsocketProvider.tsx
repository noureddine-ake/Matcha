// src/app/providers/WebSocketProvider.tsx
"use client";

import { useEffect } from "react";

export const notificationTypes = {
    LIKE: 'like',
    MATCH: 'match',
    UNLIKE: 'unlike',
    VIEW: 'view',
    MESSAGE: 'message'
  };

// src/lib/socket.ts
let socket: WebSocket | null = null;

export const connectWebSocket = () => {
  if (socket) return socket;

  socket = new WebSocket(`ws://localhost:5000/ws`);

  socket.onopen = () => {
    console.log("✅ Connected to WebSocket server");
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log("📩 WebSocket message:", data);

    if (data.socket_type === "notification") {
      // handle notifications
      console.log("🔔 Notification:", data.data);
    } else if (data.socket_type === "message") {
      // handle chat messages
      console.log("💬 Message:", data.data);
    }
  };

  socket.onclose = () => {
    console.log("❌ WebSocket disconnected");
    socket = null;
  };

  socket.onerror = (err) => {
    console.error("⚠️ WebSocket error:", err);
  };

  return socket;
};

export const sendPing = () => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: "ping" }));
  }
};

export const closeSocket = () => {
  if (socket) socket.close();
};

export default function WebSocketProvider({ children }: { children: React.ReactNode }) {
// const token = cookies.get('token')?.value;
  useEffect(() => {
        connectWebSocket();

        return () => {
            closeSocket();
        };
    }, []);

  return <>{children}</>;
}

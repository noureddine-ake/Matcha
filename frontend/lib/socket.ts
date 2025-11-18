import { Notification } from "@/contexts/notifications-provider";

let socket: WebSocket | null = null;

export const connectWebSocket = (
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>
) => {
  if (socket) return socket;

  socket = new WebSocket(`ws://localhost:5000/ws`);

  socket.onopen = () => {
    console.log("✅ Connected to WebSocket server");
  };

  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    // console.log("📩 WebSocket message:", message);

    if (message.type === "notification") {
      // handle notifications
      console.log("🔔 Notification:", message.data);
      setNotifications((prev) => [
        ...(prev ?? []),
        {
          id: message.data.id,
          type: message.data.type,
          is_read: message.data.is_read,
          from_username: message.data.from_user.username,
          from_user_id: message.data.from_user.id,
          message:
            message.data.type === "like" ? "yeah it's a like" : "Ooo you matched",
        } as Notification,
      ]);
    } else if (message.type === "message") {
      // handle chat messages
      console.log("💬 Message:", message.data);
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

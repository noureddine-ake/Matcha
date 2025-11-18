"use client";

import { closeSocket, connectWebSocket } from "@/lib/socket";

import { useEffect } from "react";
import { useNotifications } from "./notifications-provider";

export const notificationsTypes = {
  LIKE: "like",
  MATCH: "match",
  UNLIKE: "unlike",
  VIEW: "view",
  MESSAGE: "message",
};

export default function WebSocketProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const ntf = useNotifications();

  useEffect(() => {
    connectWebSocket(ntf.setNotifications);

    return () => {
      closeSocket();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}

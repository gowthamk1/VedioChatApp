import React, { createContext, useContext, useMemo, useEffect } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const socket = useMemo(() => {
    const socketInstance = io("http://localhost:8000", {
      transports: ["websocket"],          // Force WebSocket transport
      reconnectionAttempts: 5,            // Try reconnecting up to 5 times
    });

    socketInstance.on("connect", () => {
      console.log("✅ Connected to WebSocket server:", socketInstance.id);
    });

    socketInstance.on("disconnect", (reason) => {
      console.warn("❌ Disconnected from WebSocket server:", reason);
    });

    socketInstance.on("connect_error", (err) => {
      console.error("🚫 WebSocket connection error:", err.message);
    });

    return socketInstance;
  }, []);

  // Optional: Cleanup on full app unmount (rare in SPAs)
  useEffect(() => {
    return () => {
      // Commented out to avoid disconnects on page transitions
      // socket.disconnect();
      console.log("ℹ️ SocketProvider unmounted");
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

import React, { createContext, useContext, useMemo, useEffect } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const socket = useMemo(() => {
    const socketInstance = io("https://vediochatapp-server-fb3a15c736f5.herokuapp.com", {
      transports: ["websocket"],        
      reconnectionAttempts: 5,           
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

  useEffect(() => {
    return () => {
      console.log("ℹ️ SocketProvider unmounted");
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

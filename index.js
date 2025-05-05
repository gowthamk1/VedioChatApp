require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const pool = require("./db"); 

const app = express();
const server = http.createServer(app);


const corsOptions = {
  origin: process.env.CLIENT_URL || "https://vediochatapplication.netlify.app/", 
  methods: ["GET", "POST"],
  credentials: true, // Optional, based on your needs
};

app.use(cors(corsOptions));

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "https://vediochatapplication.netlify.app/", 
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("room:join", ({ email, room }) => {
    socket.join(room);
    console.log(`${email} joined room ${room}`);

    const clients = Array.from(io.sockets.adapter.rooms.get(room) || []);
    const otherClient = clients.find((id) => id !== socket.id);

    if (otherClient) {
      socket.to(otherClient).emit("user:joined", { id: socket.id });
      socket.emit("user:joined", { id: otherClient });
    }

    socket.emit("room:join", { email, room });
  });

  socket.on("user:call", ({ to, offer }) => {
    socket.to(to).emit("incomming:call", { from: socket.id, offer });
  });

  socket.on("call:accepted", ({ to, ans }) => {
    socket.to(to).emit("call:accepted", { ans });
  });

  socket.on("peer:nego:needed", ({ to, offer }) => {
    socket.to(to).emit("peer:nego:needed", { from: socket.id, offer });
  });

  socket.on("peer:nego:done", ({ to, ans }) => {
    socket.to(to).emit("peer:nego:final", { ans });
  });

  socket.on("ice-candidate", ({ to, candidate }) => {
    socket.to(to).emit("ice-candidate", { candidate });
  });

  socket.on("text-message", async ({ room, message, sender }) => {
    try {
      await pool.query(
        "INSERT INTO messages (room_id, sender, content) VALUES ($1, $2, $3)",
        [room, sender, message]
      );
      console.log("Message stored in DB");
    } catch (error) {
      console.error("DB insert failed:", error.message);
    }

    socket.to(room).emit("text-message", {
      message,
      sender,
    });
  });

  socket.on("end-call", ({ to }) => {
    socket.to(to).emit("call-ended");
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Use the port from the environment variable in production
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

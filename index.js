require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { Pool } = require("pg");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  // Join room
  socket.on("room:join", ({ email, room }) => {
    socket.join(room);
    console.log(`👤 ${email} joined room: ${room}`);
    socket.to(room).emit("user:joined", { id: socket.id });
  });

  // Call events
  socket.on("user:call", ({ to, offer }) => {
    console.log(`📞 Call offer from ${socket.id} to ${to}`);
    io.to(to).emit("incomming:call", { from: socket.id, offer });
  });

  socket.on("call:accepted", ({ to, ans }) => {
    io.to(to).emit("call:accepted", { ans });
  });

  // Negotiation
  socket.on("peer:nego:needed", ({ to, offer }) => {
    io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
  });

  socket.on("peer:nego:done", ({ to, ans }) => {
    io.to(to).emit("peer:nego:final", { ans });
  });

  // ICE candidate
  socket.on("ice-candidate", ({ to, candidate }) => {
    io.to(to).emit("ice-candidate", { candidate });
  });

  // Camera toggle
  socket.on("camera-toggle", ({ to, on, from }) => {
    io.to(to).emit("camera-toggle", { on, from });
  });

  // End call
  socket.on("end-call", ({ to }) => {
    console.log(`❌ Call ended by ${socket.id}`);
    io.to(to).emit("call-ended");
  });

  // Text message handling
  socket.on("text-message", async ({ room, message, sender }) => {
    console.log("💬 text-message received:", { room, message, sender });

    try {
      const result = await pool.query(
        "INSERT INTO messages (room_id, sender, content) VALUES ($1, $2, $3) RETURNING *",
        [room, sender, message]
      );
      console.log("✅ Message saved:", result.rows[0]);
    } catch (err) {
      console.error("❌ DB insert error:", err.message);
    }

    socket.to(room).emit("text-message", { message, sender });
  });

  // On disconnect
  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketProvider";

const LobbyScreen = () => {
  const [email, setEmail] = useState("");
  const [room, setRoom] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const socket = useSocket();
  const navigate = useNavigate();

  const handleSubmitForm = useCallback(
    (e) => {
      e.preventDefault();
      if (!email || !room) {
        setError("Please enter both email and room ID");
        return;
      }

      setLoading(true);
      socket.emit("room:join", { email, room });
    },
    [email, room, socket]
  );

  const handleJoinRoom = useCallback(
    (data) => {
      const { room } = data;
      setLoading(false); 
      navigate(`/room/${room}`);
    },
    [navigate]
  );

  const handleJoinRoomError = useCallback(() => {
    setLoading(false); 
    setError("Failed to join the room. Please try again.");
  }, []);

  useEffect(() => {
    socket.on("room:join", handleJoinRoom);
    socket.on("room:join:error", handleJoinRoomError); 
    return () => {
      socket.off("room:join", handleJoinRoom);
      socket.off("room:join:error", handleJoinRoomError);
    };
  }, [socket, handleJoinRoom, handleJoinRoomError]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-indigo-200">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-semibold text-center text-indigo-600 mb-6">Join a Room</h1>
        <form onSubmit={handleSubmitForm} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-gray-700 font-medium mb-1">
              Email: 
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
              required
            />
          </div>
          <div>
            <label htmlFor="room" className="block text-gray-700 font-medium mb-1">
              Room ID: 
            </label>
            <input
              id="room"
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
              required
            />
          </div><br />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg transition duration-200"
            disabled={loading}
          >
            {loading ? "Joining..." : "Join Room"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LobbyScreen;

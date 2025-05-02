import React, { useEffect, useCallback, useState } from "react";
import ReactPlayer from "react-player";
import peer from "../service/peer";
import { useSocket } from "../context/SocketProvider";
import { useParams, useNavigate } from "react-router-dom";

const RoomPage = () => {
  const socket = useSocket();
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [email] = useState("user_" + Math.floor(Math.random() * 1000));
  const [callActive, setCallActive] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [incomingCall, setIncomingCall] = useState(false);
  const [callerInfo, setCallerInfo] = useState(null);

  useEffect(() => {
    socket.emit("room:join", { email, room: roomId });

    const getMedia = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      setMyStream(stream);
    };
    getMedia();

    peer.resetPeer(); // 🔄 Reset peer connection on entering room
  }, [roomId, socket, email]);

  const handleUserJoined = useCallback(({ id }) => {
    if (!remoteSocketId && id !== socket.id) {
      setRemoteSocketId(id);
    }
  }, [remoteSocketId, socket.id]);

  const handleCallUser = useCallback(async () => {
    if (!remoteSocketId || !myStream) return;
    myStream.getTracks().forEach(track => peer.getCurrentPeer().addTrack(track, myStream));
    const offer = await peer.getOffer();
    socket.emit("user:call", { to: remoteSocketId, offer });
    setCallActive(true);
  }, [remoteSocketId, socket, myStream]);

  const handleIncomingCall = useCallback(async ({ from, offer }) => {
    setIncomingCall(true);
    setCallerInfo({ from, offer });
    setRemoteSocketId(from);
  }, []);

  const acceptCall = useCallback(async () => {
    if (!callerInfo || !myStream) return;
    myStream.getTracks().forEach(track => peer.getCurrentPeer().addTrack(track, myStream));
    const ans = await peer.getAnswer(callerInfo.offer);
    socket.emit("call:accepted", { to: callerInfo.from, ans });
    setCallActive(true);
    setIncomingCall(false);
  }, [callerInfo, socket, myStream]);

  const rejectCall = () => {
    setIncomingCall(false);
    setCallerInfo(null);
  };

  const handleCallAccepted = useCallback(({ ans }) => {
    peer.setRemoteDescription(ans);
  }, []);

  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
  }, [remoteSocketId, socket]);

  const handleNegoNeedIncoming = useCallback(async ({ from, offer }) => {
    const ans = await peer.getAnswer(offer);
    socket.emit("peer:nego:done", { to: from, ans });
  }, [socket]);

  const handleNegoNeedFinal = useCallback(async ({ ans }) => {
    await peer.setRemoteDescription(ans);
  }, []);

  const handleNewIceCandidateMsg = useCallback(async ({ candidate }) => {
    await peer.addIceCandidate(candidate);
  }, []);

  const handleReceiveMessage = useCallback(({ message, sender }) => {
    if (sender !== email) {
      setMessages(prev => [...prev, { fromSelf: false, message, sender }]);
    }
  }, [email]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      socket.emit("text-message", {
        room: roomId,
        message: newMessage,
        sender: email,
      });
      setMessages(prev => [...prev, { fromSelf: true, message: newMessage }]);
      setNewMessage("");
    }
  };

  const handleEndCall = () => {
    if (myStream) {
      myStream.getTracks().forEach(track => track.stop());
      setMyStream(null);
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
      setRemoteStream(null);
    }
    peer.getCurrentPeer().close();
    setCallActive(false);
    setCallEnded(true);
    socket.emit("end-call", { to: remoteSocketId });
  };

  const handleRemoteEndCall = useCallback(() => {
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
    }
    setRemoteStream(null);
    setCallActive(false);
    setCallEnded(true);
  }, [remoteStream]);

  useEffect(() => {
    peer.getCurrentPeer().addEventListener("track", (ev) => {
      setRemoteStream(ev.streams[0]);
    });
  }, []);

  useEffect(() => {
    socket.on("user:joined", handleUserJoined);
    socket.on("incomming:call", handleIncomingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:nego:needed", handleNegoNeedIncoming);
    socket.on("peer:nego:final", handleNegoNeedFinal);
    socket.on("ice-candidate", handleNewIceCandidateMsg);
    socket.on("text-message", handleReceiveMessage);
    socket.on("call-ended", handleRemoteEndCall);

    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("incomming:call", handleIncomingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("peer:nego:needed", handleNegoNeedIncoming);
      socket.off("peer:nego:final", handleNegoNeedFinal);
      socket.off("ice-candidate", handleNewIceCandidateMsg);
      socket.off("text-message", handleReceiveMessage);
      socket.off("call-ended", handleRemoteEndCall);
    };
  }, [
    socket,
    handleUserJoined,
    handleIncomingCall,
    handleCallAccepted,
    handleNegoNeedIncoming,
    handleNegoNeedFinal,
    handleNewIceCandidateMsg,
    handleReceiveMessage,
    handleRemoteEndCall
  ]);

  useEffect(() => {
    peer.getCurrentPeer().onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          to: remoteSocketId,
          candidate: event.candidate,
        });
      }
    };
  }, [remoteSocketId, socket]);

  return (
    <div>
      <h1>Room: {roomId}</h1>
      <h4>{remoteSocketId ? "Connected" : "Waiting for peer..."}</h4>

      {incomingCall && (
        <div>
          <p>Incoming call...</p>
          <button onClick={acceptCall}>Accept</button>
          <button onClick={rejectCall}>Reject</button>
        </div>
      )}

      {!callActive && !incomingCall && remoteSocketId && myStream && (
        <button onClick={handleCallUser}>Call</button>
      )}

      {callActive && <button onClick={handleEndCall}>End Call</button>}
      {callEnded && <button onClick={() => navigate("/")}>Home</button>}

      {myStream && (
        <div>
          <h3>My Stream</h3>
          <ReactPlayer playing muted height="200px" width="300px" url={myStream} />
        </div>
      )}

      {remoteStream && (
        <div>
          <h3>Remote Stream</h3>
          <ReactPlayer playing height="200px" width="300px" url={remoteStream} />
        </div>
      )}

      <div style={{ marginTop: "20px", padding: "10px", border: "1px solid #ccc" }}>
        <h3>Chat</h3>
        <div style={{ height: "200px", overflowY: "auto", marginBottom: "10px" }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ textAlign: msg.fromSelf ? "right" : "left" }}>
              <span style={{
                background: msg.fromSelf ? "#DCF8C6" : "#F1F0F0",
                padding: "5px 10px",
                borderRadius: "10px",
                display: "inline-block",
                marginBottom: "4px"
              }}>
                {!msg.fromSelf && msg.sender ? <strong>{msg.sender}: </strong> : null}
                {msg.message}
              </span>
            </div>
          ))}
        </div>
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          type="text"
          placeholder="Type a message"
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
};

export default RoomPage;

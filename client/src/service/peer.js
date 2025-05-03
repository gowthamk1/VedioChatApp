class PeerService {
  constructor() {
    this._createNewPeer();
    this.remoteDescSet = false;
    this.candidateQueue = [];
  }

  _createNewPeer() {
    this.peer = new RTCPeerConnection({
      iceServers: [
        {
          urls: ["stun:stun.l.google.com:19302"],
        },
      ],
    });

    this.peer.onconnectionstatechange = () => {
      const state = this.peer.connectionState;
      console.log(`🔁 Peer connection state changed: ${state}`);
      if (state === "disconnected" || state === "closed" || state === "failed") {
        console.warn("Peer connection closed or failed.");
      }
    };
  }

  resetPeer() {
    if (this.peer) {
      try {
        this.peer.close();
      } catch (e) {
        console.warn("Error closing peer:", e);
      }
    }

    this._createNewPeer();
    this.remoteDescSet = false;
    this.candidateQueue = [];
  }

  getCurrentPeer() {
    return this.peer;
  }

  async getOffer() {
    const offer = await this.peer.createOffer();
    await this.peer.setLocalDescription(offer);
    return offer;
  }

  async getAnswer(offer) {
    await this.setRemoteDescription(offer);
    const answer = await this.peer.createAnswer();
    await this.peer.setLocalDescription(answer);
    return answer;
  }

  async setRemoteDescription(desc) {
    const rtcDesc = new RTCSessionDescription(desc);
    await this.peer.setRemoteDescription(rtcDesc);
    this.remoteDescSet = true;
    this._drainCandidates();
  }

  async addIceCandidate(candidate) {
    const iceCandidate = new RTCIceCandidate(candidate);
    if (this.remoteDescSet) {
      await this.peer.addIceCandidate(iceCandidate);
    } else {
      this.candidateQueue.push(iceCandidate);
    }
  }

  _drainCandidates() {
    this.candidateQueue.forEach(async (candidate) => {
      try {
        await this.peer.addIceCandidate(candidate);
      } catch (err) {
        console.error("❌ Error adding candidate from queue:", err);
      }
    });
    this.candidateQueue = [];
  }
}

export default new PeerService();

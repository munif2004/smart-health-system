import React, { useEffect, useRef, useState } from 'react';
import { FiMonitor, FiMic, FiMicOff, FiPhoneOff, FiSend, FiVideo, FiVideoOff } from 'react-icons/fi';
import './VideoConsultation.css';
import socketService from '../utils/socket';

const iceServers = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

const VideoConsultation = ({ roomId, user, onClose }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const pendingIceCandidatesRef = useRef([]);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [sharingScreen, setSharingScreen] = useState(false);
  const [status, setStatus] = useState('Connecting...');

  const attachVideoStream = (videoRef, stream, label, shouldMute = false) => {
    const video = videoRef.current;
    if (!video || !stream) {
      console.warn(`[WebRTC] ${label} video attach skipped`, { hasVideo: Boolean(video), hasStream: Boolean(stream) });
      return;
    }

    if (video.srcObject !== stream) {
      video.srcObject = stream;
    }
    video.muted = shouldMute;
    video.autoplay = true;
    video.playsInline = true;
    video.onloadedmetadata = () => {
      console.log(`[WebRTC] ${label} video metadata loaded`, {
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        readyState: video.readyState
      });
    };
    video.onplaying = () => {
      console.log(`[WebRTC] ${label} video playing`, {
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        tracks: stream.getTracks().map((track) => `${track.kind}:${track.readyState}:${track.enabled}`)
      });
    };
    video.play?.().catch((error) => console.warn(`[WebRTC] ${label} video play blocked`, error));
    console.log('local src', localVideoRef.current?.srcObject);
    console.log('remote src', remoteVideoRef.current?.srcObject);
    console.log(`[WebRTC] ${label} stream attached`, {
      streamId: stream.id,
      tracks: stream.getTracks().map((track) => `${track.kind}:${track.readyState}:${track.enabled}`)
    });
  };

  useEffect(() => {
    let mounted = true;

    const flushPendingIceCandidates = async () => {
      const peer = peerRef.current;
      if (!peer?.remoteDescription || pendingIceCandidatesRef.current.length === 0) return;

      const candidates = [...pendingIceCandidatesRef.current];
      pendingIceCandidatesRef.current = [];
      await Promise.all(candidates.map(async (candidate) => {
        try {
          await peer.addIceCandidate(new RTCIceCandidate(candidate));
          console.log('[WebRTC] queued ICE candidate added', candidate);
        } catch (error) {
          console.error('[WebRTC] failed to add queued ICE candidate', error, candidate);
        }
      }));
    };

    const createPeer = (stream) => {
      const peer = new RTCPeerConnection(iceServers);
      console.log('[WebRTC] RTCPeerConnection created', { roomId });

      stream.getTracks().forEach((track) => {
        peer.addTrack(track, stream);
        console.log('[WebRTC] local track added', track.kind, track.id);
      });

      peer.ontrack = (event) => {
        const [eventStream] = event.streams || [];
        const remoteStream = eventStream || remoteStreamRef.current || new MediaStream();
        if (!eventStream && event.track && !remoteStream.getTracks().some((track) => track.id === event.track.id)) {
          remoteStream.addTrack(event.track);
        }
        remoteStreamRef.current = remoteStream;
        console.log('[WebRTC] remote track received', {
          kind: event.track?.kind,
          streamId: remoteStream?.id,
          tracks: remoteStream?.getTracks?.().map((track) => `${track.kind}:${track.readyState}:${track.enabled}`)
        });
        attachVideoStream(remoteVideoRef, remoteStream, 'remote', false);
        setStatus('Connected');
      };

      peer.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('[WebRTC] ICE candidate created', event.candidate);
          socketService.emit('webrtc-ice-candidate', { roomId, candidate: event.candidate });
        }
      };

      peer.onconnectionstatechange = () => {
        console.log('[WebRTC] peer connection state', peer.connectionState);
        if (peer.connectionState === 'connected') setStatus('Connected');
        if (['failed', 'disconnected'].includes(peer.connectionState)) setStatus('Reconnecting');
      };

      peer.oniceconnectionstatechange = () => {
        console.log('[WebRTC] ICE connection state', peer.iceConnectionState);
      };

      return peer;
    };

    const start = async () => {
      try {
        socketService.connect();
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('getUserMedia is not available in this browser/context');
        }
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (!mounted) return;

        console.log('[WebRTC] stream created', {
          streamId: stream.id,
          tracks: stream.getTracks().map((track) => `${track.kind}:${track.readyState}:${track.enabled}`)
        });
        localStreamRef.current = stream;
        attachVideoStream(localVideoRef, stream, 'local', true);
        peerRef.current = createPeer(stream);

        console.log('ROOM ID:', roomId);
        console.log('USER DATA:', user);
        socketService.emit('join-consultation', { roomId, userId: user?.id, role: user?.role });
        setStatus('Waiting for the other participant...');
      } catch (error) {
        console.error('[WebRTC] getUserMedia failed', error);
        setStatus('Camera or microphone permission is required');
      }
    };

    const handleUserJoined = async () => {
      if (!peerRef.current || peerRef.current.signalingState !== 'stable') {
        console.warn('[WebRTC] skipped offer; peer not ready or signaling not stable', peerRef.current?.signalingState);
        return;
      }
      try {
        const offer = await peerRef.current.createOffer();
        console.log('[WebRTC] offer created');
        await peerRef.current.setLocalDescription(offer);
        socketService.emit('webrtc-offer', { roomId, offer });
      } catch (error) {
        console.error('[WebRTC] failed to create/send offer', error);
      }
    };

    const handleOffer = async ({ offer }) => {
      if (!peerRef.current || !offer) return;
      try {
        console.log('[WebRTC] offer received');
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(offer));
        await flushPendingIceCandidates();
        const answer = await peerRef.current.createAnswer();
        await peerRef.current.setLocalDescription(answer);
        socketService.emit('webrtc-answer', { roomId, answer });
        console.log('[WebRTC] answer created and sent');
      } catch (error) {
        console.error('[WebRTC] failed to handle offer', error);
      }
    };

    const handleAnswer = async ({ answer }) => {
      if (!peerRef.current || !answer || peerRef.current.signalingState === 'stable') return;
      try {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        console.log('[WebRTC] answer received');
        await flushPendingIceCandidates();
      } catch (error) {
        console.error('[WebRTC] failed to handle answer', error);
      }
    };

    const handleCandidate = async ({ candidate }) => {
      if (!candidate || !peerRef.current) return;
      console.log('[WebRTC] candidate received', candidate);
      if (!peerRef.current.remoteDescription) {
        pendingIceCandidatesRef.current.push(candidate);
        console.log('[WebRTC] candidate queued until remote description is set');
        return;
      }
      try {
        await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        console.log('[WebRTC] ICE candidate added');
      } catch (error) {
        console.error('[WebRTC] failed to add ICE candidate', error, candidate);
      }
    };

    const handleMessage = (payload) => {
      console.log('RECEIVED CHAT:', payload);
      console.log('MY USER:', user);
      if (payload.roomId && payload.roomId !== roomId) return;
      setMessages((current) => [...current, payload]);
    };

    start();
    socketService.on('consultation-user-joined', handleUserJoined);
    socketService.on('webrtc-offer', handleOffer);
    socketService.on('webrtc-answer', handleAnswer);
    socketService.on('webrtc-ice-candidate', handleCandidate);
    socketService.on('consultation-message', handleMessage);

    return () => {
      mounted = false;
      [
        ['consultation-user-joined', handleUserJoined],
        ['webrtc-offer', handleOffer],
        ['webrtc-answer', handleAnswer],
        ['webrtc-ice-candidate', handleCandidate],
        ['consultation-message', handleMessage]
      ].forEach(([event, handler]) => socketService.removeListener(event, handler));
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      remoteStreamRef.current?.getTracks().forEach((track) => track.stop());
      peerRef.current?.close();
      remoteStreamRef.current = null;
      pendingIceCandidatesRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, user]);

  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach((track) => { track.enabled = muted; });
    setMuted(!muted);
  };

  const toggleCamera = () => {
    localStreamRef.current?.getVideoTracks().forEach((track) => { track.enabled = cameraOff; });
    setCameraOff(!cameraOff);
  };

  const shareScreen = async () => {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    const screenTrack = screenStream.getVideoTracks()[0];
    const sender = peerRef.current?.getSenders().find((item) => item.track?.kind === 'video');
    if (sender) sender.replaceTrack(screenTrack);
    screenTrack.onended = () => setSharingScreen(false);
    setSharingScreen(true);
  };

 const sendMessage = () => {
  if (!message.trim()) return;

  const payload = {
    roomId,
    message,
    sender: user?.name || "User"
  };

  socketService.emit("consultation-message", payload);

  setMessage('');
};

  return (
    <div className="video-page">
      <div className="video-stage">
        <div className="video-grid">
          <div className="video-tile remote-tile">
            <video ref={remoteVideoRef} autoPlay playsInline className="remote-video" data-video-role="remote" />
            <span>{user?.role === 'doctor' ? 'Patient' : 'Doctor'}</span>
          </div>
          <div className="video-tile local-tile">
            <video ref={localVideoRef} autoPlay playsInline muted className="local-video" data-video-role="local" />
            <span>{user?.name || (user?.role === 'doctor' ? 'Doctor' : 'Patient')}</span>
          </div>
        </div>
        <div className="video-status">{status}</div>
        <div className="video-controls">
          <button title={muted ? 'Unmute' : 'Mute'} onClick={toggleMute}>{muted ? <FiMicOff /> : <FiMic />}</button>
          <button title={cameraOff ? 'Turn camera on' : 'Turn camera off'} onClick={toggleCamera}>{cameraOff ? <FiVideoOff /> : <FiVideo />}</button>
          <button title={sharingScreen ? 'Stop sharing' : 'Share screen'} className={sharingScreen ? 'active' : ''} onClick={shareScreen}><FiMonitor /></button>
          <button title="End call" className="danger" onClick={onClose}><FiPhoneOff /></button>
        </div>
      </div>
      <aside className="video-chat">
        <h3>Consultation Chat</h3>
     <div
  className="video-messages"
  style={{
    minHeight: "200px"
  }}
>
        {messages.map((item, index) => (
  <div
    key={index}
    className={
      item.sender === user?.name
        ? "my-message"
        : "other-message"
    }
  >
    <strong>{item.sender}</strong>
    <p>{item.message}</p>
  </div>
))}
        </div>
        <div className="video-input">
          <input value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && sendMessage()} placeholder="Type message..." />
          <button onClick={sendMessage}><FiSend /></button>
        </div>
      </aside>
    </div>
  );
};

export default VideoConsultation;

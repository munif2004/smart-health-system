import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FiCheck, FiCheckCircle, FiCopy, FiMonitor, FiMic, FiMicOff, FiPhoneOff, FiSend, FiVideo, FiVideoOff } from 'react-icons/fi';
import './VideoConsultation.css';
import socketService from '../utils/socket';
import { consultationAPI } from '../utils/api';

const iceServers = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
const getUserId = (user) => user?.id || user?._id || user?.userId;
const formatTime = (date) => new Date(date || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const makeClientMessageId = (userId) => `${userId || 'user'}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const dedupeMessages = (items) => {
  const seen = new Set();
  return items.filter((item) => {
    const timeBucket = Math.floor(new Date(item.timestamp || item.createdAt || Date.now()).getTime() / 3000);
    const key = item.clientMessageId || item._id || `${item.roomId}:${item.senderId}:${item.message}:${timeBucket}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const ConsultationRoom = ({ roomId, appointmentId, user, onClose }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const messagesEndRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const pendingIceCandidatesRef = useRef([]);
  const typingTimerRef = useRef(null);
  const screenTrackRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [sharingScreen, setSharingScreen] = useState(false);
  const [status, setStatus] = useState('Connecting');
  const [connectionState, setConnectionState] = useState('new');
  const [remoteMediaStream, setRemoteMediaStream] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  const [unreadCount, setUnreadCount] = useState(0);

  const userId = getUserId(user);
  const senderName = user?.name || (user?.role === 'doctor' ? 'Doctor' : 'Patient');
  const senderRole = user?.role || 'user';

  const sortedMessages = useMemo(() => (
    dedupeMessages([...messages]).sort((a, b) => new Date(a.timestamp || a.createdAt) - new Date(b.timestamp || b.createdAt))
  ), [messages]);

  const upsertMessage = useCallback((incoming) => {
    setMessages((current) => {
      const match = (item) => (
        (incoming._id && item._id === incoming._id) ||
        (incoming.clientMessageId && item.clientMessageId === incoming.clientMessageId)
      );
      const exists = current.some(match);
      return exists
        ? current.map((item) => (match(item) ? { ...item, ...incoming } : item))
        : [...current, incoming];
    });
  }, []);

  const attachVideoStream = useCallback((videoRef, stream, label, shouldMute = false) => {
    const video = videoRef.current;
    if (!video || !stream) {
      console.warn(`[WebRTC] ${label} video attach skipped`, { hasVideo: Boolean(video), hasStream: Boolean(stream) });
      return;
    }

    if (video.srcObject !== stream) {
      video.srcObject = stream;
    }
    if (label === 'remote' && localStreamRef.current && stream.id === localStreamRef.current.id) {
      console.warn('[WebRTC] remote stream has the same id as local stream; not expected', {
        streamId: stream.id,
        localStreamId: localStreamRef.current.id
      });
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
    console.log(`${label} src`, video.srcObject);
    console.log(`[WebRTC] ${label} stream attached`, {
      streamId: stream.id,
      tracks: stream.getTracks().map((track) => `${track.kind}:${track.readyState}:${track.enabled}`)
    });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [sortedMessages.length, typingUsers]);

  useEffect(() => {
    if (!remoteMediaStream) return;

    console.log('REMOTE STREAM', remoteMediaStream);
    console.log('REMOTE VIDEO ELEMENT', remoteVideoRef.current);
    attachVideoStream(remoteVideoRef, remoteMediaStream, 'remote', false);
  }, [attachVideoStream, remoteMediaStream]);

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
          tracks: remoteStream?.getTracks?.().map((track) => `${track.kind}:${track.readyState}`)
        });
        console.log('REMOTE STREAM', remoteStream);
        console.log('REMOTE VIDEO ELEMENT', remoteVideoRef.current);
        setRemoteMediaStream(remoteStream);
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
        setConnectionState(peer.connectionState);
        if (peer.connectionState === 'connected') setStatus('Connected');
        if (['failed', 'disconnected'].includes(peer.connectionState)) setStatus('Reconnecting');
        if (peer.connectionState === 'closed') setStatus('Call ended');
      };
      peer.oniceconnectionstatechange = () => {
        console.log('[WebRTC] ICE connection state', peer.iceConnectionState);
      };
      return peer;
    };

    const start = async () => {
      try {
        const history = await consultationAPI.getConsultation(roomId);
        if (!mounted) return;
        setMessages((history.data.messages || []).map((item) => ({
          ...item,
          timestamp: item.createdAt,
          status: item.isRead ? 'read' : item.deliveredAt ? 'delivered' : 'sent'
        })));
        setUnreadCount(history.data.unreadCount || 0);
        consultationAPI.markMessagesRead(roomId).then(() => setUnreadCount(0)).catch(() => {});
      } catch (error) {
        console.warn('[WebRTC] consultation history failed; continuing call setup', error?.response?.data || error);
      }

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
        console.log('LOCAL STREAM', stream);
        localStreamRef.current = stream;
        attachVideoStream(localVideoRef, stream, 'local', true);
        peerRef.current = createPeer(stream);
        socketService.emit('join-consultation', { roomId, userId, role: senderRole, senderName });
        setStatus('Waiting for participant');
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
      if (payload.roomId !== roomId) return;
      upsertMessage(payload);
      if (String(payload.senderId) !== String(userId)) {
        setUnreadCount((count) => count + 1);
        consultationAPI.markMessagesRead(roomId).then(() => setUnreadCount(0)).catch(() => {});
      }
    };
    const handleTyping = (payload) => {
      if (payload.roomId !== roomId || String(payload.userId) === String(userId)) return;
      setTypingUsers((current) => {
        const next = { ...current };
        if (payload.isTyping) next[payload.userId] = payload.senderName || 'Participant';
        else delete next[payload.userId];
        return next;
      });
    };
    const handleRead = ({ readerId }) => {
      if (String(readerId) === String(userId)) return;
      setMessages((current) => current.map((item) => (
        String(item.senderId) === String(userId) ? { ...item, status: 'read', isRead: true } : item
      )));
    };
    const handleEnded = () => {
      setStatus('Call ended');
      onClose?.();
    };

    start();
    socketService.on('consultation-user-joined', handleUserJoined);
    socketService.on('webrtc-offer', handleOffer);
    socketService.on('webrtc-answer', handleAnswer);
    socketService.on('webrtc-ice-candidate', handleCandidate);
    socketService.on('consultation-message', handleMessage);
    socketService.on('consultation-typing', handleTyping);
    socketService.on('consultation-messages-read', handleRead);
    socketService.on('consultation-ended', handleEnded);

    return () => {
      mounted = false;
      socketService.emit('leave-consultation', { roomId, userId, role: senderRole });
      [
        ['consultation-user-joined', handleUserJoined],
        ['webrtc-offer', handleOffer],
        ['webrtc-answer', handleAnswer],
        ['webrtc-ice-candidate', handleCandidate],
        ['consultation-message', handleMessage],
        ['consultation-typing', handleTyping],
        ['consultation-messages-read', handleRead],
        ['consultation-ended', handleEnded]
      ].forEach(([event, handler]) => socketService.removeListener(event, handler));
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      remoteStreamRef.current?.getTracks().forEach((track) => track.stop());
      screenTrackRef.current?.stop();
      peerRef.current?.close();
      remoteStreamRef.current = null;
      setRemoteMediaStream(null);
      pendingIceCandidatesRef.current = [];
    };
  }, [appointmentId, attachVideoStream, onClose, roomId, senderName, senderRole, upsertMessage, userId]);

  const emitTyping = (value) => {
    setMessage(value);
    socketService.emit('consultation-typing', { roomId, userId, senderName, senderRole, isTyping: true });
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socketService.emit('consultation-typing', { roomId, userId, senderName, senderRole, isTyping: false });
    }, 900);
  };

  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach((track) => { track.enabled = muted; });
    setMuted((value) => !value);
  };

  const toggleCamera = () => {
    localStreamRef.current?.getVideoTracks().forEach((track) => { track.enabled = cameraOff; });
    setCameraOff((value) => !value);
  };

  const shareScreen = async () => {
    if (sharingScreen) {
      const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
      const sender = peerRef.current?.getSenders().find((item) => item.track?.kind === 'video');
      if (sender && cameraTrack) await sender.replaceTrack(cameraTrack);
      screenTrackRef.current?.stop();
      setSharingScreen(false);
      return;
    }
    const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    const screenTrack = screenStream.getVideoTracks()[0];
    screenTrackRef.current = screenTrack;
    const sender = peerRef.current?.getSenders().find((item) => item.track?.kind === 'video');
    if (sender) await sender.replaceTrack(screenTrack);
    screenTrack.onended = () => setSharingScreen(false);
    setSharingScreen(true);
  };

  const endCall = async () => {
    await consultationAPI.endConsultation(roomId).catch(() => {});
    onClose?.();
  };

  const sendMessage = () => {
    const text = message.trim();
    if (!text) return;
    if (!userId) {
      setStatus('User session missing. Please log in again.');
      return;
    }
    const clientMessageId = makeClientMessageId(userId);
    const tempId = `temp-${clientMessageId}`;
    upsertMessage({ _id: tempId, clientMessageId, roomId, appointmentId, senderId: userId, senderName, senderRole, message: text, timestamp: new Date().toISOString(), status: 'sending' });
    socketService.emit('consultation-message', { roomId, appointmentId, senderId: userId, senderName, senderRole, message: text, clientMessageId }, (ack) => {
      if (ack?.message) {
        setMessages((current) => current.filter((item) => item._id !== tempId));
        upsertMessage(ack.message);
      } else if (ack?.error) {
        setMessages((current) => current.map((item) => item._id === tempId ? { ...item, status: 'failed' } : item));
      }
    });
    setMessage('');
    socketService.emit('consultation-typing', { roomId, userId, senderName, senderRole, isTyping: false });
  };

  const typingText = Object.values(typingUsers).join(', ');

  return (
    <div className="video-page">
      <div className="video-stage">
        <div className="video-grid">
          <div className="video-tile remote-tile">
            <video ref={remoteVideoRef} autoPlay playsInline className="remote-video" data-video-role="remote" />
            <span>{senderRole === 'doctor' ? 'Patient' : 'Doctor'}</span>
          </div>
          <div className="video-tile local-tile">
            <video ref={localVideoRef} autoPlay playsInline muted className="local-video" data-video-role="local" />
            <span>{senderName}</span>
          </div>
        </div>
        <div className={`video-status ${connectionState}`}>{status}</div>
        <div className="video-controls">
          <button title={muted ? 'Unmute' : 'Mute'} onClick={toggleMute}>{muted ? <FiMicOff /> : <FiMic />}</button>
          <button title={cameraOff ? 'Turn camera on' : 'Turn camera off'} onClick={toggleCamera}>{cameraOff ? <FiVideoOff /> : <FiVideo />}</button>
          <button title={sharingScreen ? 'Stop sharing' : 'Share screen'} className={sharingScreen ? 'active' : ''} onClick={shareScreen}><FiMonitor /></button>
          <button title="End call" className="danger" onClick={endCall}><FiPhoneOff /></button>
        </div>
      </div>
      <aside className="video-chat">
        <header className="chat-header">
          <div>
            <h3>Consultation Chat</h3>
            <span>{unreadCount} unread</span>
          </div>
          <button title="Copy room ID" onClick={() => navigator.clipboard?.writeText(roomId)}><FiCopy /></button>
        </header>
        <div className="video-messages">
          {sortedMessages.map((item) => {
            const mine = String(item.senderId) === String(userId);
            return (
              <div key={item._id} className={`message-row ${mine ? 'mine' : 'theirs'} ${item.senderRole}`}>
                <div className="chat-bubble">
                  <strong>{item.senderName}</strong>
                  <p>{item.message}</p>
                  <small>{formatTime(item.timestamp || item.createdAt)}{mine && <span>{item.status === 'read' ? <FiCheckCircle /> : <FiCheck />}</span>}</small>
                </div>
              </div>
            );
          })}
          {typingText && <div className="typing-indicator">{typingText} is typing...</div>}
          <div ref={messagesEndRef} />
        </div>
        <div className="video-input">
          <input value={message} onChange={(event) => emitTyping(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && sendMessage()} placeholder="Type message..." />
          <button title="Send message" onClick={sendMessage}><FiSend /></button>
        </div>
      </aside>
    </div>
  );
};

export default ConsultationRoom;

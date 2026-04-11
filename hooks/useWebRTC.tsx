"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export type CallStatus = "idle" | "calling" | "incoming" | "active";

export function useWebRTC(myId: string | null, ws: WebSocket | null) {
  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  const [callPartner, setCallPartner] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState("00:00");

  const [alertInfo, setAlertInfo] = useState<{isOpen: boolean, type: "success" | "error", title: string, message: string}>({ 
    isOpen: false, type: "success", title: "", message: "" 
  });

  const partnerRef = useRef<string | null>(null);

  const updatePartner = useCallback((partner: string | null) => {
    partnerRef.current = partner; // Salva instantaneamente para as rotas ICE
    setCallPartner(partner);      // Salva para desenhar na tela
  }, []);

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  
  const callTimeout = useRef<NodeJS.Timeout | null>(null);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const iceCandidateQueue = useRef<RTCIceCandidateInit[]>([]);
  
  const ringtoneAudio = useRef<HTMLAudioElement | null>(null);
  const callingAudio = useRef<HTMLAudioElement | null>(null);

  const STUN_SERVERS = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
  const CALL_TIMEOUT_MS = 30000;

  useEffect(() => {
    ringtoneAudio.current = new Audio("/sounds/ringtone.mp3");
    ringtoneAudio.current.loop = true;
    callingAudio.current = new Audio("/sounds/calling.mp3");
    callingAudio.current.loop = true;
  }, []);

  const stopRingtones = useCallback(() => {
    if (ringtoneAudio.current) { ringtoneAudio.current.pause(); ringtoneAudio.current.currentTime = 0; }
    if (callingAudio.current) { callingAudio.current.pause(); callingAudio.current.currentTime = 0; }
  }, []);

  const resetCallUI = useCallback(() => {
    stopRingtones();
    if (callTimeout.current) clearTimeout(callTimeout.current);
    if (timerInterval.current) clearInterval(timerInterval.current);
    
    setCallStatus("idle");
    updatePartner(null);
    setCallDuration("00:00");
    setIsMuted(false);
    iceCandidateQueue.current = [];
    
    // MUDANÇA: Limpeza imediata do áudio geral no DOM
    const remoteAudio = document.getElementById("remoteAudio") as HTMLAudioElement | null;
    if (remoteAudio) {
      remoteAudio.srcObject = null;
    }

    if (localStream.current) {
      localStream.current.getTracks().forEach(t => t.stop());
      localStream.current = null;
    }
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
  }, [stopRingtones, updatePartner]);

  const endCall = useCallback((reason = 'manual') => {
    // Usamos a referência rápida aqui
    if (partnerRef.current && ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "end_call", target: partnerRef.current, reason }));
    }
    resetCallUI();
  }, [ws, resetCallUI]);

  const createPeerConnection = useCallback(() => {
    peerConnection.current = new RTCPeerConnection(STUN_SERVERS);
    
    peerConnection.current.onicecandidate = (e) => {
      // Usamos a referência rápida aqui para garantir que as rotas cheguem!
      if (e.candidate && ws && partnerRef.current) {
        ws.send(JSON.stringify({ type: "candidate", target: partnerRef.current, payload: e.candidate }));
      }
    };
    
    peerConnection.current.ontrack = (e) => {
      // MUDANÇA: Conexão direta com o HTML, sem atrasos do React!
      const remoteAudio = document.getElementById("remoteAudio") as HTMLAudioElement | null;
      if (remoteAudio && e.streams && e.streams[0]) {
        remoteAudio.srcObject = e.streams[0];
      }
    };
    
    if (localStream.current) {
      localStream.current.getTracks().forEach(t => peerConnection.current!.addTrack(t, localStream.current!));
    }
  }, [ws]);

  const processIceQueue = useCallback(() => {
    while (iceCandidateQueue.current.length) {
      const candidate = iceCandidateQueue.current.shift();
      if (candidate) peerConnection.current?.addIceCandidate(candidate).catch(e => console.error(e));
    }
  }, []);

  const switchToActiveCall = useCallback(() => {
    stopRingtones();
    setCallStatus("active");
    
    let seconds = 0;
    if (timerInterval.current) clearInterval(timerInterval.current);
    timerInterval.current = setInterval(() => {
      seconds++;
      const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
      const secs = (seconds % 60).toString().padStart(2, '0');
      setCallDuration(`${mins}:${secs}`);
    }, 1000);
  }, [stopRingtones]);

  useEffect(() => {
    if (!ws || !myId) return;

    const handleSignaling = async (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'call_rejected':
          stopRingtones();
          setAlertInfo({ 
            isOpen: true, 
            type: "error", 
            title: "Não foi possível completar a ligação", 
            message: `Terminal ${data.reason === 'busy' ? 'Ocupado' : 'Offline'}`
          });
          resetCallUI();
          break;

        case 'status_ok_proceed':
          setCallStatus("calling");
          updatePartner(data.target);
          if (callingAudio.current) callingAudio.current.play().catch(()=>{});
          
          if (callTimeout.current) clearTimeout(callTimeout.current);
          callTimeout.current = setTimeout(() => endCall('timeout'), CALL_TIMEOUT_MS);

          ws.send(JSON.stringify({ type: "call_request", target: data.target }));
          
          try {
            createPeerConnection();
            const offer = await peerConnection.current!.createOffer();
            await peerConnection.current!.setLocalDescription(offer);
            ws.send(JSON.stringify({ type: "offer", target: data.target, payload: offer }));
          } catch(e) {
            console.error("Erro ao criar a oferta da chamada", e);
            endCall('manual');
          }
          break;

        case 'incoming_call':
          updatePartner(data.caller);
          setCallStatus("incoming");
          if (ringtoneAudio.current) ringtoneAudio.current.play().catch(()=>{});
          break;

        case 'call_ended':
          stopRingtones();
          resetCallUI();
          break;

        case 'offer':
          if (!partnerRef.current) updatePartner(data.sender);
          createPeerConnection();
          await peerConnection.current!.setRemoteDescription(data.payload);
          processIceQueue();
          break;

        case 'answer':
          if (callTimeout.current) clearTimeout(callTimeout.current);
          stopRingtones();
          await peerConnection.current!.setRemoteDescription(data.payload);
          switchToActiveCall();
          processIceQueue();
          break;

        case 'candidate':
          if (!peerConnection.current || !peerConnection.current.remoteDescription) {
            iceCandidateQueue.current.push(data.payload);
          } else {
            await peerConnection.current.addIceCandidate(data.payload).catch(e => console.error(e));
          }
          break;
      }
    };

    ws.addEventListener("message", handleSignaling);
    return () => ws.removeEventListener("message", handleSignaling);
  }, [ws, myId, endCall, resetCallUI, stopRingtones, updatePartner, createPeerConnection, processIceQueue, switchToActiveCall]);

  const initiateCall = async (targetId: string) => {
    if (!ws) return;
    try {
      // Pedimos o microfone no momento do clique para o celular autorizar!
      localStream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      ws.send(JSON.stringify({ type: "verify_status", target: targetId }));
    } catch (e) {
      console.error("Erro ao obter microfone:", e);
      setAlertInfo({ 
        isOpen: true, 
        type: "error", 
        title: "Erro de Permissão", 
        message: "Permissão de microfone necessária para ligar."
      });
      resetCallUI();
    }
  };

  const acceptCall = async () => {
    stopRingtones();
    if (callTimeout.current) clearTimeout(callTimeout.current);
    setCallStatus("active");
    
    try {
      localStream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (localStream.current) {
        localStream.current.getTracks().forEach(track => peerConnection.current?.addTrack(track, localStream.current!));
      }
      const answer = await peerConnection.current!.createAnswer();
      await peerConnection.current!.setLocalDescription(answer);
      // Usamos a referência rápida aqui também
      ws!.send(JSON.stringify({ type: "answer", target: partnerRef.current, payload: answer }));
      switchToActiveCall();
    } catch(e) {
      console.error(e);
      endCall('manual');
    }
  };

  const toggleMute = () => {
    if (localStream.current) {
      const audioTrack = localStream.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted;
        setIsMuted(!isMuted);
      }
    }
  };

  return {
    callStatus, callPartner, callDuration, isMuted, // MUDANÇA: remoteStream removido
    initiateCall, acceptCall, endCall, toggleMute, alertInfo, setAlertInfo
  };
}
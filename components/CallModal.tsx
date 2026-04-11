"use client";

import { CallStatus } from "@/hooks/useWebRTC";
import { Phone, PhoneOff, Mic, MicOff } from "lucide-react";

interface CallModalProps {
  status: CallStatus;
  partnerName: string | null; // MUDANÇA: Agora esperamos o Nome e não o ID
  duration: string;
  isMuted: boolean;
  onAccept: () => void;
  onEnd: () => void;
  onMuteToggle: () => void;
}

export default function CallModal({ status, partnerName, duration, isMuted, onAccept, onEnd, onMuteToggle }: CallModalProps) {
  if (status === "idle" || !partnerName) return null;

  const getAvatarColor = (name: string) => {
    const colors = ['bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-rose-500'];
    let sum = 0;
    for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
    return colors[sum % colors.length];
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col items-center py-10 px-6">
        
        {/* Título Baseado no Status */}
        <h2 className="text-gray-500 font-medium mb-8">
          {status === "calling" && "Chamando..."}
          {status === "incoming" && "Chamada de Voz Recebida"}
          {status === "active" && "Em Chamada"}
        </h2>

        {/* Avatar e Nome Real */}
        <div className={`w-28 h-28 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-lg mb-4 ${getAvatarColor(partnerName)}`}>
          {partnerName.charAt(0).toUpperCase()}
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">{partnerName}</h3>
        
        {/* Duração ou Status Animado */}
        {status === "active" ? (
          <div className="text-3xl font-mono text-gray-700 font-semibold my-4">{duration}</div>
        ) : (
          <div className="text-blue-500 font-medium animate-pulse my-4">
            {status === "calling" ? "Aguardando resposta..." : "Tocando..."}
          </div>
        )}

        {/* Controles da Chamada */}
        <div className="flex items-center gap-6 mt-8">
          {status === "active" && (
            <button 
              onClick={onMuteToggle}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${isMuted ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
            </button>
          )}

          {status === "incoming" && (
            <button 
              onClick={onAccept}
              className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center shadow-lg hover:scale-105 transition-all"
            >
              <Phone size={28} className="animate-bounce" />
            </button>
          )}

          <button 
            onClick={() => onEnd()}
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg hover:scale-105 transition-all"
          >
            <PhoneOff size={28} />
          </button>
        </div>

      </div>
    </div>
  );
}
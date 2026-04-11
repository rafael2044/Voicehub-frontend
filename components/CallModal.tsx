"use client";

import { CallStatus } from "@/hooks/useWebRTC";
import { Phone, PhoneOff, Mic, MicOff } from "lucide-react";

interface CallModalProps {
  status: CallStatus;
  partnerName: string | null;
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
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in transition-colors">
      <div className="bg-white dark:bg-slate-800 border border-transparent dark:border-slate-700 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col items-center py-10 px-6 transition-colors">
        
        {/* Título Baseado no Status */}
        <h2 className="text-gray-500 dark:text-slate-400 font-medium mb-8 transition-colors">
          {status === "calling" && "Chamando..."}
          {status === "incoming" && "Chamada de Voz Recebida"}
          {status === "active" && "Em Chamada"}
        </h2>

        {/* Avatar e Nome Real */}
        <div className={`w-28 h-28 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-lg mb-4 ${getAvatarColor(partnerName)}`}>
          {partnerName.charAt(0).toUpperCase()}
        </div>
        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2 transition-colors text-center">{partnerName}</h3>
        
        {/* Duração ou Status Animado */}
        {status === "active" ? (
          <div className="text-3xl font-mono text-gray-700 dark:text-slate-200 font-semibold my-4 transition-colors">{duration}</div>
        ) : (
          <div className="text-blue-500 dark:text-blue-400 font-medium animate-pulse my-4 transition-colors">
            {status === "calling" ? "Aguardando resposta..." : "Tocando..."}
          </div>
        )}

        {/* Controles da Chamada */}
        <div className="flex items-center gap-6 mt-8">
          {status === "active" && (
            <button 
              onClick={onMuteToggle}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-sm ${
                isMuted 
                  ? 'bg-gray-800 dark:bg-slate-900 text-white dark:text-slate-300' 
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
              title={isMuted ? "Ativar Microfone" : "Silenciar Microfone"}
            >
              {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
            </button>
          )}

          {status === "incoming" && (
            <button 
              onClick={onAccept}
              className="w-16 h-16 rounded-full bg-green-500 dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-500 text-white flex items-center justify-center shadow-lg hover:scale-105 transition-all"
              title="Atender Chamada"
            >
              <Phone size={28} className="animate-bounce" />
            </button>
          )}

          <button 
            onClick={() => onEnd()}
            className="w-16 h-16 rounded-full bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-500 text-white flex items-center justify-center shadow-lg hover:scale-105 transition-all"
            title="Encerrar/Recusar"
          >
            <PhoneOff size={28} />
          </button>
        </div>

      </div>
    </div>
  );
}
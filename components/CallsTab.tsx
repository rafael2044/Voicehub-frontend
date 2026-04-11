"use client";

import { useState, useEffect } from "react";
import { api } from "@/services/api";
import { 
  PhoneIncoming, 
  PhoneOutgoing, 
  PhoneMissed, 
  Clock, 
  Calendar, 
  Phone,
  SearchX
} from "lucide-react";

export interface CallRecord {
  id: number;
  caller_id: number;
  callee_id: number;
  start_time: string;
  end_time: string;
  duration: string;
  status: string;
  caller_name: string;
  callee_name: string;
}

interface CallsTabProps {
  currentUserId: string;
  onStartCall: (id: string) => void;
}

export default function CallsTab({ currentUserId, onStartCall }: CallsTabProps) {
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCalls = async () => {
      try {
        const response = await api.get(`/api/calls/${currentUserId}`);
        setCalls(response.data);
      } catch (error) {
        console.error("Erro ao buscar histórico de chamadas:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCalls();
  }, [currentUserId]);

  // Função auxiliar para gerar cores baseadas no ID (como fazemos no Chat)
  const getAvatarColor = (idStr: string) => {
    const colors = ['bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-rose-500'];
    let sum = 0;
    for (let i = 0; i < idStr.length; i++) sum += idStr.charCodeAt(i);
    return colors[sum % colors.length];
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="animate-pulse flex flex-col items-center">
          <Clock size={32} className="mb-2 text-blue-400 opacity-50" />
          <p>Carregando histórico...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      
      {/* Cabeçalho */}
      <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
        <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-800">
          <Clock className="text-blue-500" size={24} />
          Histórico de Chamadas
        </h2>
      </div>

      {/* Lista de Chamadas */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {calls.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <SearchX size={48} className="mb-4 opacity-30" />
            <p>Nenhuma chamada registrada ainda.</p>
          </div>
        ) : (
          <div className="space-y-3 max-w-4xl mx-auto">
            {calls.map((call) => {
              // Lógica para definir os papéis na chamada
              const isOutgoing = String(call.caller_id) === String(currentUserId);
              const partnerName = String(isOutgoing ? call.callee_name : call.caller_name);
              const isMissed = call.status === "missed";

              // Configuração visual do ícone
              let CallIcon = PhoneIncoming;
              let iconColor = "text-green-500";
              let statusText = "Recebida";

              if (isMissed) {
                CallIcon = PhoneMissed;
                iconColor = "text-red-500";
                statusText = isOutgoing ? "Não Atendida" : "Perdida";
              } else if (isOutgoing) {
                CallIcon = PhoneOutgoing;
                iconColor = "text-blue-500";
                statusText = "Efetuada";
              }

              const startDate = new Date(call.start_time);

              return (
                <div key={call.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-blue-100 hover:bg-blue-50/30 transition-colors bg-white shadow-sm">
                  
                  {/* Info Principal */}
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shrink-0 shadow-sm ${getAvatarColor(partnerName)}`}>
                      {partnerName.charAt(0).toUpperCase()}
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-gray-800 text-lg">{partnerName}</h3>
                      <div className="flex items-center gap-3 text-sm mt-0.5">
                        <span className={`flex items-center gap-1 font-medium ${iconColor}`}>
                          <CallIcon size={14} />
                          {statusText}
                        </span>
                        <span className="text-gray-400 flex items-center gap-1">
                          <Calendar size={12} />
                          {startDate.toLocaleDateString('pt-BR')} às {startDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Duração e Ações */}
                  <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-semibold text-gray-700">{isMissed ? '--:--' : call.duration}</p>
                      <p className="text-xs text-gray-400">Duração</p>
                    </div>
                    
                    {/* Botão de Retornar Ligação */}
                    <button 
                      onClick={() => onStartCall(partnerName)}
                      className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-green-100 hover:text-green-600 transition-colors shadow-sm"
                      title="Ligar novamente"
                    >
                      <Phone size={18} />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
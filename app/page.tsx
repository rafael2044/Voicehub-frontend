"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useVoiceHub } from "@/hooks/useVoiceHub";
import { useWebRTC } from "@/hooks/useWebRTC";
// MUDANÇA: Adicionado Moon e Sun nos ícones
import { MessageSquare, PhoneCall, Megaphone, LogOut, Maximize, Users, ChevronLeft, ChevronRight, Menu, X as XIcon, Moon, Sun } from "lucide-react";
import MuralTab from "@/components/MuralTab";
import ChatTab from "@/components/ChatTab";
import CallModal from "@/components/CallModal";
import CallsTab from "@/components/CallsTab";
import UsersTab from "@/components/UsersTab";
import AlertModal from "@/components/AlertModal";
import ConfirmModal from "@/components/ConfirmModal";

export default function VoiceHubApp() {
  const router = useRouter();
  const { 
    currentUser, 
    ws, isConnecting, logout, onlineUsers, unreadMessages, clearUnread 
  } = useVoiceHub();
  
  const [activeTab, setActiveTab] = useState<"chat" | "calls" | "mural" | "users">("mural");
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // NOVO: Estado e Lógica do Modo Escuro
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Ao carregar, verifica se o usuário já tinha escolhido Dark Mode antes
    const savedTheme = localStorage.getItem('voicehub_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('voicehub_theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('voicehub_theme', 'dark');
      setIsDarkMode(true);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth >= 768) {
      setIsSidebarOpen(true);
    }
  }, []);
  
  const myIdString = currentUser ? String(currentUser.id) : null;
  
  const { 
    callStatus, callPartner, callDuration, isMuted, 
    initiateCall, acceptCall, endCall, toggleMute,
    alertInfo, setAlertInfo
  } = useWebRTC(myIdString, ws);

  useEffect(() => {
    if (!currentUser && !isConnecting) {
      router.push("/login");
    }
  }, [currentUser, isConnecting, router]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.log(err));
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (isConnecting || !currentUser) {
    // Tela de carregamento agora com suporte a dark mode
    return <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center text-blue-600 dark:text-blue-400 font-medium transition-colors">Carregando VoiceHub...</div>;
  }

  const activeCallUser = onlineUsers.find(u => String(u.id) === String(callPartner));
  const partnerDisplayName = activeCallUser ? activeCallUser.name : callPartner;
  
  return (
    // Fundo Principal: Adicionado dark:bg-slate-900
    <div className="min-h-screen bg-gray-100 dark:bg-slate-900 flex flex-col md:flex-row h-screen overflow-hidden relative transition-colors duration-200">
      <audio id="remoteAudio" autoPlay playsInline className="hidden" />
      <CallModal 
        status={callStatus} partnerName={partnerDisplayName} duration={callDuration} isMuted={isMuted} onAccept={acceptCall} onEnd={endCall} onMuteToggle={toggleMute}
      />

      {/* BARRA LATERAL */}
      <aside className={`bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 flex flex-col transition-all duration-300 ease-in-out shrink-0 shadow-sm md:shadow-none
        ${isSidebarOpen
          ? 'absolute z-50 inset-0 w-full h-full md:relative md:w-64 md:h-screen md:border-r md:z-10' 
          : 'relative z-10 w-full h-auto border-b md:w-20 md:h-screen md:border-b-0 md:border-r'     
        }
      `}>
        
        {/* CABEÇALHO */}
        <div className={`flex items-center border-b border-gray-100 dark:border-slate-700 transition-all bg-white dark:bg-slate-800 ${
          isSidebarOpen ? 'h-16 justify-between px-4' : 'h-16 justify-between px-4 md:justify-center md:flex-col md:py-2 md:gap-2 md:h-auto'
        }`}>
          <div className="flex items-center gap-2 overflow-hidden">
            <div className={`shrink-0 flex items-center justify-center drop-shadow-sm ${isSidebarOpen ? 'w-10 h-10' : 'w-10 h-10 md:w-8 md:h-8 md:mb-1'}`}>
              <img src="/images/icon.png" alt="Logo VoiceHub" className="w-full h-full object-contain" />
            </div>
            <span className={`font-bold text-gray-800 dark:text-white text-lg whitespace-nowrap ${isSidebarOpen ? 'block' : 'block md:hidden'}`}>
              VoiceHub
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            {/* BOTÃO DE TEMA (LUA/SOL) */}
            <button onClick={toggleTheme} className={`p-1.5 text-gray-400 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors ${isSidebarOpen ? 'block' : 'block md:hidden'}`} title="Alternar Tema">
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button onClick={toggleFullscreen} className={`p-1.5 text-gray-400 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors ${isSidebarOpen ? 'block' : 'block md:hidden'}`} title="Tela Cheia">
              <Maximize size={18} />
            </button>
            
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1.5 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors bg-gray-50 dark:bg-transparent md:bg-transparent" title={isSidebarOpen ? "Recolher Menu" : "Expandir Menu"}>
              <div className="md:hidden flex items-center justify-center">{isSidebarOpen ? <XIcon size={24} /> : <Menu size={24} />}</div>
              <div className="hidden md:flex items-center justify-center">{isSidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}</div>
            </button>
          </div>
        </div>

        {/* PERFIL */}
        <div className={`p-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50 transition-all ${isSidebarOpen ? 'flex items-center justify-between' : 'hidden md:flex md:flex-col md:items-center md:gap-3'}`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-sm shrink-0 cursor-help" title={currentUser.name}>
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div className={`truncate ${isSidebarOpen ? 'block' : 'block md:hidden'}`}>
              <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 truncate">{currentUser.name}</p>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span className="text-xs text-gray-500 dark:text-slate-400">Online</span>
              </div>
            </div>
          </div>
          <button onClick={() => setIsLogoutModalOpen(true)} className="p-2 text-gray-400 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors shrink-0" title="Sair">
            <LogOut size={18} />
          </button>
        </div>

        {/* NAVEGAÇÃO DE ABAS */}
        <nav className={`flex-1 overflow-y-auto overflow-x-hidden transition-all bg-white dark:bg-slate-800 ${isSidebarOpen ? 'flex flex-col p-4 space-y-2 md:p-3' : 'flex flex-row justify-around p-2 md:flex-col md:justify-start md:p-3 md:space-y-2'}`}>
          <button
            onClick={() => { setActiveTab("chat"); if (window.innerWidth < 768) setIsSidebarOpen(false); }} title={!isSidebarOpen ? "Conversas" : ""}
            className={`transition-all rounded-lg font-medium flex items-center ${isSidebarOpen ? 'w-full flex-row gap-3 px-3 py-3 md:py-2.5' : 'flex-1 justify-center py-2.5 px-1 mx-1 md:w-full md:flex-none md:py-3 md:mx-0'} ${activeTab === "chat" ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-slate-200'}`}
          >
            <MessageSquare size={20} className="shrink-0" />
            <span className={`whitespace-nowrap ${isSidebarOpen ? 'block' : 'hidden'}`}>Conversas</span>
          </button>
          
          <button
            onClick={() => { setActiveTab("calls"); if (window.innerWidth < 768) setIsSidebarOpen(false); }} title={!isSidebarOpen ? "Chamadas" : ""}
            className={`transition-all rounded-lg font-medium flex items-center ${isSidebarOpen ? 'w-full flex-row gap-3 px-3 py-3 md:py-2.5' : 'flex-1 justify-center py-2.5 px-1 mx-1 md:w-full md:flex-none md:py-3 md:mx-0'} ${activeTab === "calls" ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-slate-200'}`}
          >
            <PhoneCall size={20} className="shrink-0" />
            <span className={`whitespace-nowrap ${isSidebarOpen ? 'block' : 'hidden'}`}>Chamadas</span>
          </button>

          <button
            onClick={() => { setActiveTab("mural"); if (window.innerWidth < 768) setIsSidebarOpen(false); }} title={!isSidebarOpen ? "Mural de Avisos" : ""}
            className={`transition-all rounded-lg font-medium flex items-center ${isSidebarOpen ? 'w-full flex-row gap-3 px-3 py-3 md:py-2.5' : 'flex-1 justify-center py-2.5 px-1 mx-1 md:w-full md:flex-none md:py-3 md:mx-0'} ${activeTab === "mural" ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-slate-200'}`}
          >
            <Megaphone size={20} className="shrink-0" />
            <span className={`whitespace-nowrap ${isSidebarOpen ? 'block' : 'hidden'}`}>Mural de Avisos</span>
          </button>
          
          {currentUser.role === "user_admin" && (
            <button
              onClick={() => { setActiveTab("users"); if (window.innerWidth < 768) setIsSidebarOpen(false); }} title={!isSidebarOpen ? "Usuários" : ""}
              className={`transition-all rounded-lg font-medium flex items-center ${isSidebarOpen ? 'w-full flex-row gap-3 px-3 py-3 md:py-2.5' : 'flex-1 justify-center py-2.5 px-1 mx-1 md:w-full md:flex-none md:py-3 md:mx-0'} ${activeTab === "users" ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-slate-200'}`}
            >
              <Users size={20} className="shrink-0" />
              <span className={`whitespace-nowrap ${isSidebarOpen ? 'block' : 'hidden'}`}>Usuários</span>
            </button>
          )}
        </nav>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 bg-gray-100 dark:bg-slate-900 p-2 md:p-4 overflow-hidden flex flex-col relative z-0 transition-colors">
        {activeTab === "mural" && <MuralTab currentUser={currentUser} />}
        {activeTab === "chat" && myIdString && <ChatTab myId={myIdString} ws={ws} onlineUsers={onlineUsers} unreadMessages={unreadMessages} clearUnread={clearUnread} onStartCall={initiateCall} />}
        {activeTab === "calls" && myIdString && <CallsTab currentUserId={myIdString} onStartCall={initiateCall} />}
        {activeTab === "users" && currentUser.role === "user_admin" && <UsersTab />}
      </main>
      
      <AlertModal isOpen={alertInfo.isOpen} type={alertInfo.type} title={alertInfo.title} message={alertInfo.message} onClose={() => setAlertInfo({ ...alertInfo, isOpen: false })} />
      <ConfirmModal isOpen={isLogoutModalOpen} title="Deseja mesmo sair?" message="Sua sessão será encerrada e você precisará fazer login novamente." onCancel={() => setIsLogoutModalOpen(false)} onConfirm={handleLogout} />
    </div>
  );
}
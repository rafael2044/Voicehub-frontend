// src/app/page.tsx
"use client";

import Cookies from "js-cookie";
import { useState } from "react";
import { useVoiceHub } from "@/hooks/useVoiceHub";
import { useWebRTC } from "@/hooks/useWebRTC";
import { MessageSquare, PhoneCall, Megaphone, LogOut, Maximize, Activity, Users } from "lucide-react";
import MuralTab from "@/components/MuralTab";
import ChatTab from "@/components/ChatTab";
import CallModal from "@/components/CallModal";
import CallsTab from "@/components/CallsTab";
import UsersTab from "@/components/UsersTab";
import AlertModal from "@/components/AlertModal";
import ConfirmModal from "@/components/ConfirmModal";
import { api } from "@/services/api"; 

export default function voiceHubApp() {
  const { 
    currentUser, setCurrentUser, setToken, 
    ws, isConnecting, logout, onlineUsers, unreadMessages, clearUnread 
  } = useVoiceHub();
  
  const [activeTab, setActiveTab] = useState<"chat" | "calls" | "mural" | "users">("mural");
  
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "", role: "user_default" });
  const [authError, setAuthError] = useState("");
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const myIdString = currentUser ? String(currentUser.id) : null;
  const { 
    callStatus, callPartner, callDuration, isMuted, 
    initiateCall, acceptCall, endCall, toggleMute,
    alertInfo, setAlertInfo
  } = useWebRTC(myIdString, ws);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.log(err));
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  // Função para lidar com Login e Cadastro
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    
    try {
      const formData = new URLSearchParams();
      formData.append("username", authForm.email);
      formData.append("password", authForm.password);
      // Por garantia, enviamos o grant_type que o OAuth2 gosta
      formData.append("grant_type", "password"); 
      
      // MUDANÇA AQUI: Forçamos o cabeçalho correto ignorando o padrão do api.ts
      const res = await api.post("/login", formData, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });
      
      const userObj = { 
        id: res.data.user_id, 
        name: res.data.name, 
        email: authForm.email, 
        role: res.data.role || "user_default",
        is_active: res.data.is_active
      };
      
      Cookies.set("voicehub_access_token", res.data.access_token, { expires: 1 }); // 1 dia
      Cookies.set("voicehub_refresh_token", res.data.refresh_token, { expires: 7 }); // 7 dias
      Cookies.set("voicehub_user", JSON.stringify(userObj), { expires: 7 });
      
      setToken(res.data.access_token);
      setCurrentUser(userObj);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      // MUDANÇA: Tratar o erro no Modal!
      let errorMsg = "Erro na autenticação. Verifique os dados.";
      if (typeof detail === "string") errorMsg = detail;
      
      setAlertInfo({ isOpen: true, type: "error", title: "Ops!", message: errorMsg });
    }
  };

  // --- TELA DE LOGIN / CADASTRO ---
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          
          <div className="p-8 text-center">
            <div className="flex flex-col items-center mb-8">
              <div className="w-32 h-24 mb-4 flex items-center justify-center drop-shadow-sm">
                <img 
                  src="/images/logo.png" 
                  alt="Logo VoiceHub" 
                  className="w-full h-full object-contain" 
                />
              </div>
              <p className="text-gray-500 text-sm">Faça login para acessar sua conta</p>
            </div>
            
            <form onSubmit={handleAuth} className="flex flex-col gap-4 text-left">
            
              <input required type="email" placeholder="E-mail" className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none" value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} />
              <input required type="password" placeholder="Senha" className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none" value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} />

              {authError && <p className="text-red-500 text-sm text-center font-medium">{authError}</p>}
              
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all mt-2 shadow-md">
                Entrar no Sistema
              </button>
            </form>
          </div>
        </div>
        <AlertModal 
          isOpen={alertInfo.isOpen} 
          type={alertInfo.type} 
          title={alertInfo.title} 
          message={alertInfo.message} 
          onClose={() => setAlertInfo({ ...alertInfo, isOpen: false })} 
        />
      </div>
    );
  }

  // --- TELA DE CARREGAMENTO INICIAL ---
  if (isConnecting) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-blue-600 font-medium">Conectando ao servidor...</div>;
  }

  // --- DASHBOARD PRINCIPAL ---
  const activeCallUser = onlineUsers.find(u => String(u.id) === String(callPartner));
  const partnerDisplayName = activeCallUser ? activeCallUser.name : callPartner;
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row h-screen overflow-hidden">
      <audio id="remoteAudio" autoPlay playsInline className="hidden" />
      <CallModal 
        status={callStatus}
        partnerName={partnerDisplayName}
        duration={callDuration}
        isMuted={isMuted}
        onAccept={acceptCall}
        onEnd={endCall}
        onMuteToggle={toggleMute}
      />

      {/* BARRA LATERAL (Sidebar) */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 flex flex-col z-10">
        {/* Cabeçalho da Sidebar */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-16 h-16 mb-4 flex items-center justify-center drop-shadow-sm">
              <img 
                src="/images/icon.png" 
                alt="Logo VoiceHub" 
                className="w-full h-full object-contain" 
              />
            </div>
            <span className="font-bold text-gray-800 text-lg">VoiceHub</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleFullscreen} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-md transition-colors" title="Tela Cheia">
              <Maximize size={18} />
            </button>
          </div>
        </div>

        {/* Perfil do Usuário Logado */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-sm shrink-0">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="truncate">
                <p className="text-sm font-semibold text-gray-800 truncate">{currentUser.name}</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  <span className="text-xs text-gray-500">Online</span>
                </div>
              </div>
            </div>
            <button onClick={() => setIsLogoutModalOpen(true)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Sair">
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Navegação de Abas */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <button
            onClick={() => setActiveTab("chat")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
              activeTab === "chat" ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <MessageSquare size={20} />
            Conversas
          </button>
          
          <button
            onClick={() => setActiveTab("calls")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
              activeTab === "calls" ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <PhoneCall size={20} />
            Chamadas
          </button>

          <button
            onClick={() => setActiveTab("mural")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
              activeTab === "mural" ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Megaphone size={20} />
            Mural de Avisos
          </button>
          {currentUser.role === "user_admin" && (
            <button
              onClick={() => setActiveTab("users")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "users" ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
            >
              <Users size={20} />
              <span className="font-medium">Usuários</span>
            </button>
          )}
        </nav>
      </aside>

      {/* ÁREA PRINCIPAL (Onde o conteúdo das abas é renderizado) */}
      <main className="flex-1 bg-gray-100 p-2 md:p-4 overflow-hidden flex flex-col">
        {/* Passamos o objeto completo do usuário para o Mural gerenciar permissões (Role) */}
        {activeTab === "mural" && <MuralTab currentUser={currentUser} />}
        
        {activeTab === "chat" && myIdString && (
          <ChatTab 
            myId={myIdString} 
            ws={ws} 
            onlineUsers={onlineUsers} 
            unreadMessages={unreadMessages} 
            clearUnread={clearUnread}
            onStartCall={initiateCall}
          />
        )}
        
        {activeTab === "calls" && myIdString && (
          <CallsTab 
            currentUserId={myIdString} 
            onStartCall={initiateCall} 
          />
        )}

        {activeTab === "users" && currentUser.role === "user_admin" && <UsersTab />}
      </main>
      <AlertModal 
        isOpen={alertInfo.isOpen} 
        type={alertInfo.type} 
        title={alertInfo.title} 
        message={alertInfo.message} 
        onClose={() => setAlertInfo({ ...alertInfo, isOpen: false })} 
      />

      <ConfirmModal 
        isOpen={isLogoutModalOpen}
        title="Deseja mesmo sair?"
        message="Sua sessão será encerrada e você precisará fazer login novamente."
        onCancel={() => setIsLogoutModalOpen(false)}
        onConfirm={logout}
      />
    </div>
  );
}
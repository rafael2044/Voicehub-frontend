"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ChatMessage, UserStatus } from "@/types";
import { api } from "@/services/api";
import AlertModal from "@/components/AlertModal";
import { Send, ArrowLeft, Phone, UserCircle, Paperclip, FileText, Download, Loader2, MessageSquarePlus, X } from "lucide-react";

// 1. Função de cores (mantida)
const getAvatarColor = (name: string) => {
  const colors = ['bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-rose-500'];
  let sum = 0;
  const safeName = name || "User";
  for (let i = 0; i < safeName.length; i++) sum += safeName.charCodeAt(i);
  return colors[sum % colors.length];
};

// 2. Componente de Imagem (Atualizado com Dark Mode no Loading)
const SecureImage = ({ path }: { path: string }) => {
  const [imgUrl, setImgUrl] = useState<string | null>(null);

  useEffect(() => {
    api.get(path, { responseType: 'blob' })
      .then((response) => {
        const objectUrl = URL.createObjectURL(response.data);
        setImgUrl(objectUrl);
      })
      .catch((err) => console.error("Erro ao carregar imagem:", err));
  }, [path]);

  if (!imgUrl) return <div className="w-48 h-32 bg-black/10 dark:bg-white/5 animate-pulse rounded-lg flex items-center justify-center text-sm text-gray-500 dark:text-slate-400 transition-colors">Carregando...</div>;

  return (
    <div className="max-w-sm">
      <img src={imgUrl} alt="Imagem enviada" className="rounded-lg object-cover max-h-64 w-auto cursor-pointer hover:opacity-90 transition-opacity shadow-sm" onClick={() => window.open(imgUrl, '_blank')} />
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
interface ChatTabProps {
  myId: string;
  ws: WebSocket | null;
  onlineUsers: UserStatus[];
  unreadMessages: Record<string, boolean>;
  clearUnread: (userId: string) => void;
  onStartCall: (id: string) => void;
}

export default function ChatTab({ myId, ws, onlineUsers, unreadMessages, clearUnread, onStartCall }: ChatTabProps) {
  const [selectedUser, setSelectedUser] = useState<UserStatus | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [recentChats, setRecentChats] = useState<any[]>([]);
  const [showNewChatList, setShowNewChatList] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [alertInfo, setAlertInfo] = useState<{isOpen: boolean, type: "success" | "error", title: string, message: string}>({ 
    isOpen: false, type: "success", title: "", message: "" 
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    api.get("/api/chats/recent")
      .then((response) => setRecentChats(response.data))
      .catch((err) => console.error("Erro ao buscar conversas recentes:", err));
  }, []);

  useEffect(() => {
    if (selectedUser) {
      clearUnread(String(selectedUser.id));
      api.get(`/api/messages/${myId}/${selectedUser.id}`)
        .then((response) => {
          setMessages(response.data);
          setTimeout(scrollToBottom, 100);
        })
        .catch((err) => console.error("Erro ao buscar histórico:", err));
    }
  }, [selectedUser, myId, clearUnread]);

  const updateRecentChatsLocally = useCallback((partnerId: string, providedName: string, text: string) => {
    setRecentChats(prev => {
      const existingChat = prev.find(c => String(c.id) === String(partnerId));
      const filtered = prev.filter(c => String(c.id) !== String(partnerId));
      
      const resolvedName = (providedName === String(partnerId) && existingChat?.name) 
        ? existingChat.name 
        : providedName;

      return [{ id: partnerId, name: resolvedName, last_message: text }, ...filtered];
    });
  }, []);

  useEffect(() => {
    if (!ws) return;

    const handleWsMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      
      if (data.type === "private_chat") {
        const isCurrentChat = selectedUser && String(data.sender) === String(selectedUser.id);
        
        if (isCurrentChat) {
          const incomingMsg: ChatMessage = { sender_id: Number(data.sender), recipient_id: Number(myId), content: data.content, msg_type: data.msg_type || "text", timestamp: new Date().toISOString() };
          setMessages((prev) => [...prev, incomingMsg]);
          clearUnread(String(data.sender)); 
          setTimeout(scrollToBottom, 100);
        }
        
        const senderInfo = onlineUsers.find(u => String(u.id) === String(data.sender));
        const senderName = senderInfo?.name || data.sender;
        const previewText = data.msg_type === "image" ? "📷 Imagem" : data.msg_type === "document" ? "📎 Documento" : data.content;
        updateRecentChatsLocally(data.sender, senderName, previewText);
      }
      
      if (data.type === "private_chat_sent") {
        const isCurrentChat = selectedUser && String(data.recipient) === String(selectedUser.id);
        
        if (isCurrentChat) {
          const outgoingMsg: ChatMessage = { sender_id: Number(myId), recipient_id: Number(data.recipient), content: data.content, msg_type: data.msg_type || "text", timestamp: new Date().toISOString() };
          setMessages((prev) => [...prev, outgoingMsg]);
          setTimeout(scrollToBottom, 100);
        }

        const recipientInfo = onlineUsers.find(u => String(u.id) === String(data.recipient));
        const recipientName = recipientInfo?.name || data.recipient;
        const previewText = data.msg_type === "image" ? "📷 Imagem" : data.msg_type === "document" ? "📎 Documento" : data.content;
        updateRecentChatsLocally(data.recipient, recipientName, previewText);
      }
    };

    ws.addEventListener("message", handleWsMessage);
    return () => ws.removeEventListener("message", handleWsMessage);
  }, [ws, selectedUser, clearUnread, myId, onlineUsers, updateRecentChatsLocally]);

  const handleSendMessage = () => {
    if (!inputText.trim() || !selectedUser || !ws) return;

    ws.send(JSON.stringify({
      type: "private_chat",
      target: String(selectedUser.id),
      content: inputText.trim(),
      msg_type: "text"
    }));
    
    setInputText("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedUser || !ws) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      const fileUrl = response.data.url;
      const isImage = file.type.startsWith("image/");
      const msgType = isImage ? "image" : "document";

      ws.send(JSON.stringify({
        type: "private_chat",
        target: String(selectedUser.id),
        content: fileUrl,
        msg_type: msgType
      }));

    } catch (error) {
      console.error("Erro no upload:", error);
      setAlertInfo({ 
        isOpen: true, 
        type: "error", 
        title: "Erro no Envio", 
        message: "Não foi possível enviar o arquivo. Verifique sua conexão ou tente novamente." 
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = ""; 
    }
  };

  return (
    <div className="flex h-full bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden relative transition-colors">
      
      {/* BARRA LATERAL (Esquerda) */}
      <div className={`w-full md:w-80 border-r border-gray-100 dark:border-slate-700 flex flex-col bg-gray-50/30 dark:bg-slate-800/30 transition-colors ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
        
        <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-between items-center transition-colors">
          <h2 className="font-semibold text-gray-800 dark:text-slate-100">
            {showNewChatList ? "Contatos Online" : "Conversas"}
          </h2>
          <button 
            onClick={() => setShowNewChatList(!showNewChatList)}
            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-full transition-colors"
            title={showNewChatList ? "Voltar para Conversas" : "Nova Conversa"}
          >
            {showNewChatList ? <X size={20} /> : <MessageSquarePlus size={20} />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {showNewChatList ? (
            onlineUsers.filter(u => String(u.id) !== String(myId)).length === 0 ? (
              <p className="text-center text-sm text-gray-400 dark:text-slate-500 mt-10">Ninguém online no momento.</p>
            ) : (
              onlineUsers.filter(u => String(u.id) !== String(myId)).map((user) => {
                const displayName = user.name || String(user.id);
                return (
                  <button
                    key={user.id}
                    onClick={() => {
                      setSelectedUser(user);
                      setShowNewChatList(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left hover:bg-gray-100 dark:hover:bg-slate-700/50"
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shrink-0 relative ${getAvatarColor(displayName)}`}>
                      {displayName.charAt(0).toUpperCase()}
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-800 bg-green-500 transition-colors"></span>
                    </div>
                    <div className="flex-1 truncate">
                      <span className="font-medium text-gray-800 dark:text-slate-200">{displayName}</span>
                      <p className="text-xs text-green-500 dark:text-green-400">Online agora</p>
                    </div>
                  </button>
                );
              })
            )
          ) : (
            recentChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center mt-12 px-4 text-center">
                <div className="w-16 h-16 bg-blue-50 dark:bg-slate-800 text-blue-500 dark:text-blue-400 rounded-full flex items-center justify-center mb-4 transition-colors">
                  <MessageSquarePlus size={28} />
                </div>
                <p className="text-gray-500 dark:text-slate-400 text-sm mb-4">Você ainda não tem conversas.</p>
                <button 
                  onClick={() => setShowNewChatList(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm"
                >
                  Iniciar Conversa
                </button>
              </div>
            ) : (
              recentChats.map((chat) => {
                const onlineStatus = onlineUsers.find(u => String(u.id) === String(chat.id));
                const isOnline = onlineStatus?.status === 'online';
                const displayName = chat.name || String(chat.id);

                return (
                  <button
                    key={chat.id}
                    onClick={() => setSelectedUser({ id: String(chat.id), name: displayName, status: isOnline ? 'online' : 'offline' })}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${selectedUser?.id === String(chat.id) ? 'bg-blue-50 dark:bg-slate-700' : 'hover:bg-gray-100 dark:hover:bg-slate-700/50'}`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shrink-0 relative ${getAvatarColor(displayName)}`}>
                      {displayName.charAt(0).toUpperCase()}
                      <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-800 transition-colors ${isOnline ? 'bg-green-500' : 'bg-gray-400 dark:bg-slate-500'}`}></span>
                    </div>
                    <div className="flex-1 truncate">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-gray-800 dark:text-slate-200 truncate">{displayName}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500 dark:text-slate-400 truncate max-w-[140px]">
                          {chat.last_message}
                        </span>
                        {unreadMessages[String(chat.id)] && (
                          <span className="w-2.5 h-2.5 bg-blue-500 rounded-full shrink-0"></span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )
          )}
        </div>
      </div>

      {/* ÁREA DE CHAT (Direita) */}
      <div className={`flex-1 flex flex-col bg-white dark:bg-slate-800 absolute md:relative inset-0 z-10 transition-colors ${!selectedUser ? 'hidden md:flex' : 'flex'}`}>
        {!selectedUser ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-slate-500 bg-gray-50/50 dark:bg-slate-900/50 transition-colors">
            <UserCircle size={64} className="mb-4 opacity-20" />
            <p>Selecione um contato para conversar</p>
          </div>
        ) : (
          <>
            {/* CABEÇALHO DO CHAT */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 transition-colors">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedUser(null)} className="md:hidden p-2 -ml-2 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                  <ArrowLeft size={20} />
                </button>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${getAvatarColor(selectedUser.name || String(selectedUser.id))}`}>
                  {(selectedUser.name || String(selectedUser.id)).charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-slate-100">{selectedUser.name || selectedUser.id}</h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400">{selectedUser.status === 'online' ? 'Disponível' : 'Offline'}</p>
                </div>
              </div>
              <button 
                className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors disabled:opacity-50"
                title="Chamada de Voz"
                disabled={selectedUser.status !== 'online'}
                onClick={() => onStartCall(String(selectedUser.id))}
              >
                <Phone size={18} />
              </button>
            </div>

            {/* ÁREA DE MENSAGENS */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30 dark:bg-slate-900/50 transition-colors">
              {messages.map((msg, idx) => {
                const isMine = String(msg.sender_id) === String(myId);
                const isSystem = msg.msg_type === "system";

                if (isSystem) {
                  return (
                    <div key={idx} className="flex justify-center my-4">
                      <span className="bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-300 text-xs py-1 px-3 rounded-full font-medium transition-colors">{msg.content}</span>
                    </div>
                  );
                }

                return (
                  <div key={idx} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[75%] px-4 py-2 rounded-2xl shadow-sm transition-colors ${isMine ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 rounded-bl-none'}`}>
                      {msg.msg_type === "image" ? (
                        <SecureImage path={msg.content} />
                      ) : msg.msg_type === "document" ? (
                        <a href={process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") + msg.content} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2 bg-black/10 dark:bg-white/5 rounded-lg hover:bg-black/20 dark:hover:bg-white/10 transition-colors">
                          <div className="bg-white dark:bg-slate-800 p-2 rounded text-blue-600 dark:text-blue-400 transition-colors"><FileText size={24} /></div>
                          <div className="flex-1 overflow-hidden">
                            <p className="font-medium text-sm truncate">Documento Anexado</p>
                            <p className="text-xs opacity-70">Clique para baixar</p>
                          </div>
                          <Download size={18} className="mx-2 opacity-70" />
                        </a>
                      ) : (
                        <span>{msg.content}</span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400 dark:text-slate-500 mt-1 mx-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* BARRA DE DIGITAÇÃO */}
            <div className="p-4 border-t border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 transition-colors">
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-700 rounded-full p-1 border border-gray-200 dark:border-slate-600 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" />
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  disabled={isUploading}
                  className="w-10 h-10 rounded-full text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-600 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-center transition-colors shrink-0 disabled:opacity-50"
                  title="Anexar arquivo ou imagem"
                >
                  {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Paperclip size={20} />}
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 bg-transparent px-2 py-2 outline-none text-gray-700 dark:text-slate-200"
                />
                
                <button
                  onClick={handleSendMessage}
                  disabled={!inputText.trim() || isUploading}
                  className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center disabled:opacity-50 hover:bg-blue-700 transition-colors shrink-0"
                >
                  <Send size={18} className="ml-1" />
                </button>
              </div>
            </div>
          </>
        )}
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
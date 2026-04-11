"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Cookies from "js-cookie";
import { UserStatus } from "@/types"; // Ajuste o caminho se necessário

export interface UserData {
  id: number;
  name: string;
  email: string;
  role: "user_default" | "user_admin";
  is_active: boolean;
}

export function useVoiceHub() {
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  
  const [onlineUsers, setOnlineUsers] = useState<UserStatus[]>([]);
  const [unreadMessages, setUnreadMessages] = useState<Record<string, boolean>>({});
  const messageSound = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    messageSound.current = new Audio("/sounds/message.mp3");
  }, []);

  // Verifica se já estava logado ao carregar a página
  useEffect(() => {
    const savedToken = Cookies.get("voicehub_access_token");
    const savedUser = Cookies.get("voicehub_user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setCurrentUser(JSON.parse(savedUser));
    } else {
      setIsConnecting(false);
    }
  }, []);

  // Conecta ao WebSocket APENAS se tivermos um token válido
  useEffect(() => {
    if (!token) {
      setIsConnecting(false);
      return;
    }

    setIsConnecting(true);
    let wsUrl = process.env.NEXT_PUBLIC_API_URL?.replace("http", "ws") + "/ws";
    const socket = new WebSocket(`${wsUrl}?token=${token}`);

    socket.onopen = () => {
      console.log("WebSocket conectado!");
      setIsConnecting(false);
    };

    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case "user_list":
          setOnlineUsers(data.users);
          break;
        case "private_chat":
          // Verifica a mensagem comparando IDs (Convertidos para string por segurança)
          if (currentUser && String(data.sender) !== String(currentUser.id)) {
            setUnreadMessages((prev) => ({ ...prev, [String(data.sender)]: true }));
            if (messageSound.current) {
              messageSound.current.currentTime = 0; 
              messageSound.current.play().catch((err) => console.log("Aguardando interação para tocar som"));
            }
          }
          break;
      }
    };

    socket.addEventListener("message", handleMessage);

    socket.onclose = () => {
      console.log("WebSocket desconectado.");
      setIsConnecting(false);
    };

    setWs(socket);

    return () => {
      socket.removeEventListener("message", handleMessage);
      socket.close();
    };
  }, [token, currentUser]);

  const logout = useCallback(() => {
    Cookies.remove("voicehub_access_token");
    Cookies.remove("voicehub_user");
    Cookies.remove("voicehub_refresh_token");
    setCurrentUser(null);
    setToken(null);
    if (ws) ws.close();
    window.location.reload();
  }, [ws]);

  // Aceita string ou number por causa do banco de dados
  const clearUnread = useCallback((userId: string | number) => {
    setUnreadMessages((prev) => {
      if (!prev[String(userId)]) return prev;
      return { ...prev, [String(userId)]: false };
    });
  }, []);

  // MUDANÇA PRINCIPAL: Exportamos o controle do usuário e token em vez da função login antiga
  return { 
    currentUser, 
    setCurrentUser, 
    token, 
    setToken, 
    ws, 
    onlineUsers, 
    unreadMessages, 
    isConnecting, 
    logout, 
    clearUnread 
  };
}
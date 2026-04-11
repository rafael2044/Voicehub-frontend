"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { api } from "@/services/api"; 
import AlertModal from "@/components/AlertModal";

export default function LoginPage() {
  const router = useRouter();
  const [authForm, setAuthForm] = useState({ email: "", password: "" });
  const [alertInfo, setAlertInfo] = useState<{isOpen: boolean, type: "success" | "error", title: string, message: string}>({ 
    isOpen: false, type: "success", title: "", message: "" 
  });

  useEffect(() => {
    const token = Cookies.get("voicehub_access_token");
    if (token) {
      router.push("/");
    }
  }, [router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new URLSearchParams();
      formData.append("username", authForm.email);
      formData.append("password", authForm.password);
      formData.append("grant_type", "password"); 
      
      const res = await api.post("/login", formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      
      const userObj = { 
        id: res.data.user_id, 
        name: res.data.name, 
        email: authForm.email, 
        role: res.data.role || "user_default",
        is_active: res.data.is_active
      };
      
      Cookies.set("voicehub_access_token", res.data.access_token, { expires: 1 }); 
      Cookies.set("voicehub_refresh_token", res.data.refresh_token, { expires: 7 }); 
      Cookies.set("voicehub_user", JSON.stringify(userObj), { expires: 7 });
      
      router.push("/");
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setAlertInfo({ 
        isOpen: true, 
        type: "error", 
        title: "Ops!", 
        message: typeof detail === "string" ? detail : "Erro na autenticação." 
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors duration-200">
      {/* Card de Login com suporte a Dark Mode */}
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-transparent dark:border-slate-700">
        <div className="p-8 text-center">
          <div className="flex flex-col items-center mb-8">
            <div className="w-32 h-24 mb-4 flex items-center justify-center drop-shadow-sm">
              <img src="/images/logo.png" alt="Logo VoiceHub" className="w-full h-full object-contain" />
            </div>
            <p className="text-gray-500 dark:text-slate-400 text-sm">Faça login para acessar sua conta</p>
          </div>
          
          <form onSubmit={handleAuth} className="flex flex-col gap-4 text-left">
            {/* Inputs com cores específicas para Dark Mode */}
            <input 
              required 
              type="email" 
              placeholder="E-mail" 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors" 
              value={authForm.email} 
              onChange={e => setAuthForm({...authForm, email: e.target.value})} 
            />
            <input 
              required 
              type="password" 
              placeholder="Senha" 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors" 
              value={authForm.password} 
              onChange={e => setAuthForm({...authForm, password: e.target.value})} 
            />

            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all mt-2 shadow-md active:scale-[0.98]">
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
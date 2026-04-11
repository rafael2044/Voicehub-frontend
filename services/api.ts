import axios from "axios";
import Cookies from "js-cookie";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true", 
  },
});

// Intercepta todas as requisições ANTES de saírem e injeta o token se ele existir
api.interceptors.request.use((config) => {
  const token = Cookies.get("voicehub_access_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // A MÁGICA ESTÁ AQUI: Ignora o interceptor se a requisição foi para login ou registro
    // (Ajuste a string '/login' se a sua rota no FastAPI tiver outro nome, ex: '/api/login')
    if (originalRequest.url?.includes('/login') || originalRequest.url?.includes('/register')) {
      return Promise.reject(error);
    }

    // Se o erro for 401 (Não autorizado) e ainda NÃO tentamos refazer a requisição...
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Marca que estamos tentando de novo para evitar loop
      
      const refreshToken = Cookies.get("voicehub_refresh_token");

      if (refreshToken) {
        try {
          // Tenta trocar o refresh velho por um access novo
          const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/refresh`, {
            refresh_token: refreshToken
          });
          
          const newAccessToken = res.data.access_token;
          
          // Salva o novo token
          Cookies.set("voicehub_access_token", newAccessToken, { expires: 1 });
          
          // Refaz a requisição original que tinha falhado, mas agora com o token novo!
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);

        } catch (refreshError) {
          // Se o REFRESH falhar (expirou os 7 dias), limpa tudo e joga pro login
          Cookies.remove("voicehub_access_token");
          Cookies.remove("voicehub_refresh_token");
          Cookies.remove("voicehub_user");
          window.location.href = "/";
          return Promise.reject(refreshError);
        }
      } else {
        // Se não tem nem refresh token, desloga
        Cookies.remove("voicehub_access_token");
        Cookies.remove("voicehub_user");
        window.location.href = "/";
      }
    }
    
    return Promise.reject(error);
  }
);
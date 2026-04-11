// src/services/muralService.ts
import { api } from "./api";
import { MuralData } from "@/types";

export const muralService = {
  getMural: async (): Promise<MuralData | null> => {
    const response = await api.get("/api/mural");
    return response.data;
  },

  updateMural: async (content: string): Promise<MuralData> => {
    // Note que adicionamos o parâmetro user_id na query string como sua API exige
    const response = await api.post(`/api/mural`, {
      content
    });
    return response.data;
  },
};
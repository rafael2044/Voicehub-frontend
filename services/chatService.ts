import { ChatMessage } from "@/types";
import { api } from "./api";

export const chatService = {
  getHistory: async (userId: string, targetId: string): Promise<ChatMessage[]> => {
    const response = await api.get(`/api/messages/${userId}/${targetId}`);
    return response.data;
  },
};
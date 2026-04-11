
export interface UserStatus {
  id: string;
  name: string;
  status: "online" | "busy" | "offline";
}

export interface MuralData {
  id: number;
  content: string;
  updated_by_id: number;
  timestamp: string;
  updater: {
    name: string;
  };
}

export interface ChatMessage {
  sender_id: number;
  recipient_id: number;
  content: string;
  msg_type: string;
  timestamp: string;
}
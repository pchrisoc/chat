export interface ChatResponse {
  response: string;
}

export interface ChatMessage {
  role: string; // 'user' or 'bot'
  content: string;
}
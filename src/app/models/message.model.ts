export interface Message {
  id: number;
  conversationId: number;
  text: string;
  username: string;
  timestamp: Date;
  avatarUrl: string;
}

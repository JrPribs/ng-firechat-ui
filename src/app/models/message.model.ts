export interface Message {
  id?: string;
  chatId?: string;
  text: string;
  username: string;
  timestamp: string;
  avatarUrl?: string;
}

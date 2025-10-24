import { Message } from './message.model';

export type ModelProvider = 'claude' | 'genkit-claude' | 'gpt-5';

export interface Chat {
  id?: string;
  username?: string;
  avatarUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
  messages?: Message[];
  lastMessage?: string;
  unread?: boolean;
  totalMessages?: number;
  modelProvider?: ModelProvider;
}

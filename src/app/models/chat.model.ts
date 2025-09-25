import { Message } from './message.model';

export interface Chat {
  id: string;
  username: string;
  avatarUrl: string;
  createdAt: Date;
  updatedAt: Date;
  messages: Message[];
}

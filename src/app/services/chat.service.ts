import { Injectable, signal } from '@angular/core';
import { Message } from '../models/message.model';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private readonly AI_AVATAR = 'https://picsum.photos/seed/ai/48/48';
  private readonly USER_AVATAR = 'https://picsum.photos/seed/user/48/48';

  private initialMessages: Message[] = [
    {
      id: 1,
      conversationId: 1,
      text: 'Hello! You can ask me anything about our products or services.',
      username: 'ai',
      timestamp: new Date(Date.now() - 60000 * 2),
      avatarUrl: this.AI_AVATAR,
    },
    {
      id: 2,
      conversationId: 1,
      text: 'I can also help you with Genkit, Firestore, or Angular.',
      username: 'ai',
      timestamp: new Date(Date.now() - 60000 * 1),
      avatarUrl: this.AI_AVATAR,
    },
  ];

  messages = signal<Message[]>(this.initialMessages);
  isLoading = signal(false);
  private messageCounter = this.initialMessages.length;


  newChat(username: string, name: string): void {
    const initialMessage: Message = {
      id: 1,
      conversationId: 1,
      username,
      text: `Thanks for the follow ${name.trim()} 👊🏽|||Are you here for the content or do you have questions about Chiro care?`,
      timestamp: new Date(),
      avatarUrl: this.AI_AVATAR,
    };
    this.messages.update(msgs => [...msgs, initialMessage]);
  }

  sendMessage(text: string): void {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: ++this.messageCounter,
      conversationId: 1,
      text,
      username: 'user',
      timestamp: new Date(),
      avatarUrl: this.USER_AVATAR,
    };
    this.messages.update(msgs => [...msgs, userMessage]);

    this.isLoading.set(true);

    // Simulate network latency and AI processing time
    setTimeout(() => {
      const aiResponseText = this.getAiResponse(text);
      const aiMessage: Message = {
        id: ++this.messageCounter,
        conversationId: 1,
        text: aiResponseText,
        username: 'ai',
        timestamp: new Date(),
        avatarUrl: this.AI_AVATAR,
      };
      this.messages.update(msgs => [...msgs, aiMessage]);
      this.isLoading.set(false);
    }, 1500 + Math.random() * 500);
  }

  private getAiResponse(userMessage: string): string {
    return 'Hello! You can ask me anything about our products or services.';
  }
}

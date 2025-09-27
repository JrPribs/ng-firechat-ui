import {
  inject, Injectable, signal
} from '@angular/core';
import { Message } from '../models/message.model';
import { ChatStore } from '../state/chat.store';
import {
  addDoc, collection, Firestore
} from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { Functions, httpsCallable } from '@angular/fire/functions';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private readonly store = inject(ChatStore);
  private readonly firestore = inject(Firestore);
  private readonly functions = inject(Functions);
  private readonly router = inject(Router);

  private readonly chatsRef = collection(this.firestore, 'chats');
  private readonly AI_AVATAR = 'https://picsum.photos/seed/Dr. Accordo/48/48';

  private initialMessages: Message[] = [];

  messages = signal<Message[]>(this.initialMessages);

  async newChat(username: string): Promise<void> {
    console.debug('newChat', username);
    const chatRef = await addDoc(this.chatsRef, {
      username,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    console.debug('chatRef', chatRef);

    const chatId = chatRef.id;
    const chatMessagesRef = collection(this.firestore, `chats/${chatId}/messages`);

    const initialMessage: Message = {
      chatId,
      username: 'Dr. Accordo',
      text: `Thanks for the follow ${username} 👊🏽`,
      timestamp: new Date().toISOString()
    };

    await addDoc(chatMessagesRef, initialMessage);

    const secondMessage: Message = {
      chatId,
      username: 'Dr. Accordo',
      text: 'Are you here for the content or do you have questions about Chiro care?',
      timestamp: new Date().toISOString()
    };

    await addDoc(chatMessagesRef, secondMessage);

    this.router.navigate([ `/chat/${chatId}` ]);
  }

  async sendMessage(text: string): Promise<void> {
    if (!text.trim()) return;

    const userMessage: Message = {
      chatId: this.store.activeChatId(),
      text,
      username: this.store.activeChatUsername() || '',
      timestamp: new Date().toISOString()
    };

    await addDoc(this.store.activeChatMessagesRef(), userMessage);

    await this.getAgentResponse(this.store.activeChatId()!);
  }

  private async getAgentResponse(chatId: string): Promise<void> {
    if (!chatId) return;

    this.store.setIsLoading(true);
    // const chatMessagesRef = collection(this.firestore, `chats/${chatId}/messages`);
    // const chatMessages = await getDocs(chatMessagesRef);
    // const chatMessagesData = chatMessages.docs.map(doc => doc.data());
    // const chatMessagesText = chatMessagesData.map(msg => msg['text']).join('\n');

    const agentFunction = httpsCallable(this.functions, 'getAgentResponse');
    const agentResponse = await agentFunction({ chatId });
    this.store.setIsLoading(false);
    console.debug('agentResponse', agentResponse);
    console.debug('agentResponse.data', agentResponse.data);
  }
}

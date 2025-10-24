import {
  inject, Injectable, signal
} from '@angular/core';
import { Message } from '../models/message.model';
import { ChatStore } from '../state/chat.store';
import {
  addDoc, collection, doc, Firestore, getDoc
} from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { ModelProvider } from '../models/chat.model';

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

  async newChat(username: string, modelProvider: ModelProvider = 'claude'): Promise<void> {
    console.debug('newChat', username, modelProvider);
    const chatRef = await addDoc(this.chatsRef, {
      username,
      modelProvider,
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

    // Get chat document to determine which model provider to use
    const chatDocRef = doc(this.firestore, 'chats', chatId);
    const chatDoc = await getDoc(chatDocRef);
    const chatData = chatDoc.data();
    const modelProvider = (chatData?.['modelProvider'] as ModelProvider) || 'claude';

    // Call the appropriate function based on model provider
    let functionName: string;
    switch (modelProvider) {
      case 'genkit-claude':
        functionName = 'getAgentResponseGenkit';
        break;
      case 'gpt-5':
        functionName = 'getGptAgentResponse';
        break;
      case 'claude':
      default:
        functionName = 'getAgentResponse';
        break;
    }

    const agentFunction = httpsCallable(this.functions, functionName);
    const agentResponse = await agentFunction({ chatId });
    this.store.setIsLoading(false);
    console.debug('agentResponse', agentResponse);
    console.debug('agentResponse.data', agentResponse.data);
  }
}

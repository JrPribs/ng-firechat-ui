import {
  patchState, signalStore, withHooks, withState
} from '@ngrx/signals';
import { Chat } from '../models/chat.model';
import {
  computed, inject, Injectable
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  collection, collectionData, DocumentData, Firestore, getDocs
} from '@angular/fire/firestore';
import { Message } from '../models/message.model';
import { map, Subscription, tap } from 'rxjs';

interface ChatState {
  chats: Chat[];
  isLoading: boolean;
  activeChat: Chat | null;
  messages: Message[];
}

const initialState: ChatState = {
  chats: [],
  isLoading: false,
  activeChat: null,
  messages: []
};

@Injectable({ providedIn: 'root' })
export class ChatStore extends signalStore({
  providedIn: 'root',
  protectedState: false
},
  withState(initialState),
  withHooks({
    onInit: async (store) => {
      const firestore = inject(Firestore);
      const chatsRef = collection(firestore, 'chats');

      collectionData(chatsRef)
        .pipe(
          takeUntilDestroyed(),
          tap(chats => console.log('chats', chats)),
          map((chats: DocumentData[]) => chats.map(chat => ({
            id: chat['id'],
            ...chat['data']()
          }) as Chat))
        )
        .subscribe(chats => patchState(store, { chats }));
    }
  })
) {

  private readonly firestore = inject(Firestore);
  private readonly chatsRef = collection(this.firestore, 'chats');
  private messagesListener!: Subscription;

  readonly activeChatId = computed(() => this.activeChat()?.id);

  loadChat(chatId: string): void {

    if ( this.messagesListener ) {
      this.messagesListener.unsubscribe();
    }
    const chatMessagesRef = collection(this.firestore, `chats/${chatId}/messages`);


    this.messagesListener = collectionData(chatMessagesRef)
      .pipe(
        takeUntilDestroyed(),
        tap(messages => console.log('messages', messages)),
        map((messages: DocumentData[]) => messages.map(message => ({
          id: message['id'],
          ...message['data']()
        }) as Message))
      )
      .subscribe(messages => patchState(this, { messages }));
  }
}

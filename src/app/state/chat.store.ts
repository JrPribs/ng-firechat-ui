import {
  patchState, signalStore, withHooks, withState
} from '@ngrx/signals';
import { Chat } from '../models/chat.model';
import {
  computed, DestroyRef, inject, Injectable
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  collection, collectionData, doc, Firestore,
  getDoc,
  orderBy,
  query
} from '@angular/fire/firestore';
import { Message } from '../models/message.model';
import { Subscription, tap } from 'rxjs';

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

    collectionData(chatsRef, { idField: 'id' })
      .pipe(
        takeUntilDestroyed(),
        tap(chats => console.debug('chats', chats))
      )
      .subscribe(chats => patchState(store, { chats }));
  }
})
) {
  private readonly destroyRef = inject(DestroyRef);
  private readonly firestore = inject(Firestore);
  private readonly chatsRef = collection(this.firestore, 'chats');
  private messagesListener!: Subscription;

  readonly activeChatId = computed(() => this.activeChat()?.id);
  readonly activeChatUsername = computed(() => this.activeChat()?.username);
  readonly activeChatMessagesRef = computed(() => collection(this.firestore, `chats/${this.activeChatId()}/messages`));

  async loadChat(chatId: string): Promise<void> {
    patchState(this, { isLoading: true });

    const chatRef = doc(this.firestore, `chats/${chatId}`);

    const chat = await getDoc(chatRef);

    if (!chat.exists()) {
      throw new Error('Chat not found');
    }

    console.debug('chat', chat.data());

    patchState(this, {
      activeChat: {
        id: chat.id,
        ...chat.data()
      } as Chat
    });

    if ( this.messagesListener ) {
      this.messagesListener.unsubscribe();
    }

    const chatMessagesRef = collection(this.firestore, `chats/${chatId}/messages`);

    this.messagesListener = collectionData(query(chatMessagesRef, orderBy('timestamp', 'asc')), { idField: 'id' })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(messages => console.debug('messages', messages))
      )
      .subscribe(messages => patchState(this, { messages: messages as Message[] }));

    patchState(this, { isLoading: false });
  }
}

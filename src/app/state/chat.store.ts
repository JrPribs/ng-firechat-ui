import { patchState, signalStore, withHooks, withState } from '@ngrx/signals';
import { Chat } from '../models/chat.model';
import { computed, inject, Injectable } from '@angular/core';
import { collection, Firestore, getDocs } from '@angular/fire/firestore';

type ChatState = {
  chats: Chat[];
  isLoading: boolean;
  activeChat: Chat | null;
};

const initialState: ChatState = {
  chats: [],
  isLoading: false,
  activeChat: null
};

@Injectable({ providedIn: 'root' })
export class ChatStore extends signalStore(
  withState(initialState),
  withHooks({
    onInit: async (state) => {
      const firestore = inject(Firestore);
      const chats = await getDocs(collection(firestore, 'chats'));
      console.log('chats', chats);
      patchState(state, { chats: chats.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Chat) });
    }
  })
) {
  readonly activeChatId = computed(() => this.activeChat()?.id);
}

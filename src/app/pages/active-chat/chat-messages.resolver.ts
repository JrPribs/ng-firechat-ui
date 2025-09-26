import { inject } from '@angular/core';

import type { ResolveFn } from '@angular/router';
import { ChatStore } from '../../state/chat.store';

export const chatMessagesResolver: ResolveFn<void> = (route, state) => {
  const store = inject(ChatStore);
  const chatId = route.params['id'];

  store.loadChat(chatId);
};

import { Routes } from '@angular/router';
import { ChatWindowComponent } from './pages/chat-window/chat-window.component';
import { chatMessagesResolver } from './pages/active-chat/chat-messages.resolver';
import { ActiveChat } from './pages/active-chat/active-chat';

export const routes: Routes = [
  {
    path: '',
    component: ChatWindowComponent,
    children: [
      // {
      //   path: '',
      //   component: NoActiveChat
      // },
      {
        path: 'chat/:id',
        component: ActiveChat,
        resolve: {
          chat: chatMessagesResolver
        }
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];

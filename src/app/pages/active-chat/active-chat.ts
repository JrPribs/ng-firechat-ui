import {
  Component, effect, ElementRef, inject, model, signal, viewChild
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatMessageComponent } from './components/chat-message/chat-message';
import { CommonModule } from '@angular/common';
import { ChatService } from '../../services/chat.service';
import { Firestore } from '@angular/fire/firestore';
import { ChatStore } from '../../state/chat.store';
import { Chat } from '../../models/chat.model';

@Component({
  selector: 'app-active-chat',
  imports: [
    CommonModule,
    ChatMessageComponent,
    FormsModule
  ],
  templateUrl: './active-chat.html',
  styleUrl: './active-chat.css'
})
export class ActiveChat {
  private chatSvc = inject(ChatService);
  private firestore = inject(Firestore);
  readonly store = inject(ChatStore);

  chat = model<Chat>();

  newMessage = signal('');

  scrollContainer = viewChild<ElementRef<HTMLDivElement>>('scrollContainer');

  constructor() {
    // FIX: Replaced subscription logic with an effect to automatically scroll to the bottom
    // when new messages are added. Signals do not have a .subscribe() method.
    // An effect is the correct reactive way to handle side effects like DOM manipulation.
    effect(() => {
      const container = this.scrollContainer();
      if (container) {
        // We read the messages signal here to create a dependency. The effect will
        // re-run whenever new messages are added, scrolling to the latest one.
        this.chatSvc.messages();
        this.scrollToBottom(container.nativeElement);
      }
    });
  }



  sendMessage(): void {
    const text = this.newMessage().trim();
    if (text) {
      this.chatSvc.sendMessage(text);
      this.newMessage.set('');
    }
  }

  private scrollToBottom(container: HTMLDivElement): void {
    try {
      // The effect runs after the view is rendered, so we can safely scroll.
      container.scrollTop = container.scrollHeight;
    } catch (err) {
      console.error('Could not scroll to bottom:', err);
    }
  }

}

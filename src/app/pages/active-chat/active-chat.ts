import {
  Component, effect, ElementRef, inject, model, signal, viewChild, OnInit, OnDestroy
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatMessageComponent } from './components/chat-message/chat-message';
import { CommonModule } from '@angular/common';
import { ChatService } from '../../services/chat.service';
import {
  Firestore, onSnapshot, Unsubscribe, updateDoc
} from '@angular/fire/firestore';
import { ChatStore } from '../../state/chat.store';
import { Chat } from '../../models/chat.model';
import { MatDialog } from '@angular/material/dialog';
import { NewChatDialogComponent } from '../../components/new-chat-dialog/new-chat-dialog';
import { firstValueFrom } from 'rxjs';

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
export class ActiveChat implements OnInit, OnDestroy {
  private chatSvc = inject(ChatService);
  private firestore = inject(Firestore);
  readonly store = inject(ChatStore);
  readonly dialog = inject(MatDialog);

  chat = model<Chat>();

  newMessage = signal('');
  readListener!: Unsubscribe;
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

  ngOnInit(): void {
    this.readListener = onSnapshot(this.store.activeChatMessagesRef(), async (snapshot) => {
      console.debug('snapshot', snapshot.docs.map(doc => doc.data()));
      console.debug('activeChatRef', this.store.activeChatRef());
      await updateDoc(this.store.activeChatRef(), {
        unread: false
      });

    });
  }


  sendMessage(): void {
    const text = this.newMessage().trim();
    if (text) {
      this.chatSvc.sendMessage(text);
      this.newMessage.set('');
    }
  }

  async createNewChat(): Promise<void> {
    const result = await firstValueFrom(this.dialog.open(NewChatDialogComponent, {
      width: '300px',
      enterAnimationDuration: '300ms',
      exitAnimationDuration: '300ms'
    }).afterClosed());

    if (result) {
      this.chatSvc.newChat(result);
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

  ngOnDestroy(): void {
    this.readListener();
  }

}

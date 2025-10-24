import {
  Component, ChangeDetectionStrategy, inject, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatService } from '../../services/chat.service';
import { ChatStore } from '../../state/chat.store';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { RouterOutlet } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { NewChatDialogComponent } from '../../components/new-chat-dialog/new-chat-dialog';
import { ChatList } from './components/chat-list/chat-list';


@Component({
  selector: 'app-chat-window',
  imports: [
    ChatList,
    CommonModule,
    MatDialogModule,
    RouterOutlet
  ],
  templateUrl: './chat-window.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatWindowComponent {

  protected readonly title = signal('Accordo IG Agent');
  private readonly chatSvc = inject(ChatService);
  readonly store = inject(ChatStore);
  readonly dialog = inject(MatDialog);

  async createNewChat(): Promise<void> {
    const result = await firstValueFrom(this.dialog.open(NewChatDialogComponent, {
      width: '300px',
      enterAnimationDuration: '300ms',
      exitAnimationDuration: '300ms'
    }).afterClosed());

    if (result) {
      this.chatSvc.newChat(result.username, result.modelProvider);
    }
  }
}

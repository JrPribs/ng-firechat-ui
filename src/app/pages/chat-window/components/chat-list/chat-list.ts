import {
  ChangeDetectionStrategy, Component, inject
} from '@angular/core';
import { ChatStore } from '../../../../state/chat.store';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NewChatDialogComponent } from '../../../../components/new-chat-dialog/new-chat-dialog';
import { firstValueFrom } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ChatService } from '../../../../services/chat.service';

@Component({
  selector: 'app-chat-list',
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './chat-list.html',
  styleUrl: './chat-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatList {
  readonly store = inject(ChatStore);
  readonly dialog = inject(MatDialog);
  readonly chatSvc = inject(ChatService);

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
}

import {
  Component, ChangeDetectionStrategy, inject, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatService } from '../../services/chat.service';
import { ChatStore } from '../../state/chat.store';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import {
  RouterLink, RouterLinkActive, RouterOutlet
} from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { NewChatDialogComponent } from '../../components/new-chat-dialog/new-chat-dialog';


@Component({
  selector: 'app-chat-window',
  imports: [
    CommonModule,
    MatDialogModule,
    RouterLink,
    RouterLinkActive,
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

  // Mobile sidebar state
  mobileSidebarOpen = signal(false);

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

  toggleMobileSidebar(): void {
    this.mobileSidebarOpen.update(open => !open);
  }

  closeMobileSidebar(): void {
    this.mobileSidebarOpen.set(false);
  }
}

import {
  ChangeDetectionStrategy, Component, computed, input
} from '@angular/core';
import { Message } from '../../../../models/message.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat-message',
  imports: [ CommonModule ],
  templateUrl: './chat-message.html',
  styleUrl: './chat-message.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatMessageComponent {
  message = input<Message>();

  avatarUrl = computed(() => `https://picsum.photos/seed/${this.message()?.username}/48/48`);
  isUserMessage = computed(() => this.message()?.username !== 'Dr. Accordo');
}

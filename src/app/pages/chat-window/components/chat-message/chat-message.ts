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

  isUserMessage = computed(() => this.message()?.username === 'user');
}

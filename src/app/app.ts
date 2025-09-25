import {
  ChangeDetectionStrategy, Component, inject, signal 
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ChatStore } from './state/chat.store';

@Component({
  selector: 'app-root',
  imports: [ RouterOutlet ],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  protected readonly title = signal('Accordo IG Agent');
  readonly store = inject(ChatStore);
}

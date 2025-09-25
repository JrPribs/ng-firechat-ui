import { ChangeDetectionStrategy, Component, inject, model } from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-new-chat-dialog',
  imports: [
    MatButtonModule,
    MatDialogActions,
    MatDialogClose,
    MatDialogTitle,
    MatDialogContent,
    FormsModule
  ],
  templateUrl: './new-chat-dialog.html',
  styleUrl: './new-chat-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewChatDialogComponent {
  readonly dialogRef = inject(MatDialogRef<NewChatDialogComponent>);
  readonly username = model('');
}

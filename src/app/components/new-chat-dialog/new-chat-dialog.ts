import {
  ChangeDetectionStrategy, Component, inject
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from '@angular/material/dialog';
import {
  FormControl, FormsModule, ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-new-chat-dialog',
  imports: [
    MatButtonModule,
    MatDialogActions,
    MatDialogClose,
    MatDialogTitle,
    MatDialogContent,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule
  ],
  templateUrl: './new-chat-dialog.html',
  styleUrl: './new-chat-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewChatDialogComponent {
  readonly dialogRef = inject(MatDialogRef<NewChatDialogComponent>);
  readonly username = new FormControl('', [ Validators.required ]);
}

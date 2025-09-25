import type { ResolveFn } from '@angular/router';

export const chatMessagesResolver: ResolveFn<boolean> = (route, state) => {
  return true;
};

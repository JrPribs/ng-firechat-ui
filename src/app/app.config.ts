import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getFunctions, provideFunctions } from '@angular/fire/functions';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp({
      projectId: "accordo-agents",
      appId: "1:554543226210:web:f8b7a32410b452d887603b",
      storageBucket: "accordo-agents.firebasestorage.app",
      apiKey: "AIzaSyDkbinb2FTOLQ61vFJbQeZ-tHW_tf9RNMg",
      authDomain: "accordo-agents.firebaseapp.com",
      messagingSenderId: "554543226210"
    })),
    provideFirestore(() => getFirestore()),
    provideFunctions(() => getFunctions())
  ]
};

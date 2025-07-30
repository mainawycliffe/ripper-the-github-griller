import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFunctions, provideFunctions } from '@angular/fire/functions';
import {
  provideQueryClient,
  QueryClient,
} from '@tanstack/angular-query-experimental';

const firebaseConfig = {
  apiKey: 'AIzaSyBTy1PhC64E8EFv3EFFN_BxPANEMQAgsmc',
  authDomain: 'github-griller.firebaseapp.com',
  projectId: 'github-griller',
  storageBucket: 'github-griller.firebasestorage.app',
  messagingSenderId: '29834312711',
  appId: '1:29834312711:web:cf038fda9ea229b12dfea2',
};

const queryClient = new QueryClient({});

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideQueryClient(queryClient),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideFunctions(() => getFunctions()),
  ],
};

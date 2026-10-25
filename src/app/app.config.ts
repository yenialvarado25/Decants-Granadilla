import {
  ApplicationConfig,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners
} from '@angular/core';

import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { firebaseApp } from './core/firebase.config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAppInitializer(() => {
      console.info(
        'Firebase inicializado:',
        firebaseApp.options.projectId
      );
    })
  ]
};

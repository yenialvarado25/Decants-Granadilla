import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firebaseAuth } from './firebase.config';

const ADMIN_UID = 'eSn32cwJliYK7W6wDznfN65dSEs2';

export const authGuard: CanActivateFn = async () => {
  const router = inject(Router);

  await firebaseAuth.authStateReady();

  const usuario = firebaseAuth.currentUser;

  if (!usuario) {
    return router.createUrlTree(['/admin/login']);
  }

  if (usuario.uid !== ADMIN_UID) {
    return router.createUrlTree(['/']);
  }

  return true;
};

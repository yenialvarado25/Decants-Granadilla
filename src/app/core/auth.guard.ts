
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firebaseAuth } from './firebase.config';

export const authGuard: CanActivateFn = async () => {
  const router = inject(Router);

  await firebaseAuth.authStateReady();

  return firebaseAuth.currentUser
    ? true
    : router.createUrlTree(['/admin/login']);
};

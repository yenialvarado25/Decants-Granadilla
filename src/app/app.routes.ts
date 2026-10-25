
import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: 'admin/login',
    loadComponent: () =>
      import('./admin/admin-login/admin-login')
        .then(m => m.AdminLogin)
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./admin/admin-panel/admin-panel')
        .then(m => m.AdminPanel)
  }
];


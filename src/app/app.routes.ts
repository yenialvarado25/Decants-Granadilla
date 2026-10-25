import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'admin',
    loadComponent: () =>
      import('./admin/admin-panel/admin-panel')
        .then(m => m.AdminPanel)
  }
];

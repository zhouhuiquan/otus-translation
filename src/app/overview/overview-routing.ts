import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: ':format',
    loadComponent: () => import('./overview/overview.component').then((m) => m.OverviewComponent),
  },
  {
    path: '',
    redirectTo: 'json',
    pathMatch: 'full',
  },
];

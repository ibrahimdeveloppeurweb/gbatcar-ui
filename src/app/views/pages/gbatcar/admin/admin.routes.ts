import { Routes } from '@angular/router';

export default [
    {
        path: '',
        redirectTo: 'users',
        pathMatch: 'full'
    },
    {
        path: 'users',
        loadComponent: () => import('./users/users.component').then(c => c.GbatcarAdminUsersComponent)
    },
    {
        path: 'users/add',
        loadComponent: () => import('./users/user-form/user-form.component').then(c => c.UserFormComponent)
    },
    {
        path: 'users/edit/:id',
        loadComponent: () => import('./users/user-form/user-form.component').then(c => c.UserFormComponent)
    },
    {
        path: 'users/details/:id',
        loadComponent: () => import('./users/user-details/user-details.component').then(c => c.UserDetailsComponent)
    },
    {
        path: 'settings',
        loadComponent: () => import('./settings/settings.component').then(c => c.GbatcarAdminSettingsComponent)
    },
    {
        path: 'notifications',
        loadComponent: () => import('./notifications/notifications.component').then(c => c.NotificationsComponent)
    }
] as Routes;

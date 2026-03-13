import { Routes } from '@angular/router';

export default [
    {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
    },
    {
        path: 'dashboard',
        loadComponent: () => import('./admin-dashboard/admin-dashboard.component').then(c => c.AdminDashboardComponent)
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
    },
    {
        path: 'permissions',
        loadComponent: () => import('./permissions/permissions-list/permissions-list.component').then(c => c.PermissionsListComponent)
    },
    {
        path: 'permissions/add',
        loadComponent: () => import('./permissions/permission-form/permission-form.component').then(c => c.PermissionFormComponent)
    },
    {
        path: 'permissions/edit/:id',
        loadComponent: () => import('./permissions/permission-form/permission-form.component').then(c => c.PermissionFormComponent)
    },
    {
        path: 'permissions/details/:id',
        loadComponent: () => import('./permissions/permission-details/permission-details.component').then(c => c.PermissionDetailsComponent)
    }
] as Routes;

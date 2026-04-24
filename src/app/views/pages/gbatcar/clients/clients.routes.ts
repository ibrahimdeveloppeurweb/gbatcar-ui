import { Routes } from '@angular/router';

export default [
    {
        path: 'dashboard',
        loadComponent: () => import('./client-dashboard/client-dashboard.component').then(c => c.ClientDashboardComponent)
    },
    {
        path: '',
        loadComponent: () => import('./clients.component').then(c => c.ClientsComponent)
    },
    {
        path: 'new',
        loadComponent: () => import('./client-form/client-form.component').then(c => c.ClientFormComponent)
    },
    {
        path: 'edit/:id',
        loadComponent: () => import('./client-form/client-form.component').then(c => c.ClientFormComponent)
    },
    {
        path: 'details/:id',
        loadComponent: () => import('./client-details/client-details.component').then(c => c.ClientDetailsComponent)
    },

    {
        path: 'subscriptions',
        loadComponent: () => import('./subscriptions-list/subscriptions-list.component').then(c => c.SubscriptionsListComponent)
    },
    {
        path: 'subscriptions/details/:id',
        loadComponent: () => import('./subscription-details/subscription-details.component').then(c => c.SubscriptionDetailsComponent)
    }
] as Routes;

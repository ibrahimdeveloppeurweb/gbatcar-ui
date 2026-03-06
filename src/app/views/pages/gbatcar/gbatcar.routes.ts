import { Routes } from '@angular/router';

export default [
    {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
    },
    {
        path: 'dashboard',
        loadChildren: () => import('./dashboard/dashboard.routes')
    },
    {
        path: 'admin',
        loadChildren: () => import('./admin/admin.routes')
    },
    {
        path: 'clients',
        loadChildren: () => import('./clients/clients.routes')
    },
    {
        path: 'vehicles',
        loadChildren: () => import('./vehicles/vehicles.routes').then(m => m.vehiclesRoutes)
    },
    {
        path: 'contracts',
        loadChildren: () => import('./contracts/contracts.routes').then(m => m.contractsRoutes)
    },
    {
        path: 'payments',
        loadChildren: () => import('./payments/payments.routes').then(m => m.paymentsRoutes)
    },
    {
        path: 'maintenance',
        loadChildren: () => import('./maintenance/maintenance.routes').then(m => m.maintenanceRoutes)
    },
    {
        path: 'apps',
        loadChildren: () => import('./apps/apps.routes')
    }
] as Routes;

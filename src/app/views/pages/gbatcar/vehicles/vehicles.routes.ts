import { Routes } from '@angular/router';
import { VehiclesComponent } from './vehicles.component';
import { VehicleFormComponent } from './vehicle-form/vehicle-form.component';
import { VehicleDetailsComponent } from './vehicle-details/vehicle-details.component';

export const vehiclesRoutes: Routes = [
    {
        path: 'dashboard',
        loadComponent: () => import('./vehicle-dashboard/vehicle-dashboard.component').then(m => m.VehicleDashboardComponent)
    },
    {
        path: '',
        component: VehiclesComponent
    },
    {
        path: 'catalog',
        loadComponent: () => import('./catalog/catalog.component').then(m => m.CatalogComponent)
    },
    {
        path: 'compliance',
        loadComponent: () => import('./compliance/compliance.component').then(m => m.ComplianceComponent)
    },
    {
        path: 'compliance/add',
        loadComponent: () => import('./compliance/compliance-add/compliance-add.component').then(m => m.ComplianceAddComponent)
    },
    {
        path: 'compliance/details/:id',
        loadComponent: () => import('./compliance/compliance-details/compliance-details.component').then(m => m.ComplianceDetailsComponent)
    },
    {
        path: 'new',
        component: VehicleFormComponent
    },
    {
        path: 'edit/:id',
        component: VehicleFormComponent
    },
    {
        path: 'details/:id',
        component: VehicleDetailsComponent
    }
];

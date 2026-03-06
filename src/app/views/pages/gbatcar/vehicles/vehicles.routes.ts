import { Routes } from '@angular/router';
import { VehiclesComponent } from './vehicles.component';
import { VehicleFormComponent } from './vehicle-form/vehicle-form.component';
import { VehicleDetailsComponent } from './vehicle-details/vehicle-details.component';

export const vehiclesRoutes: Routes = [
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

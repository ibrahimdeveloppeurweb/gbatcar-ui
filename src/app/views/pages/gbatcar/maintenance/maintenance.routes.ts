import { Routes } from '@angular/router';
import { MaintenanceComponent } from './maintenance.component';
import { MaintenanceAlertsComponent } from './maintenance-alerts/maintenance-alerts.component';
import { MaintenanceAlertFormComponent } from './maintenance-alert-form/maintenance-alert-form.component';
import { MaintenanceAlertDetailsComponent } from './maintenance-alert-details/maintenance-alert-details.component';
import { MaintenanceDetailsComponent } from './maintenance-details/maintenance-details.component';

export const maintenanceRoutes: Routes = [
    {
        path: '',
        component: MaintenanceComponent
    },
    {
        path: 'alerts',
        component: MaintenanceAlertsComponent
    },
    {
        path: 'alerts/new',
        component: MaintenanceAlertFormComponent
    },
    {
        path: 'alerts/details/:id',
        component: MaintenanceAlertDetailsComponent
    },
    {
        path: 'details/:id',
        component: MaintenanceDetailsComponent
    }
];

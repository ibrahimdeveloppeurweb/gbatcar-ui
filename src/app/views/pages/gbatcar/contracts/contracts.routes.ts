import { Routes } from '@angular/router';
import { ContractsComponent } from './contracts.component';
import { ContractsLateComponent } from './contracts-late/contracts-late.component';
import { ContractFormComponent } from './contract-form/contract-form.component';
import { ContractDetailsComponent } from './contract-details/contract-details.component';
import { ContractDashboardComponent } from './contract-dashboard/contract-dashboard.component';

export const contractsRoutes: Routes = [
    {
        path: 'dashboard',
        component: ContractDashboardComponent
    },
    {
        path: '',
        component: ContractsComponent
    },
    {
        path: 'new',
        component: ContractFormComponent
    },
    {
        path: 'edit/:id',
        component: ContractFormComponent
    },
    {
        path: 'details/:id',
        component: ContractDetailsComponent
    },
    {
        path: 'late',
        component: ContractsLateComponent
    }
];

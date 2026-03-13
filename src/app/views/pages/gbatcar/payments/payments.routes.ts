import { Routes } from '@angular/router';
import { PaymentsComponent } from './payments.component';
import { PenaltiesComponent } from './penalties/penalties.component';
import { PaymentFormComponent } from './payment-form/payment-form.component';
import { PaymentDetailsComponent } from './payment-details/payment-details.component';
import { PenaltyFormComponent } from './penalty-form/penalty-form.component';
import { PenaltyDetailsComponent } from './penalty-details/penalty-details.component';


export const paymentsRoutes: Routes = [
    {
        path: 'dashboard',
        loadComponent: () => import('./payment-dashboard/payment-dashboard.component').then(m => m.PaymentDashboardComponent)
    },
    {
        path: '',
        component: PaymentsComponent
    },
    {
        path: 'new',
        component: PaymentFormComponent
    },
    {
        path: 'details/:id',
        component: PaymentDetailsComponent
    },
    {
        path: 'penalties',
        component: PenaltiesComponent
    },
    {
        path: 'penalties/new',
        component: PenaltyFormComponent
    },
    {
        path: 'penalties/details/:id',
        component: PenaltyDetailsComponent
    }
];

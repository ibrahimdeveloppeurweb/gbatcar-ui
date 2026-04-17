import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FeatherIconDirective } from '../../../../core/feather-icon/feather-icon.directive';
import { PaymentService } from '../../../../core/services/payment/payment.service';
import { VehicleService } from '../../../../core/services/vehicle/vehicle.service';
import { Payment } from '../../../../core/models/payment.model';
import Swal from 'sweetalert2';
import { NgxPermissionsModule, NgxPermissionsService } from 'ngx-permissions';
import { AuthService } from '../../../../core/services/auth/auth.service';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, RouterModule, FeatherIconDirective, FormsModule, NgxPermissionsModule],
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.scss'
})
export class PaymentsComponent implements OnInit {
  private paymentService = inject(PaymentService);
  private vehicleService = inject(VehicleService);
  private route = inject(ActivatedRoute);
  private permissionsService = inject(NgxPermissionsService);
  private authService = inject(AuthService);

  payments: Payment[] = [];
  loading: boolean = false;

  // KPI computed properties (dynamic, from data)
  get totalValidated(): number {
    return this.payments.filter(p => p.status === 'Validé' || p.status === 'VALIDÉ' || p.status === 'VALIDATED').reduce((sum, p) => sum + (p.amount || 0), 0);
  }
  get pendingPaymentsTotal(): number {
    return this.payments.filter(p => p.status === 'En attente' || p.status === 'PENDING' || p.status === 'ATTENTE').reduce((sum, p) => sum + (p.amount || 0), 0);
  }
  get pendingPaymentsCount(): number {
    return this.payments.filter(p => p.status === 'En attente' || p.status === 'PENDING' || p.status === 'ATTENTE').length;
  }
  get dominantMethod(): string {
    if (this.payments.length === 0) return 'N/A';
    const counts: Record<string, number> = {};
    this.payments.forEach(p => { if (p.method) counts[p.method] = (counts[p.method] || 0) + 1; });
    const entries = Object.entries(counts);
    if (entries.length === 0) return 'N/A';
    return entries.sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A';
  }
  get dominantMethodPercent(): number {
    const total = this.payments.length;
    if (total === 0) return 0;
    const counts: Record<string, number> = {};
    this.payments.forEach(p => { if (p.method) counts[p.method] = (counts[p.method] || 0) + 1; });
    const values = Object.values(counts);
    if (values.length === 0) return 0;
    const max = Math.max(...values);
    return Math.round((max / total) * 100);
  }

  showAdvancedFilters: boolean = false;

  toggleAdvancedFilters() {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  // 1. Quick Filters
  quickSearchTerm: string = '';
  quickMethodFilter: string = '';

  // 2. Advanced Filters Form State
  advSearchTerm: string = '';
  advMethodFilter: string = '';
  advStatusFilter: string = '';
  advDateMin: string = '';
  advDateMax: string = '';
  advAmountMin: number | null = null;
  advAmountMax: number | null = null;
  advCountFilter: number = 20;

  constructor() { }

  ngOnInit(): void {
    const permissions = this.authService.getPermissions();
    this.permissionsService.loadPermissions(permissions);

    this.route.queryParams.subscribe(params => {
      const vehicleParam = params['vehicle'];
      const vehicleIdParam = params['vehicleId'];

      if (vehicleIdParam) {
        this.loadPayments({ vehicleId: vehicleIdParam });
      } else if (vehicleParam) {
        // Resolve UUID to ID internally to keep URL clean
        this.resolveAndLoadVehicle(vehicleParam.trim());
      } else {
        this.loadPayments();
      }
    });
  }

  private resolveAndLoadVehicle(uuid: string) {
    this.loading = true;
    this.vehicleService.getSingle(uuid).subscribe({
      next: (v) => {
        if (v && v.id) {
          this.loadPayments({ vehicleId: v.id });
        } else {
          this.loadPayments({ vehicle: uuid });
        }
      },
      error: () => {
        this.loadPayments({ vehicle: uuid });
      }
    });
  }

  loadPayments(extraFilters: any = {}) {
    this.loading = true;
    const rawFilters: any = {
      search: this.advSearchTerm,
      method: this.advMethodFilter,
      status: this.advStatusFilter,
      dateMin: this.advDateMin,
      dateMax: this.advDateMax,
      amountMin: this.advAmountMin,
      amountMax: this.advAmountMax,
      count: this.advCountFilter,
      ...extraFilters
    };

    // Remove null, undefined, and empty string values
    const filters: any = {};
    Object.keys(rawFilters).forEach(key => {
      if (rawFilters[key] !== null && rawFilters[key] !== undefined && rawFilters[key] !== '') {
        filters[key] = rawFilters[key];
      }
    });

    this.paymentService.getList(filters).subscribe({
      next: (res: any) => {
        this.payments = res.data || res;
        this.loading = false;
      },
      error: (err: any) => {
        this.loading = false;
        console.error('Error loading payments', err);
        Swal.fire('Erreur', 'Impossible de charger les paiements', 'error');
      }
    });
  }

  applyQuickFilters() {
    this.advSearchTerm = this.quickSearchTerm;
    this.advMethodFilter = this.quickMethodFilter;
    this.loadPayments();
  }

  applyAdvancedFilters() {
    this.quickSearchTerm = this.advSearchTerm;
    this.quickMethodFilter = this.advMethodFilter;
    this.loadPayments();
  }

  resetFilters() {
    this.advSearchTerm = '';
    this.advMethodFilter = '';
    this.advStatusFilter = '';
    this.advDateMin = '';
    this.advDateMax = '';
    this.advAmountMin = null;
    this.advAmountMax = null;
    this.advCountFilter = 20;

    this.quickSearchTerm = '';
    this.quickMethodFilter = '';

    this.loadPayments();
  }

  validatePayment(uuid: string) {
    Swal.fire({
      title: 'Valider ce paiement ?',
      text: "Le montant sera ajouté au solde payé du contrat.",
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: '#1bc943',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Oui, valider',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.paymentService.changeStatus(uuid, 'Validé').subscribe({
          next: () => {
            Swal.fire('Validé !', 'Le paiement a été validé avec succès.', 'success');
            this.loadPayments();
          },
          error: (err: any) => {
            Swal.fire('Erreur', 'Impossible de valider le paiement', 'error');
          }
        });
      }
    });
  }

  deletePayment(uuid: string) {
    Swal.fire({
      title: 'Supprimer ce paiement ?',
      text: "Cette action est irréversible !",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.paymentService.delete(uuid).subscribe({
          next: () => {
            Swal.fire('Supprimé !', 'Le paiement a été supprimé.', 'success');
            this.loadPayments();
          },
          error: (err: any) => {
            Swal.fire('Erreur', 'Impossible de supprimer le paiement', 'error');
          }
        });
      }
    });
  }

  translateStatus(status?: string | undefined): string {
    if (!status) return 'Inconnu';
    const normalized = status.toString().toUpperCase();
    if (normalized === 'NEW' || normalized === 'PENDING' || normalized === 'EN ATTENTE' || normalized === 'ATTENTE') return 'EN ATTENTE';
    if (normalized === 'VALIDATED' || normalized === 'VALIDÉ') return 'VALIDÉ';
    if (normalized === 'REJECTED' || normalized === 'REJETÉ') return 'REJETÉ';
    return status.toString();
  }
}


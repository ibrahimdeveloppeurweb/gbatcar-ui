import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FeatherIconDirective } from '../../../../core/feather-icon/feather-icon.directive';
import { ContractService } from '../../../../core/services/contract/contract.service';
import { Contract } from '../../../../core/models/contract.model';
import { NgxPermissionsModule, NgxPermissionsService } from 'ngx-permissions';
import { AuthService } from '../../../../core/services/auth/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-contracts',
  standalone: true,
  imports: [CommonModule, RouterModule, FeatherIconDirective, FormsModule, NgxPermissionsModule],
  templateUrl: './contracts.component.html',
  styleUrl: './contracts.component.scss'
})
export class ContractsComponent implements OnInit {
  MathAbs = Math.abs;
  private contractService = inject(ContractService);
  private permissionsService = inject(NgxPermissionsService);
  private authService = inject(AuthService);

  contracts: Contract[] = [];
  loading: boolean = false;

  // KPI computed properties
  get activeContractsCount(): number {
    return this.contracts.filter(c => ['En cours', 'ACTIVE', 'VALIDATED', 'VALIDÉ'].includes(c.status || '')).length;
  }
  get lateContractsCount(): number {
    return this.contracts.filter(c => c.paymentStatus === 'En retard' || c.paymentStatus === 'Impayé définitif').length;
  }
  get closedContractsCount(): number {
    return this.contracts.filter(c => c.status === 'Soldé' || c.status === 'Résilié').length;
  }

  get maturingSoonCount(): number {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return this.contracts.filter(c => {
      if (!c.endDate) return false;
      const endDate = new Date(c.endDate);
      const isActive = ['En cours', 'ACTIVE', 'VALIDATED', 'VALIDÉ'].includes(c.status || '');
      return isActive && endDate <= thirtyDaysFromNow;
    }).length;
  }

  get incompleteDossiersCount(): number {
    return this.contracts.filter(c => ['En Attente', 'NEW', 'PENDING'].includes(c.status || '')).length;
  }

  showAdvancedFilters: boolean = false;

  toggleAdvancedFilters() {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  getRiskLevel(contract: Contract): { label: string, class: string, reason?: string } {
    if (contract.riskAnalysis) {
      return {
        label: contract.riskAnalysis.level,
        class: contract.riskAnalysis.class || 'text-muted',
        reason: contract.riskAnalysis.reason
      };
    }

    // Fallback logic
    if (contract.paymentStatus === 'Impayé définitif') return { label: 'CRITIQUE', class: 'text-danger' };
    if (contract.paymentStatus === 'En retard') return { label: 'ÉLEVÉ', class: 'text-warning' };

    if (!contract.hasSchedules) return { label: 'NON DÉFINI', class: 'text-muted' };

    const paid = contract.paidAmount || 0;
    const total = contract.totalAmount || 1;
    const progress = (paid / total) * 100;

    if (progress < 25) return { label: 'MOYEN', class: 'text-info' };
    return { label: 'BAS', class: 'text-success' };
  }

  getDaysUntilDeadline(dateStr?: string): number {
    if (!dateStr) return 0;
    const today = new Date();
    const deadline = new Date(dateStr);
    const diffTime = deadline.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // 1. Quick Filters
  quickSearchTerm: string = '';
  quickStatusFilter: string = '';

  // 2. Advanced Filters Form State
  advSearchTerm: string = '';
  advStatusFilter: string = '';
  advPaymentStatusFilter: string = '';
  advStartDateMin: string = '';
  advStartDateMax: string = '';
  advProgressMin: number | null = null;
  advProgressMax: number | null = null;
  advCountFilter: number = 20;

  constructor() { }

  ngOnInit(): void {
    const permission = this.authService.getPermissions();
    this.permissionsService.loadPermissions(permission);

    this.loadContracts();
  }

  loadContracts() {
    this.loading = true;
    console.log('--- DYNAMIC CONTRACTS LOADING START ---');
    const rawFilters: any = {
      search: this.advSearchTerm,
      status: this.advStatusFilter,
      paymentStatus: this.advPaymentStatusFilter,
      startDateMin: this.advStartDateMin,
      startDateMax: this.advStartDateMax,
      progressMin: this.advProgressMin,
      progressMax: this.advProgressMax,
      count: this.advCountFilter
    };

    const filters: any = {};
    Object.keys(rawFilters).forEach(key => {
      if (rawFilters[key] !== null && rawFilters[key] !== undefined && rawFilters[key] !== '') {
        filters[key] = rawFilters[key];
      }
    });

    this.contractService.getList(filters).subscribe({
      next: (res: any) => {
        this.contracts = res.data || res;
        this.loading = false;
      },
      error: (err: any) => {
        this.loading = false;
        console.error('Error loading contracts', err);
        Swal.fire('Erreur', 'Impossible de charger la liste des contrats', 'error');
      }
    });
  }

  get filteredContracts(): Contract[] {
    return this.contracts;
  }

  applyQuickFilters() {
    this.advSearchTerm = this.quickSearchTerm;
    this.advStatusFilter = this.quickStatusFilter;
    this.loadContracts();
  }

  applyAdvancedFilters() {
    this.quickSearchTerm = this.advSearchTerm;
    this.quickStatusFilter = this.advStatusFilter;
    this.loadContracts();
  }

  resetFilters() {
    this.advSearchTerm = '';
    this.advStatusFilter = '';
    this.advPaymentStatusFilter = '';
    this.advStartDateMin = '';
    this.advStartDateMax = '';
    this.advProgressMin = null;
    this.advProgressMax = null;
    this.advCountFilter = 20;

    this.quickSearchTerm = '';
    this.quickStatusFilter = '';

    this.applyAdvancedFilters();
  }

  deleteContract(uuid: string) {
    Swal.fire({
      title: 'Êtes-vous sûr ?',
      text: "Cette action est irréversible !",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, supprimer !',
      cancelButtonText: 'Annuler',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.contractService.getDelete(uuid).subscribe({
          next: () => {
            Swal.fire('Supprimé !', 'Le contrat a été supprimé.', 'success');
            this.loadContracts();
          },
          error: (err: any) => {
            Swal.fire('Erreur', err?.error?.message || 'Erreur lors de la suppression', 'error');
          }
        });
      }
    });
  }

  translateFrequency(value?: string): string {
    if (!value) return '';
    const normalized = value.toLowerCase();
    if (normalized === 'monthly') return 'Mensuel';
    if (normalized === 'weekly') return 'Hebdomadaire';
    if (normalized === 'daily') return 'Journalier';
    return value;
  }

  translateStatus(status?: string): string {
    if (!status) return 'Inconnu';
    const normalized = status.toUpperCase();
    if (normalized === 'NEW' || normalized === 'PENDING') return 'NOUVEAU';
    if (normalized === 'VALIDATED' || normalized === 'VALIDÉ') return 'VALIDÉ';
    if (normalized === 'ACTIVE' || normalized === 'EN COURS') return 'EN COURS';
    if (normalized === 'SOLDÉ') return 'SOLDÉ';
    if (normalized === 'RÉSILIÉ') return 'RÉSILIÉ';
    if (normalized === 'TERMINÉ') return 'TERMINÉ';
    if (normalized === 'ROMPU') return 'ROMPU';
    return status;
  }

  getContractStatusClass(status?: string): string {
    if (!status) return 'bg-secondary';
    const normalized = status.toUpperCase();
    if (['VALIDATED', 'VALIDÉ', 'ACTIVE', 'EN COURS', 'EN_COURS', 'ACTIF'].includes(normalized)) return 'bg-success';
    if (['SOLDÉ', 'TERMINÉ'].includes(normalized)) return 'bg-secondary';
    if (['NEW', 'PENDING', 'EN ATTENTE'].includes(normalized)) return 'bg-warning text-dark';
    if (['RÉSILIÉ', 'ROMPU', 'ANNULÉ'].includes(normalized)) return 'bg-danger';
    return 'bg-secondary';
  }

  getEffectiveProgress(contract: Contract): number {
    if (!contract.totalAmount || contract.totalAmount <= 0) return 0;
    return ((contract.paidAmount ?? 0) / contract.totalAmount) * 100;
  }

  canEdit(contract: Contract): boolean {
    if (!contract.status) return true;
    const normalized = contract.status.toUpperCase();
    return !['VALIDÉ', 'VALIDATED', 'ACTIVE', 'EN COURS', 'TERMINÉ', 'SOLDÉ', 'RÉSILIÉ', 'ROMPU'].includes(normalized);
  }

  canDelete(contract: Contract): boolean {
    return this.canEdit(contract);
  }
}

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FeatherIconDirective } from '../../../../core/feather-icon/feather-icon.directive';
import { ContractService } from '../../../../core/services/contract/contract.service';
import { Contract } from '../../../../core/models/contract.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-contracts',
  standalone: true,
  imports: [CommonModule, RouterModule, FeatherIconDirective, FormsModule],
  templateUrl: './contracts.component.html',
  styleUrl: './contracts.component.scss'
})
export class ContractsComponent implements OnInit {
  MathAbs = Math.abs;
  private contractService = inject(ContractService);

  contracts: Contract[] = [];
  loading: boolean = false;

  // KPI computed properties
  get activeContractsCount(): number { return this.contracts.filter(c => c.status === 'En cours').length; }
  get lateContractsCount(): number { return this.contracts.filter(c => c.paymentStatus === 'En retard' || c.paymentStatus === 'Impayé définitif').length; }
  get closedContractsCount(): number { return this.contracts.filter(c => c.status === 'Soldé' || c.status === 'Résilié').length; }

  get maturingSoonCount(): number {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return this.contracts.filter(c => {
      if (!c.endDate) return false;
      const endDate = new Date(c.endDate);
      return c.status === 'En cours' && endDate <= thirtyDaysFromNow;
    }).length;
  }

  get incompleteDossiersCount(): number {
    return this.contracts.filter(c => c.status === 'En Attente').length;
  }

  showAdvancedFilters: boolean = false;

  toggleAdvancedFilters() {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  getRiskLevel(contract: Contract): { label: string, class: string } {
    if (contract.paymentStatus === 'Impayé définitif') return { label: 'Critique', class: 'text-danger' };
    if (contract.paymentStatus === 'En retard') return { label: 'Élevé', class: 'text-warning' };

    const paid = contract.paidAmount || 0;
    const total = contract.totalAmount || 1; // avoid div by 0
    if (paid / total > 0.5) return { label: 'Bas', class: 'text-success' };
    return { label: 'Moyen', class: 'text-info' };
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
}

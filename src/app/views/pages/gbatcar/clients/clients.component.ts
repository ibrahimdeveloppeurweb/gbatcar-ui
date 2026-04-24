import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FeatherIconDirective } from '../../../../core/feather-icon/feather-icon.directive';
import { ClientService } from '../../../../core/services/client/client.service';
import { Client } from '../../../../core/models/client.model';
import { AuthService } from '../../../../core/services/auth/auth.service';
import Swal from 'sweetalert2';
import { NgxPermissionsService, NgxPermissionsModule } from 'ngx-permissions';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, RouterModule, FeatherIconDirective, FormsModule, NgxPermissionsModule],
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.scss'
})
export class ClientsComponent implements OnInit {
  private clientService = inject(ClientService);
  private permissionsService = inject(NgxPermissionsService);
  private authService = inject(AuthService);

  clients: Client[] = [];
  loading: boolean = false;

  // KPI computed properties
  get activeCount(): number { return this.clients.filter(c => c.status === 'Dossier Approuvé' || c.status === 'En Cours de Contrat').length; }
  get lateCount(): number { return this.clients.filter(c => c.status === 'Litige / Bloqué').length; }
  get pendingCount(): number { return this.clients.filter(c => c.status === 'En attente de Validation' || c.status === 'Prospect').length; }

  // 1. Quick Filters
  quickSearchTerm: string = '';
  quickStatusFilter: string = '';

  showAdvancedFilters: boolean = false;

  toggleAdvancedFilters() {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  // 2. Advanced Filters Form State
  advSearchTerm: string = '';
  advVehicleFilter: string = '';
  advStatusFilter: string = '';
  advFinancialStatusFilter: string = '';
  advMinDelay: number | null = null;
  advMaxDelay: number | null = null;
  advMinDebt: number | null = null;
  advMaxDebt: number | null = null;
  advCountFilter: number = 20;

  // 3. (REMOVED) Applied Form State - We now query the API directly

  constructor() { }

  ngOnInit(): void {
    const permissions = this.authService.getPermissions();
    this.permissionsService.loadPermissions(permissions);
    this.loadClients();
  }

  loadClients() {
    this.loading = true;
    const rawFilters: any = {
      search: this.advSearchTerm,
      status: this.advStatusFilter,
      vehicle: this.advVehicleFilter,
      financialStatus: this.advFinancialStatusFilter,
      minDelay: this.advMinDelay,
      maxDelay: this.advMaxDelay,
      minDebt: this.advMinDebt,
      maxDebt: this.advMaxDebt,
      count: this.advCountFilter
    };

    // Remove null, undefined, and empty string values to cleanly build HttpParams
    const filters: any = {};
    Object.keys(rawFilters).forEach(key => {
      if (rawFilters[key] !== null && rawFilters[key] !== undefined && rawFilters[key] !== '') {
        filters[key] = rawFilters[key];
      }
    });

    this.clientService.getList(filters).subscribe({
      next: (res: any) => {
        this.clients = res.data || res;
        this.loading = false;
      },
      error: (err: any) => {
        this.loading = false;
        console.error('Error loading clients', err);
        Swal.fire('Erreur', 'Impossible de charger la liste des clients', 'error');
      }
    });
  }

  get filteredClients(): Client[] {
    return this.clients;
  }

  applyQuickFilters() {
    this.advSearchTerm = this.quickSearchTerm;
    this.advStatusFilter = this.quickStatusFilter;
    this.loadClients();
  }

  applyAdvancedFilters() {
    // No need for applied... properties anymore, as filtering is done by the backend
    // Sync quick filters
    this.quickSearchTerm = this.advSearchTerm;
    this.quickStatusFilter = this.advStatusFilter;
    this.loadClients();
  }

  resetFilters() {
    this.advSearchTerm = '';
    this.advVehicleFilter = '';
    this.advStatusFilter = '';
    this.advFinancialStatusFilter = '';
    this.advMinDelay = null;
    this.advMaxDelay = null;
    this.advMinDebt = null;
    this.advMaxDebt = null;
    this.advCountFilter = 20;

    this.quickSearchTerm = '';
    this.quickStatusFilter = '';

    this.applyAdvancedFilters();
  }

  deleteClient(uuid: string | undefined) {
    if (!uuid) return;
    Swal.fire({
      title: 'Êtes-vous sûr ?',
      text: "Cette action est irréversible !",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, supprimer !',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.clientService.getDelete(uuid).subscribe({
          next: () => {
            Swal.fire('Supprimé !', 'Le client a été supprimé.', 'success');
            this.loadClients();
          },
          error: (err: any) => {
            Swal.fire('Erreur', err?.error?.message || 'Erreur lors de la suppression', 'error');
          }
        });
      }
    });
  }

  hasValidatedContract(client: Client): boolean {
    const validatedStatuses = ['VALIDÉ', 'VALIDATED', 'ACTIVE', 'EN COURS', 'EN_COURS', 'TERMINÉ', 'SOLDÉ', 'PROLONGÉ'];
    return client.contracts?.some(c => validatedStatuses.includes(c.status?.toUpperCase() || '')) || false;
  }
}

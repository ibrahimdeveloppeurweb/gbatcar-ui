import { Component, OnInit, Pipe, PipeTransform, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FeatherIconDirective } from '../../../../core/feather-icon/feather-icon.directive';
import { VehicleService } from '../../../../core/services/vehicle/vehicle.service';
import { Vehicle } from '../../../../core/models/vehicle.model';
import { environment } from '../../../../../environments/environment';
import { NgxPermissionsModule, NgxPermissionsService } from 'ngx-permissions';
import { AuthService } from '../../../../core/services/auth/auth.service';
import Swal from 'sweetalert2';

/** Refresh to clear compiler cache **/

// Pipe helper to count items by property value in the template
@Pipe({ name: 'countWhere', standalone: true })
export class CountWherePipe implements PipeTransform {
  transform(items: any[], key: string, value: string): number {
    return items ? items.filter(i => i[key] === value).length : 0;
  }
}

@Component({
  selector: 'app-vehicles',
  standalone: true,
  imports: [CommonModule, RouterModule, FeatherIconDirective, FormsModule, CountWherePipe, NgxPermissionsModule],
  templateUrl: './vehicles.component.html',
  styleUrl: './vehicles.component.scss'
})
export class VehiclesComponent implements OnInit {
  private vehicleService = inject(VehicleService);
  private permissionsService = inject(NgxPermissionsService);
  private authService = inject(AuthService);

  vehicles: Vehicle[] = [];
  recompileTrigger: number = Date.now();
  loading: boolean = false;
  showAdvancedFilters: boolean = true;

  stats = {
    total: 0,
    assigned: 0,
    paymentAlert: 0,
    maintenanceAlert: 0,
    critical: 0,
    goodPayers: 0,
    soldCount: 0
  };

  // Active tab
  activeTab: string = 'all'; // 'all' | 'ok' | 'alert' | 'critical'

  // Interface Aliases for Template compatibility
  get alertCount(): number { return this.stats.paymentAlert; }
  get maintenanceAlertCount(): number { return this.stats.maintenanceAlert; }
  get goodPayersCount(): number { return this.stats.goodPayers; }
  get criticalCount(): number { return this.stats.critical; }
  get soldCount(): number { return this.stats.soldCount; }
  get filteredVehicles(): Vehicle[] { return this.vehicles; }

  // 1. Quick Filters
  quickSearchTerm: string = '';
  quickStatusFilter: string = '';

  // 2. Advanced Filters Form State
  advSearchTerm: string = '';
  advStatusFilter: string = '';
  advAssignedClient: string = '';
  advPaymentFilter: string = '';
  advYearMin: number | null = null;
  advYearMax: number | null = null;
  advMileageMin: number | null = null;
  advMileageMax: number | null = null;
  advCountFilter: number = 10; // Default to 10 as in image

  constructor() { }

  ngOnInit(): void {
    const permissions = this.authService.getPermissions();
    this.permissionsService.loadPermissions(permissions);
    this.loadDashboardStats();
    this.loadVehicles();
  }

  loadVehicles() {
    this.loading = true;
    const filters: any = {
      search: this.advSearchTerm,
      status: this.advStatusFilter,
      assignedClient: this.advAssignedClient,
      paymentStatus: this.advPaymentFilter,
      yearMin: this.advYearMin,
      yearMax: this.advYearMax,
      mileageMin: this.advMileageMin,
      mileageMax: this.advMileageMax,
      limit: this.advCountFilter
    };

    // Tab specific overrides
    if (this.activeTab === 'ok') filters.paymentStatus = 'À jour';
    if (this.activeTab === 'alert') filters.paymentStatus = 'En retard';
    if (this.activeTab === 'critical') filters.paymentStatus = 'Critique';
    if (this.activeTab === 'finished') filters.paymentStatus = 'Soldé';

    this.vehicleService.getList(filters).subscribe({
      next: (data: any) => {
        this.vehicles = (data.data || data).map((v: any) => {
          // Map backend French fields to frontend English aliases
          v.brand = v.marque;
          v.model = v.modele;
          v.licensePlate = v.immatriculation;
          v.mileage = v.kilometrage;
          v.status = v.statut;
          v.trim = v.finition;
          v.year = v.annee;
          v.gpsStatus = v.gpsStatus || 'Non installé';

          // Client mapping (Legacy singular + Fleet assignment)
          if (v.client) {
            v.assignedClient = `${v.client.firstName || ''} ${v.client.lastName || v.client.name || ''}`.trim();
          } else if (v.vehicleDemands?.length > 0 && v.vehicleDemands[0].contract?.client) {
            const cl = v.vehicleDemands[0].contract.client;
            v.assignedClient = `${cl.firstName || ''} ${cl.lastName || cl.name || ''}`.trim();
          } else {
            v.assignedClient = 'Aucun';
          }

          // Contract details aggregation
          // 1. Direct active contract (legacy Singular)
          let activeContract = v.contracts?.find((c: any) =>
            ['En cours', 'Actif', 'VALIDÉ', 'TERMINÉ', 'SOLDÉ', 'Vendu', 'Solder'].includes(c.status)
          );

          // 2. Or from fleet demands (New)
          if (!activeContract && v.vehicleDemands?.length > 0) {
            const firstDemand = v.vehicleDemands[0]; // Usually a vehicle is in one active demand
            if (firstDemand.contract) {
              activeContract = firstDemand.contract;
            }
          }

          if (activeContract) {
            // Count total vehicles in this contract for repartition (pro-rata display)
            const totalVehicles = activeContract.vehicleCount || activeContract.vehicleDemands?.reduce((acc: number, d: any) => acc + (d.quantity || 0), 0) || 1;

            // Pro-rated amounts for display on the vehicle row
            v.totalContractAmount = (activeContract.totalAmount || 0) / (totalVehicles || 1);
            v.paidAmount = (activeContract.paidAmount || 0) / (totalVehicles || 1);

            // Progress percentage is the same as the contract
            v.contractProgress = activeContract.totalAmount > 0
              ? (activeContract.paidAmount / activeContract.totalAmount) * 100
              : 0;

            v.paymentStatus = activeContract.paymentStatus || v.paymentStatus;
            v.daysLate = activeContract.daysLate || 0;
            // Fix for Redevance journalière (Divided by total vehicles for unit display)
            v.dailyRate = (activeContract.dailyRate || 0) / (totalVehicles || 1);
          } else {
            v.totalContractAmount = 0;
            v.paidAmount = 0;
            v.contractProgress = 0;
            v.dailyRate = v.prixParJour || 0;
            if (!v.paymentStatus) v.paymentStatus = '-';
          }

          return v;
        });
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  // Optimized: Use getCatalog if it already supports filters, or update getList
  // Actually, I'll update the component to use a more versatile method if I could, 
  // but looking at VehicleService, getCatalog is the one taking filters.
  // I updated the backend findCatalogByFilters to be general.

  loadDashboardStats() {
    this.vehicleService.getDashboardData().subscribe({
      next: (res: any) => {
        const kpis = res.kpis || {};
        const alerts = res.alerts || [];

        this.stats.total = kpis.total_fleet || 0;
        this.stats.assigned = kpis.active_count || 0;
        this.stats.goodPayers = kpis.good_payers || 0;
        this.stats.soldCount = kpis.sold_count || 0;

        // Map from alerts - Count UNIQUE IDs to avoid duplicates for vehicles with multiple reasons
        this.stats.paymentAlert = new Set(alerts.filter((a: any) => a.problem === 'Paiement en retard').map((a: any) => a.id)).size;
        this.stats.maintenanceAlert = new Set(alerts.filter((a: any) => a.problem?.includes('Entretien')).map((a: any) => a.id)).size;
        this.stats.critical = new Set(alerts.filter((a: any) => a.niveau === 'Critique').map((a: any) => a.id)).size;
      }
    });
  }

  toggleAdvancedFilters() {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  setTab(tab: string) {
    this.activeTab = tab;
    this.loadVehicles();
  }

  get tabLabel(): string {
    const labels: Record<string, string> = {
      all: 'Flotte GbatCar',
      ok: 'Bons Payeurs (Performants)',
      alert: 'En Alerte Paiement',
      critical: 'À Récupérer (Critique)',
      finished: 'Archives / Véhicules Soldés',
    };
    return labels[this.activeTab] || 'Flotte';
  }

  applyQuickFilters() {
    this.advSearchTerm = this.quickSearchTerm;
    this.advStatusFilter = this.quickStatusFilter;
    this.loadVehicles();
  }

  applyAdvancedFilters() {
    this.quickSearchTerm = this.advSearchTerm;
    this.quickStatusFilter = this.advStatusFilter;
    this.loadVehicles();
  }

  resetFilters() {
    this.advSearchTerm = '';
    this.advStatusFilter = '';
    this.advAssignedClient = '';
    this.advPaymentFilter = '';
    this.advYearMin = null;
    this.advYearMax = null;
    this.advMileageMin = null;
    this.advMileageMax = null;
    this.advCountFilter = 10;
    this.quickSearchTerm = '';
    this.quickStatusFilter = '';
    this.loadVehicles();
  }

  deleteVehicle(uuid: string | undefined, immatriculation: string | undefined) {
    if (!uuid || !immatriculation) return;
    Swal.fire({
      title: 'Supprimer le véhicule ?',
      text: `Êtes-vous sûr de vouloir supprimer définitivement le véhicule ${immatriculation} ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.vehicleService.getDelete(uuid).subscribe({
          next: () => {
            Swal.fire(
              'Supprimé !',
              'Le véhicule a été supprimé avec succès.',
              'success'
            );
            this.loadVehicles();
            this.loadDashboardStats();
          },
          error: (err) => {
            this.loading = false;
            Swal.fire(
              'Erreur',
              'Une erreur est survenue lors de la suppression.',
              'error'
            );
          }
        });
      }
    });
  }
}

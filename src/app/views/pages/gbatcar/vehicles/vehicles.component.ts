import { Component, OnInit, Pipe, PipeTransform, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FeatherIconDirective } from '../../../../core/feather-icon/feather-icon.directive';
import { VehicleService } from '../../../../core/services/vehicle/vehicle.service';
import { Vehicle } from '../../../../core/models/vehicle.model';
import { environment } from '../../../../../environments/environment';

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
  imports: [CommonModule, RouterModule, FeatherIconDirective, FormsModule, CountWherePipe],
  templateUrl: './vehicles.component.html',
  styleUrl: './vehicles.component.scss'
})
export class VehiclesComponent implements OnInit {
  private vehicleService = inject(VehicleService);

  vehicles: Vehicle[] = [];
  loading: boolean = false;
  showAdvancedFilters: boolean = true;

  stats = {
    total: 0,
    assigned: 0,
    paymentAlert: 0,
    maintenanceAlert: 0,
    critical: 0,
    goodPayers: 0
  };

  // Active tab
  activeTab: string = 'all'; // 'all' | 'ok' | 'alert' | 'critical'

  // Interface Aliases for Template compatibility
  get alertCount(): number { return this.stats.paymentAlert; }
  get maintenanceAlertCount(): number { return this.stats.maintenanceAlert; }
  get goodPayersCount(): number { return this.stats.goodPayers; }
  get criticalCount(): number { return this.stats.critical; }
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
            c.status === 'En cours' || c.status === 'Actif' || c.status === 'VALIDÉ'
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
        this.stats = res;
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
      ok: 'Bons Payeurs',
      alert: 'En Alerte Paiement',
      critical: 'À Récupérer (Critique)',
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
}

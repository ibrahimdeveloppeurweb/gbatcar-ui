import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FeatherIconDirective } from '../../../../core/feather-icon/feather-icon.directive';
import { MaintenanceService } from '../../../../core/services/maintenance/maintenance.service';

@Component({
  selector: 'app-maintenance',
  standalone: true,
  imports: [CommonModule, RouterModule, FeatherIconDirective, FormsModule],
  templateUrl: './maintenance.component.html',
  styleUrl: './maintenance.component.scss'
})
export class MaintenanceComponent implements OnInit {

  private maintenanceService = inject(MaintenanceService);

  maintenanceItems: any[] = [];
  loading = false;
  showAdvancedFilters: boolean = true;

  // Live API Metrics
  totalCount = 0;
  plannedCount = 0;
  inProgressCount = 0;
  totalCost = 0;

  // Quick filter (toolbar row below table title)
  quickSearchTerm: string = '';
  quickStatusFilter: string = '';

  // Advanced filter form state
  advSearchTerm: string = '';
  advStatusFilter: string = '';
  advDateMin: string = '';
  advDateMax: string = '';
  advCostMin: number | null = null;
  advCostMax: number | null = null;
  advCountFilter: number = 10;

  toggleAdvancedFilters() {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  ngOnInit(): void {
    this.fetchMetrics();
    this.loadMaintenance();
  }

  /** Fetch KPI dashboard counts from backend */
  fetchMetrics() {
    this.maintenanceService.getDashboardData().subscribe({
      next: (res: any) => {
        const data = res.data || res;
        this.totalCount = data.total || 0;
        this.plannedCount = data.planned || 0;
        this.inProgressCount = data.inProgress || 0;
        this.totalCost = data.totalCostThisMonth || 0;
      },
      error: console.error
    });
  }

  /** Build filter payload and fetch list from backend — like vehicles.loadVehicles() */
  loadMaintenance() {
    this.loading = true;
    // Build filters, stripping out null / undefined / empty to avoid '?dateMin=undefined'
    const raw: any = {
      search: this.advSearchTerm,
      status: this.advStatusFilter,
      dateMin: this.advDateMin,
      dateMax: this.advDateMax,
      costMin: this.advCostMin,
      costMax: this.advCostMax,
      limit: this.advCountFilter,
    };
    const filters: any = {};
    Object.keys(raw).forEach(k => {
      const v = raw[k];
      if (v !== null && v !== undefined && v !== '') {
        filters[k] = v;
      }
    });

    this.maintenanceService.getList(filters).subscribe({
      next: (res: any) => {
        this.maintenanceItems = res.data ?? res;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  applyQuickFilters() {
    // Sync quick bar into adv form, then re-fetch
    this.advSearchTerm = this.quickSearchTerm;
    this.advStatusFilter = this.quickStatusFilter;
    this.loadMaintenance();
  }

  applyAdvancedFilters() {
    // Sync adv form to quick bar, then re-fetch
    this.quickSearchTerm = this.advSearchTerm;
    this.quickStatusFilter = this.advStatusFilter;
    this.loadMaintenance();
  }

  resetFilters() {
    this.advSearchTerm = '';
    this.advStatusFilter = '';
    this.advDateMin = '';
    this.advDateMax = '';
    this.advCostMin = null;
    this.advCostMax = null;
    this.advCountFilter = 10;
    this.quickSearchTerm = '';
    this.quickStatusFilter = '';
    this.loadMaintenance();
  }
}

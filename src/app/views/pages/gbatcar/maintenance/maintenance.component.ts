import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MOCK_MAINTENANCE } from '../../../../core/mock/gbatcar-admin.mock';
import { FeatherIconDirective } from '../../../../core/feather-icon/feather-icon.directive';

@Component({
  selector: 'app-maintenance',
  standalone: true,
  imports: [CommonModule, RouterModule, FeatherIconDirective, FormsModule],
  templateUrl: './maintenance.component.html',
  styleUrl: './maintenance.component.scss'
})
export class MaintenanceComponent implements OnInit {

  maintenanceItems = MOCK_MAINTENANCE;

  // KPI computed properties
  get plannedCount(): number { return this.maintenanceItems.filter(m => m.status === 'Planifié').length; }
  get inProgressCount(): number { return this.maintenanceItems.filter(m => m.status === 'En cours').length; }
  get totalCost(): number { return this.maintenanceItems.reduce((sum, m) => sum + m.cost, 0); }

  showAdvancedFilters: boolean = true;

  toggleAdvancedFilters() {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  // 1. Quick Filters
  quickSearchTerm: string = '';
  quickStatusFilter: string = '';

  // 2. Advanced Filters Form State
  advSearchTerm: string = '';
  advStatusFilter: string = '';
  // We can just use the search term for provider/type for now or add specific filters if needed.
  // We will provide search across all text. Let's add Date and Cost specifically.
  advDateMin: string = '';
  advDateMax: string = '';
  advCostMin: number | null = null;
  advCostMax: number | null = null;
  advCountFilter: number = 10;

  // 3. ACTUALLY APPLIED Filters
  appliedSearchTerm: string = '';
  appliedStatusFilter: string = '';
  appliedDateMin: string = '';
  appliedDateMax: string = '';
  appliedCostMin: number | null = null;
  appliedCostMax: number | null = null;
  appliedCountFilter: number = 10;

  constructor() { }

  ngOnInit(): void { }

  get filteredMaintenance() {
    let result = this.maintenanceItems.filter(mnt => {
      // 1. Text Search (ID, Vehicle, Type, Provider)
      const searchStr = `${mnt.id} ${mnt.vehicle} ${mnt.provider} ${mnt.type}`.toLowerCase();
      const matchesSearch = !this.appliedSearchTerm || searchStr.includes(this.appliedSearchTerm.toLowerCase());

      // 2. Exact Selectors
      const matchesStatus = !this.appliedStatusFilter || mnt.status === this.appliedStatusFilter;

      // 3. Date Ranges
      const mntDate = new Date(mnt.date);
      const minDate = this.appliedDateMin ? new Date(this.appliedDateMin) : null;
      const maxDate = this.appliedDateMax ? new Date(this.appliedDateMax) : null;

      const matchesDateMin = !minDate || mntDate >= minDate;
      const matchesDateMax = !maxDate || mntDate <= maxDate;
      const matchesDate = matchesDateMin && matchesDateMax;

      // 4. Cost Range
      const matchesCostMin = this.appliedCostMin === null || mnt.cost >= this.appliedCostMin;
      const matchesCostMax = this.appliedCostMax === null || mnt.cost <= this.appliedCostMax;
      const matchesCost = matchesCostMin && matchesCostMax;

      return matchesSearch && matchesStatus && matchesDate && matchesCost;
    });

    // Apply Count Limit
    return result.slice(0, this.appliedCountFilter);
  }

  applyQuickFilters() {
    this.appliedSearchTerm = this.quickSearchTerm;
    this.appliedStatusFilter = this.quickStatusFilter;

    this.advSearchTerm = this.quickSearchTerm;
    this.advStatusFilter = this.quickStatusFilter;
  }

  applyAdvancedFilters() {
    this.appliedSearchTerm = this.advSearchTerm;
    this.appliedStatusFilter = this.advStatusFilter;
    this.appliedDateMin = this.advDateMin;
    this.appliedDateMax = this.advDateMax;
    this.appliedCostMin = this.advCostMin;
    this.appliedCostMax = this.advCostMax;
    this.appliedCountFilter = this.advCountFilter;

    this.quickSearchTerm = this.advSearchTerm;
    this.quickStatusFilter = this.advStatusFilter;
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

    this.applyAdvancedFilters();
  }
}

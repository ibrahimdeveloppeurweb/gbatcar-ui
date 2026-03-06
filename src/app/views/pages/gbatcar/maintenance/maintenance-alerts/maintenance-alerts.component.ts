import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MOCK_ALERTS } from '../../../../../core/mock/gbatcar-admin.mock';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';

@Component({
  selector: 'app-maintenance-alerts',
  standalone: true,
  imports: [CommonModule, RouterModule, FeatherIconDirective, FormsModule],
  templateUrl: './maintenance-alerts.component.html',
  styleUrl: './maintenance-alerts.component.scss'
})
export class MaintenanceAlertsComponent implements OnInit {

  alerts = MOCK_ALERTS;

  showAdvancedFilters: boolean = true;

  toggleAdvancedFilters() {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  // 1. Quick Filters
  quickSearchTerm: string = '';
  quickStatusFilter: string = '';

  // 2. Advanced Filters Form State
  advSearchTerm: string = '';
  advSeverityFilter: string = '';
  advStatusFilter: string = '';
  advDateMin: string = '';
  advDateMax: string = '';
  advCountFilter: number = 10;

  // 3. ACTUALLY APPLIED Filters
  appliedSearchTerm: string = '';
  appliedSeverityFilter: string = '';
  appliedStatusFilter: string = '';
  appliedDateMin: string = '';
  appliedDateMax: string = '';
  appliedCountFilter: number = 10;

  constructor() { }

  ngOnInit(): void { }

  get filteredAlerts() {
    let result = this.alerts.filter(alert => {
      // 1. Text Search
      const searchStr = `${alert.vehicle} ${alert.client} ${alert.type} ${alert.description}`.toLowerCase();
      const matchesSearch = !this.appliedSearchTerm || searchStr.includes(this.appliedSearchTerm.toLowerCase());

      // 2. Exact Selectors
      const matchesSeverity = !this.appliedSeverityFilter || alert.severity === this.appliedSeverityFilter;
      const matchesStatus = !this.appliedStatusFilter || alert.status === this.appliedStatusFilter;

      // 3. Date Ranges
      const alertDate = new Date(alert.date);
      const minDate = this.appliedDateMin ? new Date(this.appliedDateMin) : null;
      const maxDate = this.appliedDateMax ? new Date(this.appliedDateMax) : null;

      const matchesDateMin = !minDate || alertDate >= minDate;
      const matchesDateMax = !maxDate || alertDate <= maxDate;
      const matchesDate = matchesDateMin && matchesDateMax;

      return matchesSearch && matchesSeverity && matchesStatus && matchesDate;
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
    this.appliedSeverityFilter = this.advSeverityFilter;
    this.appliedStatusFilter = this.advStatusFilter;
    this.appliedDateMin = this.advDateMin;
    this.appliedDateMax = this.advDateMax;
    this.appliedCountFilter = this.advCountFilter;

    this.quickSearchTerm = this.advSearchTerm;
    this.quickStatusFilter = this.advStatusFilter;
  }

  resetFilters() {
    this.advSearchTerm = '';
    this.advSeverityFilter = '';
    this.advStatusFilter = '';
    this.advDateMin = '';
    this.advDateMax = '';
    this.advCountFilter = 10;

    this.quickSearchTerm = '';
    this.quickStatusFilter = '';

    this.applyAdvancedFilters();
  }
}

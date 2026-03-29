import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';
import { MaintenanceAlertService } from '../../../../../core/services/maintenance/maintenance-alert.service';

@Component({
  selector: 'app-maintenance-alerts',
  standalone: true,
  imports: [CommonModule, RouterModule, FeatherIconDirective, FormsModule],
  templateUrl: './maintenance-alerts.component.html',
  styleUrl: './maintenance-alerts.component.scss'
})
export class MaintenanceAlertsComponent implements OnInit {

  private alertService = inject(MaintenanceAlertService);
  
  alerts: any[] = [];
  loading: boolean = false;

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

  ngOnInit(): void {
    this.loadAlerts();
  }

  loadAlerts(): void {
    this.loading = true;
    this.alertService.getList().subscribe({
      next: (data: any) => {
        this.alerts = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading alerts:', err);
        this.loading = false;
      }
    });
  }

  get filteredAlerts() {
    let result = this.alerts.filter(alert => {
      // 1. Text Search
      const vehicleStr = alert.vehicle ? `${alert.vehicle.marque} ${alert.vehicle.modele} ${alert.vehicle.immatriculation}` : '';
      const clientStr = alert.client ? `${alert.client.firstName} ${alert.client.lastName} ${alert.client.name}` : '';
      const searchStr = `${vehicleStr} ${clientStr} ${alert.type} ${alert.description}`.toLowerCase();
      const matchesSearch = !this.appliedSearchTerm || searchStr.includes(this.appliedSearchTerm.toLowerCase());

      // 2. Exact Selectors
      const matchesSeverity = !this.appliedSeverityFilter || alert.severity === this.appliedSeverityFilter;
      const matchesStatus = !this.appliedStatusFilter || alert.status === this.appliedStatusFilter;

      // 3. Date Ranges
      const alertDate = alert.date ? new Date(alert.date) : null;
      const minDate = this.appliedDateMin ? new Date(this.appliedDateMin) : null;
      const maxDate = this.appliedDateMax ? new Date(this.appliedDateMax) : null;

      const matchesDateMin = !minDate || (alertDate && alertDate >= minDate);
      const matchesDateMax = !maxDate || (alertDate && alertDate <= maxDate);
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

  printAlert(alert: any) {
    window.print();
  }
}

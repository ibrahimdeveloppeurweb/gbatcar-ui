import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';
import { MaintenanceAlertService } from '../../../../../core/services/maintenance/maintenance-alert.service';
import { NgxPermissionsModule, NgxPermissionsService } from 'ngx-permissions';
import { AuthService } from '../../../../../core/services/auth/auth.service';

@Component({
  selector: 'app-maintenance-alerts',
  standalone: true,
  imports: [CommonModule, RouterModule, FeatherIconDirective, FormsModule, NgxPermissionsModule],
  templateUrl: './maintenance-alerts.component.html',
  styleUrl: './maintenance-alerts.component.scss'
})
export class MaintenanceAlertsComponent implements OnInit {

  private alertService = inject(MaintenanceAlertService);
  private permissionsService = inject(NgxPermissionsService);
  private authService = inject(AuthService);

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
    const permissions = this.authService.getPermissions();
    this.permissionsService.loadPermissions(permissions);
    this.loadAlerts();
  }

  loadAlerts(): void {
    this.loading = true;
    const raw: any = {
      search: this.advSearchTerm,
      severity: this.advSeverityFilter,
      status: this.advStatusFilter,
      dateMin: this.advDateMin,
      dateMax: this.advDateMax,
      limit: this.advCountFilter,
    };

    const filters: any = {};
    Object.keys(raw).forEach(k => {
      const v = raw[k];
      if (v !== null && v !== undefined && v !== '') {
        filters[k] = v;
      }
    });

    this.alertService.getList(filters).subscribe({
      next: (data: any) => {
        this.alerts = data.data || data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading alerts:', err);
        this.loading = false;
      }
    });
  }

  get filteredAlerts() {
    return this.alerts;
  }

  applyQuickFilters() {
    this.advSearchTerm = this.quickSearchTerm;
    this.advStatusFilter = this.quickStatusFilter;
    this.loadAlerts();
  }

  applyAdvancedFilters() {
    this.quickSearchTerm = this.advSearchTerm;
    this.quickStatusFilter = this.advStatusFilter;
    this.loadAlerts();
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

    this.loadAlerts();
  }

  printAlert(alert: any) {
    window.print();
  }
}

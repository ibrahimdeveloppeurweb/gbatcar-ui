import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MOCK_CLIENTS } from '../../../../core/mock/gbatcar-admin.mock';
import { FeatherIconDirective } from '../../../../core/feather-icon/feather-icon.directive';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, RouterModule, FeatherIconDirective, FormsModule],
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.scss'
})
export class ClientsComponent implements OnInit {
  clients = MOCK_CLIENTS;

  // KPI computed properties
  get activeCount(): number { return this.clients.filter(c => c.status === 'Actif').length; }
  get lateCount(): number { return this.clients.filter(c => c.status === 'Actif (Retard)').length; }
  get pendingCount(): number { return this.clients.filter(c => c.status === 'En Attente Validation').length; }

  // 1. Quick Filters (Inside table header)
  quickSearchTerm: string = '';
  quickStatusFilter: string = '';

  showAdvancedFilters: boolean = true;

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
  advCountFilter: number = 10;

  // 3. ACTUALLY APPLIED Filters (Used by the getter)
  appliedSearchTerm: string = '';
  appliedStatusFilter: string = '';
  appliedVehicleFilter: string = '';
  appliedFinancialStatusFilter: string = '';
  appliedMinDelay: number | null = null;
  appliedMaxDelay: number | null = null;
  appliedMinDebt: number | null = null;
  appliedMaxDebt: number | null = null;
  appliedCountFilter: number = 10;

  constructor() { }

  ngOnInit(): void { }

  get filteredClients() {
    let result = this.clients.filter(client => {
      // 1. Text Search
      const searchLower = this.appliedSearchTerm.toLowerCase();
      const matchesSearch = !this.appliedSearchTerm ||
        client.name.toLowerCase().includes(searchLower) ||
        client.id.toLowerCase().includes(searchLower) ||
        client.phone.includes(this.appliedSearchTerm) ||
        client.email.toLowerCase().includes(searchLower);

      // 2. Exact Match Selectors
      const matchesStatus = !this.appliedStatusFilter || client.status === this.appliedStatusFilter;
      const matchesVehicle = !this.appliedVehicleFilter || client.vehicle.toLowerCase().includes(this.appliedVehicleFilter.toLowerCase());

      // Financial Status Logic
      let matchesFinancialStatus = true;
      if (this.appliedFinancialStatusFilter) {
        if (this.appliedFinancialStatusFilter === 'À jour / Soldé') {
          matchesFinancialStatus = client.paymentStatus === 'À jour' || client.paymentStatus === 'Soldé';
        } else if (this.appliedFinancialStatusFilter === 'Impayé') {
          matchesFinancialStatus = client.paymentStatus.includes('Impayé');
        } else if (this.appliedFinancialStatusFilter === 'Aucun (En Attente)') {
          matchesFinancialStatus = client.paymentStatus === '-';
        } else {
          matchesFinancialStatus = client.paymentStatus === this.appliedFinancialStatusFilter;
        }
      }

      // 3. Range Filters
      let matchesDelay = true;
      if (this.appliedMinDelay !== null || this.appliedMaxDelay !== null) {
        let delayDays = 0;
        const delayMatch = client.paymentStatus.match(/\((\d+) jours\)/);
        if (delayMatch) {
          delayDays = parseInt(delayMatch[1], 10);
        } else if (client.paymentStatus.includes('Impayé')) {
          delayDays = 1;
        }

        const minMatch = this.appliedMinDelay === null || delayDays >= this.appliedMinDelay;
        const maxMatch = this.appliedMaxDelay === null || delayDays <= this.appliedMaxDelay;
        matchesDelay = minMatch && maxMatch;
      }

      // 4. Debt Filter
      let matchesDebt = true;
      if (this.appliedMinDebt !== null || this.appliedMaxDebt !== null) {
        let mockDebt = 0;
        if (client.paymentStatus.includes('Impayé')) mockDebt = 50000;
        else mockDebt = 0;

        const minMatch = this.appliedMinDebt === null || mockDebt >= this.appliedMinDebt;
        const maxMatch = this.appliedMaxDebt === null || mockDebt <= this.appliedMaxDebt;
        matchesDebt = minMatch && maxMatch;
      }

      return matchesSearch && matchesStatus && matchesVehicle && matchesFinancialStatus && matchesDelay && matchesDebt;
    });

    // Apply Count Limit
    return result.slice(0, this.appliedCountFilter);
  }

  applyQuickFilters() {
    this.appliedSearchTerm = this.quickSearchTerm;
    this.appliedStatusFilter = this.quickStatusFilter;

    // Sync advanced form so it matches
    this.advSearchTerm = this.quickSearchTerm;
    this.advStatusFilter = this.quickStatusFilter;
  }

  applyAdvancedFilters() {
    this.appliedSearchTerm = this.advSearchTerm;
    this.appliedStatusFilter = this.advStatusFilter;
    this.appliedVehicleFilter = this.advVehicleFilter;
    this.appliedFinancialStatusFilter = this.advFinancialStatusFilter;
    this.appliedMinDelay = this.advMinDelay;
    this.appliedMaxDelay = this.advMaxDelay;
    this.appliedMinDebt = this.advMinDebt;
    this.appliedMaxDebt = this.advMaxDebt;
    this.appliedCountFilter = this.advCountFilter;

    // Sync quick filters so they match
    this.quickSearchTerm = this.advSearchTerm;
    this.quickStatusFilter = this.advStatusFilter;
  }

  resetFilters() {
    // Reset Advanced Form
    this.advSearchTerm = '';
    this.advVehicleFilter = '';
    this.advStatusFilter = '';
    this.advFinancialStatusFilter = '';
    this.advMinDelay = null;
    this.advMaxDelay = null;
    this.advMinDebt = null;
    this.advMaxDebt = null;
    this.advCountFilter = 10;

    // Reset Quick Filters
    this.quickSearchTerm = '';
    this.quickStatusFilter = '';

    // Apply empty filters
    this.applyAdvancedFilters();
  }
}

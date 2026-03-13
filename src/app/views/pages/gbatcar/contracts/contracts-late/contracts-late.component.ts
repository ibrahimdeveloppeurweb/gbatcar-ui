import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MOCK_CONTRACTS } from '../../../../../core/mock/gbatcar-admin.mock';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';

@Component({
  selector: 'app-contracts-late',
  standalone: true,
  imports: [CommonModule, RouterModule, FeatherIconDirective, FormsModule],
  templateUrl: './contracts-late.component.html',
  styleUrl: './contracts-late.component.scss'
})
export class ContractsLateComponent implements OnInit {

  contracts = MOCK_CONTRACTS.filter(c => c.paymentStatus === 'En retard' || c.paymentStatus === 'Impayé définitif');

  // Recovery KPIs
  get totalArrears(): number {
    return this.contracts.reduce((sum, c) => sum + (c.totalAmount - c.paidAmount), 0);
  }

  get criticalCasesCount(): number {
    return this.contracts.filter(c => c.paymentStatus === 'Impayé définitif').length;
  }

  get promiseToPayCount(): number {
    // Simulation: 20% of late contracts have a promise
    return Math.ceil(this.contracts.length * 0.2);
  }

  showAdvancedFilters: boolean = false;

  toggleAdvancedFilters() {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  // Aging Balance Logic
  getAgingSegment(contract: any): string {
    const days = this.calculateLateDays(contract.id);
    if (days > 30) return '30j+';
    if (days > 15) return '16-30j';
    if (days > 7) return '8-15j';
    return '1-7j';
  }

  // 1. Quick Filters
  quickSearchTerm: string = '';
  quickAlertFilter: string = '';

  // 2. Advanced Filters Form State
  advSearchTerm: string = '';
  advAlertFilter: string = '';
  advCountFilter: number = 10;

  // 3. ACTUALLY APPLIED Filters
  appliedSearchTerm: string = '';
  appliedAlertFilter: string = '';
  appliedCountFilter: number = 10;

  constructor() { }

  ngOnInit(): void { }

  get filteredContracts() {
    let result = this.contracts.filter(contract => {
      // 1. Text Search
      const searchStr = `${contract.id} ${contract.clientName} ${contract.vehicle} ${contract.clientId}`.toLowerCase();
      const matchesSearch = !this.appliedSearchTerm || searchStr.includes(this.appliedSearchTerm.toLowerCase());

      // 2. Alert Level (Risque Modéré = En retard, Critique = Impayé définitif)
      let matchesAlert = true;
      if (this.appliedAlertFilter) {
        const expectedStatus = this.appliedAlertFilter === 'Risque Modéré' ? 'En retard' : 'Impayé définitif';
        matchesAlert = contract.paymentStatus === expectedStatus;
      }

      return matchesSearch && matchesAlert;
    });

    // Apply Count Limit
    return result.slice(0, this.appliedCountFilter);
  }

  applyQuickFilters() {
    this.appliedSearchTerm = this.quickSearchTerm;
    this.appliedAlertFilter = this.quickAlertFilter;

    this.advSearchTerm = this.quickSearchTerm;
    this.advAlertFilter = this.quickAlertFilter;
  }

  applyAdvancedFilters() {
    this.appliedSearchTerm = this.advSearchTerm;
    this.appliedAlertFilter = this.advAlertFilter;
    this.appliedCountFilter = this.advCountFilter;

    this.quickSearchTerm = this.advSearchTerm;
    this.quickAlertFilter = this.advAlertFilter;
  }

  resetFilters() {
    this.advSearchTerm = '';
    this.advAlertFilter = '';
    this.advCountFilter = 10;

    this.quickSearchTerm = '';
    this.quickAlertFilter = '';

    this.applyAdvancedFilters();
  }

  calculateLateDays(contractId: string = ''): number {
    // Deterministic simulation based on ID for consistency in UI
    if (contractId.includes('002')) return 5;
    if (contractId.includes('045')) return 45;
    return 12;
  }
}

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

  showAdvancedFilters: boolean = true;

  toggleAdvancedFilters() {
    this.showAdvancedFilters = !this.showAdvancedFilters;
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

  calculateLateDays(): number {
    return Math.floor(Math.random() * 20) + 1; // Simulation du nombre de jours de retard
  }
}

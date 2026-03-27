import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ContractService } from '../../../../../core/services/contract/contract.service';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';

@Component({
  selector: 'app-contracts-late',
  standalone: true,
  imports: [CommonModule, RouterModule, FeatherIconDirective, FormsModule],
  templateUrl: './contracts-late.component.html',
  styleUrl: './contracts-late.component.scss'
})
export class ContractsLateComponent implements OnInit {

  contracts: any[] = [];
  kpis: any = {
    totalArrears: 0,
    criticalCasesCount: 0,
    promiseToPayCount: 0
  };

  loading: boolean = false;

  // 1. Quick Filters
  quickSearchTerm: string = '';
  quickAlertFilter: string = '';

  // 2. Advanced Filters Form State
  advSearchTerm: string = '';
  advAlertFilter: string = '';
  advCountFilter: number = 20;

  // 3. ACTUALLY APPLIED Filters
  appliedSearchTerm: string = '';
  appliedAlertFilter: string = '';
  appliedCountFilter: number = 20;

  showAdvancedFilters: boolean = false;

  constructor(private contractService: ContractService) { }

  ngOnInit(): void {
    this.loadLateContracts();
  }

  loadLateContracts() {
    this.loading = true;
    const filters = {
      count: this.appliedCountFilter,
      search: this.appliedSearchTerm
    };

    this.contractService.getLateContracts(filters).subscribe({
      next: (res: any) => {
        // Backend returns { kpis: {...}, contracts: [...] }
        this.contracts = res.contracts || [];
        this.kpis = res.kpis || this.kpis;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading late contracts', err);
        this.loading = false;
      }
    });
  }

  // Recovery KPIs
  get totalArrears(): number {
    return this.kpis.totalArrears;
  }

  get criticalCasesCount(): number {
    return this.kpis.criticalCasesCount;
  }

  get promiseToPayCount(): number {
    return this.kpis.promiseToPayCount;
  }

  toggleAdvancedFilters() {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  // Aging Balance Logic
  getAgingSegment(contract: any): string {
    const days = this.getLateDays(contract);
    if (days > 30) return '30j+';
    if (days > 15) return '16-30j';
    if (days > 7) return '8-15j';
    return '1-7j';
  }

  getLateDays(contract: any): number {
    return contract.riskAnalysis?.dpd || 0;
  }

  get filteredContracts() {
    // We already have filtered contracts from backend, but we can do a secondary local filter for alert level if needed
    // or if the backend adds support for it. Currently, we'll keep the local alert filter for the UI feel.
    return this.contracts.filter(contract => {
      let matchesAlert = true;
      if (this.appliedAlertFilter) {
        matchesAlert = contract.riskAnalysis?.level === (this.appliedAlertFilter === 'Risque Modéré' ? 'ÉLEVÉ' : 'CRITIQUE');
      }
      return matchesAlert;
    });
  }

  applyQuickFilters() {
    this.appliedSearchTerm = this.quickSearchTerm;
    this.appliedAlertFilter = this.quickAlertFilter;

    this.advSearchTerm = this.quickSearchTerm;
    this.advAlertFilter = this.quickAlertFilter;

    this.loadLateContracts();
  }

  applyAdvancedFilters() {
    this.appliedSearchTerm = this.advSearchTerm;
    this.appliedAlertFilter = this.advAlertFilter;
    this.appliedCountFilter = this.advCountFilter;

    this.quickSearchTerm = this.advSearchTerm;
    this.quickAlertFilter = this.advAlertFilter;

    this.loadLateContracts();
  }

  resetFilters() {
    this.advSearchTerm = '';
    this.advAlertFilter = '';
    this.advCountFilter = 20;

    this.quickSearchTerm = '';
    this.quickAlertFilter = '';

    this.applyAdvancedFilters();
  }
}

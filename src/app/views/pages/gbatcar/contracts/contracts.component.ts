import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MOCK_CONTRACTS } from '../../../../core/mock/gbatcar-admin.mock';
import { FeatherIconDirective } from '../../../../core/feather-icon/feather-icon.directive';

@Component({
  selector: 'app-contracts',
  standalone: true,
  imports: [CommonModule, RouterModule, FeatherIconDirective, FormsModule],
  templateUrl: './contracts.component.html',
  styleUrl: './contracts.component.scss'
})
export class ContractsComponent implements OnInit {

  contracts = MOCK_CONTRACTS;

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
  advPaymentStatusFilter: string = '';
  advStartDateMin: string = '';
  advStartDateMax: string = '';
  advProgressMin: number | null = null;
  advProgressMax: number | null = null;
  advCountFilter: number = 10;

  // 3. ACTUALLY APPLIED Filters
  appliedSearchTerm: string = '';
  appliedStatusFilter: string = '';
  appliedPaymentStatusFilter: string = '';
  appliedStartDateMin: string = '';
  appliedStartDateMax: string = '';
  appliedProgressMin: number | null = null;
  appliedProgressMax: number | null = null;
  appliedCountFilter: number = 10;

  constructor() { }

  ngOnInit(): void { }

  get filteredContracts() {
    let result = this.contracts.filter(contract => {
      // 1. Text Search
      const searchStr = `${contract.id} ${contract.clientName} ${contract.vehicle} ${contract.clientId}`.toLowerCase();
      const matchesSearch = !this.appliedSearchTerm || searchStr.includes(this.appliedSearchTerm.toLowerCase());

      // 2. Exact Selectors
      const matchesStatus = !this.appliedStatusFilter || contract.status === this.appliedStatusFilter;
      const matchesPaymentStatus = !this.appliedPaymentStatusFilter || contract.paymentStatus === this.appliedPaymentStatusFilter;

      // 3. Date Ranges (Start Date)
      const contractDate = new Date(contract.startDate);
      const minDate = this.appliedStartDateMin ? new Date(this.appliedStartDateMin) : null;
      const maxDate = this.appliedStartDateMax ? new Date(this.appliedStartDateMax) : null;

      const matchesStartDateMin = !minDate || contractDate >= minDate;
      const matchesStartDateMax = !maxDate || contractDate <= maxDate;
      const matchesDate = matchesStartDateMin && matchesStartDateMax;

      // 4. Progress Range (%)
      const progressPercent = contract.totalAmount > 0 ? (contract.paidAmount / contract.totalAmount) * 100 : 0;
      const matchesProgressMin = this.appliedProgressMin === null || progressPercent >= this.appliedProgressMin;
      const matchesProgressMax = this.appliedProgressMax === null || progressPercent <= this.appliedProgressMax;
      const matchesProgress = matchesProgressMin && matchesProgressMax;

      return matchesSearch && matchesStatus && matchesPaymentStatus && matchesDate && matchesProgress;
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
    this.appliedPaymentStatusFilter = this.advPaymentStatusFilter;
    this.appliedStartDateMin = this.advStartDateMin;
    this.appliedStartDateMax = this.advStartDateMax;
    this.appliedProgressMin = this.advProgressMin;
    this.appliedProgressMax = this.advProgressMax;
    this.appliedCountFilter = this.advCountFilter;

    this.quickSearchTerm = this.advSearchTerm;
    this.quickStatusFilter = this.advStatusFilter;
  }

  resetFilters() {
    this.advSearchTerm = '';
    this.advStatusFilter = '';
    this.advPaymentStatusFilter = '';
    this.advStartDateMin = '';
    this.advStartDateMax = '';
    this.advProgressMin = null;
    this.advProgressMax = null;
    this.advCountFilter = 10;

    this.quickSearchTerm = '';
    this.quickStatusFilter = '';

    this.applyAdvancedFilters();
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MOCK_PAYMENTS } from '../../../../core/mock/gbatcar-admin.mock';
import { FeatherIconDirective } from '../../../../core/feather-icon/feather-icon.directive';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, RouterModule, FeatherIconDirective, FormsModule],
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.scss'
})
export class PaymentsComponent implements OnInit {

  payments = MOCK_PAYMENTS;

  // KPI computed properties (dynamic, from data)
  get totalValidated(): number {
    return this.payments.filter(p => p.status === 'Validé').reduce((sum, p) => sum + p.amount, 0);
  }
  get pendingPaymentsTotal(): number {
    return this.payments.filter(p => p.status === 'En attente').reduce((sum, p) => sum + p.amount, 0);
  }
  get pendingPaymentsCount(): number {
    return this.payments.filter(p => p.status === 'En attente').length;
  }
  get dominantMethod(): string {
    const counts: Record<string, number> = {};
    this.payments.forEach(p => { counts[p.method] = (counts[p.method] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A';
  }
  get dominantMethodPercent(): number {
    const total = this.payments.length;
    if (total === 0) return 0;
    const counts: Record<string, number> = {};
    this.payments.forEach(p => { counts[p.method] = (counts[p.method] || 0) + 1; });
    const max = Math.max(...Object.values(counts));
    return Math.round((max / total) * 100);
  }

  showAdvancedFilters: boolean = true;

  toggleAdvancedFilters() {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }


  // 1. Quick Filters
  quickSearchTerm: string = '';
  quickMethodFilter: string = '';

  // 2. Advanced Filters Form State
  advSearchTerm: string = '';
  advMethodFilter: string = '';
  advStatusFilter: string = '';
  advDateMin: string = '';
  advDateMax: string = '';
  advAmountMin: number | null = null;
  advAmountMax: number | null = null;
  advCountFilter: number = 10;

  // 3. ACTUALLY APPLIED Filters
  appliedSearchTerm: string = '';
  appliedMethodFilter: string = '';
  appliedStatusFilter: string = '';
  appliedDateMin: string = '';
  appliedDateMax: string = '';
  appliedAmountMin: number | null = null;
  appliedAmountMax: number | null = null;
  appliedCountFilter: number = 10;

  constructor() { }

  ngOnInit(): void { }

  get filteredPayments() {
    let result = this.payments.filter(payment => {
      // 1. Text Search
      const searchStr = `${payment.id} ${payment.client} ${payment.reference} ${payment.contractId}`.toLowerCase();
      const matchesSearch = !this.appliedSearchTerm || searchStr.includes(this.appliedSearchTerm.toLowerCase());

      // 2. Exact Selectors
      const matchesMethod = !this.appliedMethodFilter || payment.method.includes(this.appliedMethodFilter);
      const matchesStatus = !this.appliedStatusFilter || payment.status === this.appliedStatusFilter;

      // 3. Date Ranges
      const paymentDate = new Date(payment.date);
      const minDate = this.appliedDateMin ? new Date(this.appliedDateMin) : null;
      const maxDate = this.appliedDateMax ? new Date(this.appliedDateMax) : null;

      const matchesDateMin = !minDate || paymentDate >= minDate;
      const matchesDateMax = !maxDate || paymentDate <= maxDate;
      const matchesDate = matchesDateMin && matchesDateMax;

      // 4. Amount Range
      const matchesAmountMin = this.appliedAmountMin === null || payment.amount >= this.appliedAmountMin;
      const matchesAmountMax = this.appliedAmountMax === null || payment.amount <= this.appliedAmountMax;
      const matchesAmount = matchesAmountMin && matchesAmountMax;

      return matchesSearch && matchesMethod && matchesStatus && matchesDate && matchesAmount;
    });

    // Apply Count Limit
    return result.slice(0, this.appliedCountFilter);
  }

  applyQuickFilters() {
    this.appliedSearchTerm = this.quickSearchTerm;
    this.appliedMethodFilter = this.quickMethodFilter;

    this.advSearchTerm = this.quickSearchTerm;
    this.advMethodFilter = this.quickMethodFilter;
  }

  applyAdvancedFilters() {
    this.appliedSearchTerm = this.advSearchTerm;
    this.appliedMethodFilter = this.advMethodFilter;
    this.appliedStatusFilter = this.advStatusFilter;
    this.appliedDateMin = this.advDateMin;
    this.appliedDateMax = this.advDateMax;
    this.appliedAmountMin = this.advAmountMin;
    this.appliedAmountMax = this.advAmountMax;
    this.appliedCountFilter = this.advCountFilter;

    this.quickSearchTerm = this.advSearchTerm;
    this.quickMethodFilter = this.advMethodFilter;
  }

  resetFilters() {
    this.advSearchTerm = '';
    this.advMethodFilter = '';
    this.advStatusFilter = '';
    this.advDateMin = '';
    this.advDateMax = '';
    this.advAmountMin = null;
    this.advAmountMax = null;
    this.advCountFilter = 10;

    this.quickSearchTerm = '';
    this.quickMethodFilter = '';

    this.applyAdvancedFilters();
  }
}

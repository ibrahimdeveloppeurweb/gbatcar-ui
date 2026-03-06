import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MOCK_PENALTIES } from '../../../../../core/mock/gbatcar-admin.mock';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';

@Component({
  selector: 'app-penalties',
  standalone: true,
  imports: [CommonModule, RouterModule, FeatherIconDirective, FormsModule],
  templateUrl: './penalties.component.html',
  styleUrl: './penalties.component.scss'
})
export class PenaltiesComponent implements OnInit {

  penalties = MOCK_PENALTIES;

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
  advAmountMin: number | null = null;
  advAmountMax: number | null = null;
  advCountFilter: number = 10;

  // 3. ACTUALLY APPLIED Filters
  appliedSearchTerm: string = '';
  appliedSeverityFilter: string = '';
  appliedStatusFilter: string = '';
  appliedDateMin: string = '';
  appliedDateMax: string = '';
  appliedAmountMin: number | null = null;
  appliedAmountMax: number | null = null;
  appliedCountFilter: number = 10;

  constructor() { }

  ngOnInit(): void { }

  get filteredPenalties() {
    let result = this.penalties.filter(penalty => {
      // 1. Text Search
      const searchStr = `${penalty.client} ${penalty.reason} ${penalty.id}`.toLowerCase();
      const matchesSearch = !this.appliedSearchTerm || searchStr.includes(this.appliedSearchTerm.toLowerCase());

      // 2. Exact Selectors
      const matchesSeverity = !this.appliedSeverityFilter || penalty.severity === this.appliedSeverityFilter;
      const matchesStatus = !this.appliedStatusFilter || penalty.status === this.appliedStatusFilter;

      // 3. Date Ranges
      const penaltyDate = new Date(penalty.date);
      const minDate = this.appliedDateMin ? new Date(this.appliedDateMin) : null;
      const maxDate = this.appliedDateMax ? new Date(this.appliedDateMax) : null;

      const matchesDateMin = !minDate || penaltyDate >= minDate;
      const matchesDateMax = !maxDate || penaltyDate <= maxDate;
      const matchesDate = matchesDateMin && matchesDateMax;

      // 4. Amount Range
      const matchesAmountMin = this.appliedAmountMin === null || penalty.amount >= this.appliedAmountMin;
      const matchesAmountMax = this.appliedAmountMax === null || penalty.amount <= this.appliedAmountMax;
      const matchesAmount = matchesAmountMin && matchesAmountMax;

      return matchesSearch && matchesSeverity && matchesStatus && matchesDate && matchesAmount;
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
    this.appliedAmountMin = this.advAmountMin;
    this.appliedAmountMax = this.advAmountMax;
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
    this.advAmountMin = null;
    this.advAmountMax = null;
    this.advCountFilter = 10;

    this.quickSearchTerm = '';
    this.quickStatusFilter = '';

    this.applyAdvancedFilters();
  }
}

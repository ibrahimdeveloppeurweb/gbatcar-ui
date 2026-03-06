import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';
import { MOCK_CATALOG } from '../../../../../core/mock/gbatcar-catalog.mock';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, RouterModule, FeatherIconDirective, FormsModule],
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.scss'
})
export class CatalogComponent implements OnInit {

  catalogItems = MOCK_CATALOG;
  // 1. Quick Filters
  quickSearchTerm: string = '';
  quickStatusFilter: string = '';

  // 2. Advanced Filters Form State
  advSearchTerm: string = '';
  advStatusFilter: string = '';
  advYearMin: number | null = null;
  advYearMax: number | null = null;
  advPriceMin: number | null = null;
  advPriceMax: number | null = null;

  // 3. ACTUALLY APPLIED Filters
  appliedSearchTerm: string = '';
  appliedStatusFilter: string = '';
  appliedYearMin: number | null = null;
  appliedYearMax: number | null = null;
  appliedPriceMin: number | null = null;
  appliedPriceMax: number | null = null;

  showAdvancedFilters: boolean = true;

  constructor() { }

  ngOnInit(): void {
  }

  toggleAdvancedFilters() {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  get filteredCatalog() {
    return this.catalogItems.filter(item => {
      // 1. Text Search
      const searchStr = `${item.brand} ${item.model} ${item.year}`.toLowerCase();
      const matchSearch = !this.appliedSearchTerm || searchStr.includes(this.appliedSearchTerm.toLowerCase());

      // 2. Status
      const matchStatus = !this.appliedStatusFilter || item.status === this.appliedStatusFilter;

      // 3. Range: Year
      const matchYearMin = this.appliedYearMin === null || item.year >= this.appliedYearMin;
      const matchYearMax = this.appliedYearMax === null || item.year <= this.appliedYearMax;
      const matchYear = matchYearMin && matchYearMax;

      // 4. Range: Price
      const matchPriceMin = this.appliedPriceMin === null || item.commercialOffer.totalPrice >= this.appliedPriceMin;
      const matchPriceMax = this.appliedPriceMax === null || item.commercialOffer.totalPrice <= this.appliedPriceMax;
      const matchPrice = matchPriceMin && matchPriceMax;

      return matchSearch && matchStatus && matchYear && matchPrice;
    });
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
    this.appliedYearMin = this.advYearMin;
    this.appliedYearMax = this.advYearMax;
    this.appliedPriceMin = this.advPriceMin;
    this.appliedPriceMax = this.advPriceMax;

    this.quickSearchTerm = this.advSearchTerm;
    this.quickStatusFilter = this.advStatusFilter;
  }

  resetFilters() {
    this.advSearchTerm = '';
    this.advStatusFilter = '';
    this.advYearMin = null;
    this.advYearMax = null;
    this.advPriceMin = null;
    this.advPriceMax = null;

    this.quickSearchTerm = '';
    this.quickStatusFilter = '';

    this.applyAdvancedFilters();
  }

  calculateDeposit(totalPrice: number, percentage: number): number {
    return (totalPrice * percentage) / 100;
  }

  calculateMonthlyPayment(totalPrice: number, deposit: number, months: number): number {
    return (totalPrice - deposit) / months;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR').format(Math.round(amount)) + ' FCFA';
  }
}

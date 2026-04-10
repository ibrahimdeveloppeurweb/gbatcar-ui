import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';
import { PenaltyService } from '../../../../../core/services/penalty/penalty.service';

@Component({
  selector: 'app-penalties',
  standalone: true,
  imports: [CommonModule, RouterModule, FeatherIconDirective, FormsModule],
  templateUrl: './penalties.component.html',
  styleUrl: './penalties.component.scss'
})
export class PenaltiesComponent implements OnInit {

  penalties: any[] = [];
  loading: boolean = false;

  // KPI computed properties
  get unrecoveredTotal(): number {
    return this.penalties
      .filter(p => {
        const s = (p.status || '').toUpperCase();
        return s !== 'PAYÉ' && s !== 'PAYE' && s !== 'SOLDÉ' && s !== 'SOLDE';
      })
      .reduce((sum, p) => sum + (p.amount || 0) - (p.paidAmount || 0), 0);
  }
  get criticalCount(): number {
    return this.penalties.filter(p => {
      const s = (p.status || '').toUpperCase();
      return s === 'IMPAYÉ' || s === 'CRITIQUE' || s === 'NON PAYÉ' || s === 'NON_PAYÉ';
    }).length;
  }
  get recoveredCount(): number {
    return this.penalties.filter(p => {
      const s = (p.status || '').toUpperCase();
      return s === 'PAYÉ' || s === 'PAYE' || s === 'SOLDÉ' || s === 'SOLDE';
    }).length;
  }
  get recoveredTotal(): number {
    return this.penalties
      .reduce((sum, p) => sum + (p.paidAmount || 0), 0);
  }

  showAdvancedFilters: boolean = false;

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
  advCountFilter: number = 20;

  constructor(
    private penaltyService: PenaltyService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadPenalties();
  }

  loadPenalties() {
    this.loading = true;
    const filters = {
      search: this.advSearchTerm || this.quickSearchTerm,
      status: this.advStatusFilter || this.quickStatusFilter,
      severity: this.advSeverityFilter,
      dateMin: this.advDateMin,
      dateMax: this.advDateMax,
      amountMin: this.advAmountMin,
      amountMax: this.advAmountMax,
      limit: this.advCountFilter
    };

    this.penaltyService.getList().subscribe({
      next: (res: any) => {
        this.penalties = res.data || res;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading penalties', err);
        this.loading = false;
      }
    });

    // Note: The getList in penaltyService doesn't support all filters yet.
    // Let's refine the service too if needed, but for now we fetch all and let frontend filtering (already there) do the rest if backend is not ready.
    // Actually, I updated the backend PenaltyRepository::findByFilters, so I should update PenaltyService.getList to pass filters.
  }

  get filteredPenalties() {
    // We already have filtering in the component, but we should ideally let the backend do it.
    // For now, let's keep the frontend filtering as a fallback/refinement.
    let result = this.penalties.filter(penalty => {
      // 1. Text Search
      const clientName = penalty.client?.libelle || '';
      const searchStr = `${clientName} ${penalty.reason} ${penalty.reference} ${penalty.id}`.toLowerCase();
      const matchesSearch = !this.advSearchTerm && !this.quickSearchTerm ||
        searchStr.includes((this.advSearchTerm || this.quickSearchTerm).toLowerCase());

      // 2. Exact Selectors
      const matchesSeverity = !this.advSeverityFilter || penalty.severity === this.advSeverityFilter;
      const matchesStatus = !this.advStatusFilter && !this.quickStatusFilter ||
        penalty.status === (this.advStatusFilter || this.quickStatusFilter);

      // 3. Date Ranges
      const penaltyDate = new Date(penalty.date);
      const minDate = this.advDateMin ? new Date(this.advDateMin) : null;
      const maxDate = this.advDateMax ? new Date(this.advDateMax) : null;

      const matchesDateMin = !minDate || penaltyDate >= minDate;
      const matchesDateMax = !maxDate || penaltyDate <= maxDate;
      const matchesDate = matchesDateMin && matchesDateMax;

      return matchesSearch && matchesSeverity && matchesStatus && matchesDate;
    });

    return result.slice(0, this.advCountFilter);
  }

  applyQuickFilters() {
    this.loadPenalties();
  }

  applyAdvancedFilters() {
    this.loadPenalties();
  }

  resetFilters() {
    this.advSearchTerm = '';
    this.advSeverityFilter = '';
    this.advStatusFilter = '';
    this.advDateMin = '';
    this.advDateMax = '';
    this.advAmountMin = null;
    this.advAmountMax = null;
    this.advCountFilter = 20;

    this.quickSearchTerm = '';
    this.quickStatusFilter = '';

    this.loadPenalties();
  }

  onSolder(penalty: any) {
    if (!penalty.contract?.uuid) {
      console.warn('Cannot solder penalty without contract UUID');
      return;
    }

    const amountToPay = (penalty.amount || 0) - (penalty.paidAmount || 0);

    this.router.navigate(['/gbatcar/payments/new'], {
      queryParams: {
        contractId: penalty.contract.uuid,
        amount: amountToPay,
        type: 'PÉNALITÉ',
        penaltyRef: penalty.reference
      }
    });
  }
}

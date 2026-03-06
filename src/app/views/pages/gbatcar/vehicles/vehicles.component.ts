import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MOCK_VEHICLES } from '../../../../core/mock/gbatcar-admin.mock';
import { FeatherIconDirective } from '../../../../core/feather-icon/feather-icon.directive';

@Component({
  selector: 'app-vehicles',
  standalone: true,
  imports: [CommonModule, RouterModule, FeatherIconDirective, FormsModule],
  templateUrl: './vehicles.component.html',
  styleUrl: './vehicles.component.scss'
})
export class VehiclesComponent implements OnInit {
  vehicles = MOCK_VEHICLES;

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
  advAssignedClient: string = '';
  advYearMin: number | null = null;
  advYearMax: number | null = null;
  advMileageMin: number | null = null;
  advMileageMax: number | null = null;
  advCountFilter: number = 10;

  // 3. ACTUALLY APPLIED Filters
  appliedSearchTerm: string = '';
  appliedStatusFilter: string = '';
  appliedAssignedClient: string = '';
  appliedYearMin: number | null = null;
  appliedYearMax: number | null = null;
  appliedMileageMin: number | null = null;
  appliedMileageMax: number | null = null;
  appliedCountFilter: number = 10;

  constructor() { }

  ngOnInit(): void { }

  get filteredVehicles() {
    let result = this.vehicles.filter(vehicle => {
      // 1. Text Search
      const searchStr = `${vehicle.brand} ${vehicle.model} ${vehicle.licensePlate}`.toLowerCase();
      const matchesSearch = !this.appliedSearchTerm || searchStr.includes(this.appliedSearchTerm.toLowerCase());

      // 2. Exact Selectors/Text
      const matchesStatus = !this.appliedStatusFilter || vehicle.status === this.appliedStatusFilter;
      const matchesAssigned = !this.appliedAssignedClient || vehicle.assignedClient.toLowerCase().includes(this.appliedAssignedClient.toLowerCase());

      // 3. Range: Year
      const matchesYearMin = this.appliedYearMin === null || vehicle.year >= this.appliedYearMin;
      const matchesYearMax = this.appliedYearMax === null || vehicle.year <= this.appliedYearMax;
      const matchesYear = matchesYearMin && matchesYearMax;

      // 4. Range: Mileage
      const matchesMileageMin = this.appliedMileageMin === null || vehicle.mileage >= this.appliedMileageMin;
      const matchesMileageMax = this.appliedMileageMax === null || vehicle.mileage <= this.appliedMileageMax;
      const matchesMileage = matchesMileageMin && matchesMileageMax;

      return matchesSearch && matchesStatus && matchesAssigned && matchesYear && matchesMileage;
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
    this.appliedAssignedClient = this.advAssignedClient;
    this.appliedYearMin = this.advYearMin;
    this.appliedYearMax = this.advYearMax;
    this.appliedMileageMin = this.advMileageMin;
    this.appliedMileageMax = this.advMileageMax;
    this.appliedCountFilter = this.advCountFilter;

    this.quickSearchTerm = this.advSearchTerm;
    this.quickStatusFilter = this.advStatusFilter;
  }

  resetFilters() {
    this.advSearchTerm = '';
    this.advStatusFilter = '';
    this.advAssignedClient = '';
    this.advYearMin = null;
    this.advYearMax = null;
    this.advMileageMin = null;
    this.advMileageMax = null;
    this.advCountFilter = 10;

    this.quickSearchTerm = '';
    this.quickStatusFilter = '';

    this.applyAdvancedFilters();
  }
}

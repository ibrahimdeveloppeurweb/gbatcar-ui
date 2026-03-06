import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';
import { MOCK_COMPLIANCE } from '../../../../../core/mock/gbatcar-compliance.mock';

@Component({
  selector: 'app-compliance',
  standalone: true,
  imports: [CommonModule, RouterModule, FeatherIconDirective, FormsModule],
  templateUrl: './compliance.component.html',
  styleUrl: './compliance.component.scss'
})
export class ComplianceComponent implements OnInit {

  complianceList = MOCK_COMPLIANCE;
  searchTerm: string = '';
  typeFilter: string = '';

  activeTab: string = 'legal';

  constructor() { }

  ngOnInit(): void {
  }

  get filteredCompliance() {
    return this.complianceList.filter(item => {
      const searchStr = `${item.vehicle} ${item.licensePlate} ${item.assignedClient}`.toLowerCase();
      const matchSearch = !this.searchTerm || searchStr.includes(this.searchTerm.toLowerCase());

      let matchType = true;
      if (this.typeFilter === 'Expired') {
        matchType = item.insurance.status === 'Expired' ||
          item.technicalInspection.status === 'Expired' ||
          item.roadTax.status === 'Expired' ||
          item.transportLicense.status === 'Expired' ||
          item.fireExtinguisher.status === 'Expired' ||
          item.preventiveMaintenance.status === 'Expired';
      } else if (this.typeFilter === 'Expiring Soon') {
        matchType = item.insurance.status === 'Expiring Soon' ||
          item.technicalInspection.status === 'Expiring Soon' ||
          item.roadTax.status === 'Expiring Soon' ||
          item.transportLicense.status === 'Expiring Soon' ||
          item.fireExtinguisher.status === 'Expiring Soon' ||
          item.preventiveMaintenance.status === 'Expiring Soon';
      }

      return matchSearch && matchType;
    });
  }

  abs(value: number): number {
    return Math.abs(value);
  }
}

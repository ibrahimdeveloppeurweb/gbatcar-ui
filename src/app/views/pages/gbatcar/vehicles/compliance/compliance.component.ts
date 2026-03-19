import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';
import { VehicleComplianceService } from '../../../../../core/services/compliance/vehicle-compliance.service';
import { VehicleCompliance } from '../../../../../core/models/vehicle-compliance.model';
import Swal from 'sweetalert2/dist/sweetalert2.js';

@Component({
  selector: 'app-compliance',
  standalone: true,
  imports: [CommonModule, RouterModule, FeatherIconDirective, FormsModule],
  templateUrl: './compliance.component.html',
  styleUrl: './compliance.component.scss'
})
export class ComplianceComponent implements OnInit {

  private complianceService = inject(VehicleComplianceService);

  rawComplianceList: any[] = [];
  complianceList: any[] = [];
  loading: boolean = false;

  searchTerm: string = '';
  typeFilter: string = '';
  startDate: string = '';
  endDate: string = '';

  activeTab: string = 'legal';
  selectedItem: any;
  showFilters: boolean = true;

  constructor() { }

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    const params = {
      search: this.searchTerm,
      startDate: this.startDate,
      endDate: this.endDate
    };
    this.complianceService.getList(params).subscribe({
      next: (res: any) => {
        this.rawComplianceList = res.data || res;
        this.complianceList = this.rawComplianceList.map(item => this.mapToViewModel(item));
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement conformité', err);
        this.loading = false;
      }
    });
  }

  private mapToViewModel(item: any) {
    const vehicle = item.vehicle;
    return {
      uuid: item.uuid,
      id: item.id,
      vehicle: vehicle ? `${vehicle.marque} ${vehicle.modele}` : 'N/A',
      licensePlate: vehicle?.immatriculation || 'N/A',
      assignedClient: vehicle?.client ? `${vehicle.client.prenom || ''} ${vehicle.client.nom || ''}` : 'Non assigné',

      insurance: this.computeDocStatus(item.assuranceExpiryDate),
      technicalInspection: this.computeDocStatus(item.technicalInspectionExpiryDate),
      roadTax: this.computeDocStatus(item.roadTaxExpiryDate),
      transportLicense: this.computeDocStatus(item.transportLicenseExpiryDate),
      fireExtinguisher: this.computeDocStatus(item.fireExtinguisherExpiryDate),
      carteGrise: this.computeDocStatus(item.carteGriseExpiryDate),
      leaseContract: this.computeDocStatus(item.leaseContractExpiryDate),

      // Mock for preventive maintenance as it's not in the main compliance entity yet
      preventiveMaintenance: {
        status: 'Valid',
        nextKm: (vehicle?.kilometrage || 0) + 5000,
        currentKm: vehicle?.kilometrage || 0
      }
    };
  }

  private computeDocStatus(expiryDate: any) {
    if (!expiryDate) {
      return { status: 'Missing', daysLeft: 0, expiryDate: null };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(expiryDate);
    exp.setHours(0, 0, 0, 0);

    const diffTime = exp.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let status = 'Valid';
    if (diffDays < 0) {
      status = 'Expired';
    } else if (diffDays <= 30) {
      status = 'Expiring Soon';
    }

    return {
      status,
      daysLeft: diffDays,
      expiryDate: exp
    };
  }

  // KPI computed properties
  get expiredCount(): number {
    return this.complianceList.filter(item =>
      item.insurance.status === 'Expired' || item.technicalInspection.status === 'Expired' ||
      item.roadTax.status === 'Expired' || item.transportLicense.status === 'Expired' ||
      item.fireExtinguisher.status === 'Expired'
    ).length;
  }

  get expiringSoonCount(): number {
    return this.complianceList.filter(item =>
      item.insurance.status === 'Expiring Soon' || item.technicalInspection.status === 'Expiring Soon' ||
      item.roadTax.status === 'Expiring Soon' || item.transportLicense.status === 'Expiring Soon' ||
      item.fireExtinguisher.status === 'Expiring Soon'
    ).length;
  }

  get validCount(): number {
    return this.complianceList.filter(item =>
      item.insurance.status === 'Valid' && item.technicalInspection.status === 'Valid' &&
      item.roadTax.status === 'Valid' && item.transportLicense.status === 'Valid'
    ).length;
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
          item.fireExtinguisher.status === 'Expired';
      } else if (this.typeFilter === 'Expiring Soon') {
        matchType = item.insurance.status === 'Expiring Soon' ||
          item.technicalInspection.status === 'Expiring Soon' ||
          item.roadTax.status === 'Expiring Soon' ||
          item.transportLicense.status === 'Expiring Soon' ||
          item.fireExtinguisher.status === 'Expiring Soon';
      }

      return matchSearch && matchType;
    });
  }

  abs(value: number): number {
    return Math.abs(value);
  }

  deleteDoc(item: any): void {
    Swal.fire({
      title: 'Supprimer ?',
      text: "Voulez-vous vraiment supprimer cette fiche de conformité ?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.complianceService.getDelete(item.uuid).subscribe({
          next: () => {
            this.loadData();
            Swal.fire('Supprimé !', 'La fiche a été supprimée.', 'success');
          },
          error: (err) => {
            console.error('Erreur suppression', err);
            Swal.fire('Erreur', 'Impossible de supprimer cette fiche.', 'error');
          }
        });
      }
    });
  }
}

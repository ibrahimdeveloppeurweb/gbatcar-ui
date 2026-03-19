import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { VehicleComplianceService } from '../../../../../../core/services/compliance/vehicle-compliance.service';
import { FeatherIconDirective } from '../../../../../../core/feather-icon/feather-icon.directive';
import { environment } from '../../../../../../../environments/environment';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { PenaltyService } from '../../../../../../core/services/penalty/penalty.service';
import Swal from 'sweetalert2/dist/sweetalert2.js';

@Component({
  selector: 'app-compliance-details',
  standalone: true,
  imports: [CommonModule, RouterModule, FeatherIconDirective, ReactiveFormsModule, FormsModule],
  templateUrl: './compliance-details.component.html',
  styleUrl: './compliance-details.component.scss'
})
export class ComplianceDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private complianceService = inject(VehicleComplianceService);
  private penaltyService = inject(PenaltyService);
  private modalService = inject(NgbModal);
  private fb = inject(FormBuilder);
  private baseUrl = environment.serverUrl.replace('/api', '');

  item: any;
  loading: boolean = true;
  submittingPenalty: boolean = false;
  penaltyForm: FormGroup;
  selectedPenalty: any;
  proofFile: File | null = null;
  searchTerm: string = '';
  statusFilter: string = '';
  startDate: string = '';
  endDate: string = '';

  ngOnInit() {
    this.initPenaltyForm();
    this.route.paramMap.subscribe(params => {
      const uuid = params.get('uuid');
      if (uuid) {
        this.loadData(uuid);
      }
    });
  }

  loadData(uuid: string) {
    this.loading = true;
    const filters = {
      searchTerm: this.searchTerm,
      statusFilter: this.statusFilter,
      startDate: this.startDate,
      endDate: this.endDate
    };
    this.complianceService.getSingle(uuid, filters).subscribe({
      next: (data) => {
        this.item = this.mapToViewModel(data);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading compliance details:', err);
        this.loading = false;
      }
    });
  }

  private mapToViewModel(data: any): any {
    const today = new Date();

    const computeDocStatus = (expiryDateStr: string | null) => {
      if (!expiryDateStr) return { status: 'Missing', daysLeft: 0, expiryDate: null };

      const expiryDate = new Date(expiryDateStr);
      const diffTime = expiryDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let status = 'Valid';
      if (diffDays < 0) status = 'Expired';
      else if (diffDays <= 30) status = 'Expiring Soon';

      return { status, daysLeft: Math.max(0, diffDays), expiryDate };
    };

    return {
      id: data.id,
      uuid: data.uuid,
      vehicle: `${data.vehicle?.marque} ${data.vehicle?.modele} ${data.vehicle?.annee || ''}`,
      licensePlate: data.vehicle?.immatriculation || 'N/A',
      assignedClient: data.vehicle?.client ? `${data.vehicle.client.firstname} ${data.vehicle.client.lastname}` : 'GbatCar (Stock)',

      insurance: { ...computeDocStatus(data.assuranceExpiryDate), url: data.assuranceUrl },
      technicalInspection: { ...computeDocStatus(data.technicalInspectionExpiryDate), url: data.technicalInspectionUrl },
      roadTax: { ...computeDocStatus(data.roadTaxExpiryDate), url: data.roadTaxUrl },
      transportLicense: {
        ...computeDocStatus(data.transportLicenseExpiryDate),
        type: data.transportLicenseType || 'N/A',
        url: data.transportLicenseUrl
      },
      fireExtinguisher: { ...computeDocStatus(data.fireExtinguisherExpiryDate), url: data.fireExtinguisherUrl },
      carteGrise: { ...computeDocStatus(data.carteGriseExpiryDate), url: data.carteGriseUrl },
      leaseContract: {
        ...computeDocStatus(data.leaseContractExpiryDate),
        type: data.leaseContractType || 'N/A',
        url: data.leaseContractUrl
      },
      preventiveMaintenance: {
        status: (data.vehicle?.prochainEntretien && data.vehicle?.kilometrage && data.vehicle.prochainEntretien <= data.vehicle.kilometrage + 500) ?
          (data.vehicle.prochainEntretien <= data.vehicle.kilometrage ? 'Expired' : 'Expiring Soon') : 'Valid',
        currentKm: data.vehicle?.kilometrage || 0,
        nextKm: data.vehicle?.prochainEntretien || 0
      },

      // History and Penalties
      history: (data.vehicle?.complianceDocuments || []).sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()),
      penalties: (data.vehicle?.penalties || []).sort((a: any, b: any) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()),
      rawVehicle: data.vehicle
    };
  }

  initPenaltyForm() {
    this.penaltyForm = this.fb.group({
      reference: ['', Validators.required],
      reason: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(0)]],
      date: [new Date().toISOString().split('T')[0], Validators.required],
      dueDate: [''],
      severity: ['Moyenne'],
      status: ['En attente'],
      observation: ['']
    });
  }

  openPenaltyModal(content: any) {
    this.penaltyForm.reset({
      date: new Date().toISOString().split('T')[0],
      severity: 'Moyenne',
      status: 'En attente',
      amount: 0
    });
    this.proofFile = null;
    this.modalService.open(content, { size: 'lg', centered: true });
  }

  onFileSelected(event: any) {
    if (event.target.files.length > 0) {
      this.proofFile = event.target.files[0];
    }
  }

  savePenalty() {
    if (this.penaltyForm.invalid) {
      return;
    }

    this.submittingPenalty = true;

    const formData = new FormData();
    Object.keys(this.penaltyForm.value).forEach(key => {
      const value = this.penaltyForm.value[key];
      formData.append(key, value !== null && value !== undefined ? value : '');
    });

    formData.append('vehicleId', this.item.rawVehicle?.uuid);
    if (this.item.rawVehicle?.client?.uuid) {
      formData.append('clientId', this.item.rawVehicle?.client?.uuid);
    }

    if (this.proofFile) {
      formData.append('proofFile', this.proofFile);
    }

    this.penaltyService.create(formData).subscribe({
      next: () => {
        this.submittingPenalty = false;
        this.modalService.dismissAll();
        this.toast('Infraction enregistrée avec succès.', 'Succès', 'success');
        this.loadData(this.item.uuid);
      },
      error: (err: any) => {
        this.submittingPenalty = false;
        this.toast(err?.error?.message || 'Erreur lors de l\'enregistrement.', 'Erreur', 'error');
      }
    });
  }

  deletePenalty(penalty: any) {
    Swal.fire({
      title: 'Êtes-vous sûr ?',
      text: "Cette action est irréversible !",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Oui, supprimer !',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.penaltyService.delete(penalty.uuid).subscribe({
          next: () => {
            this.toast('Infraction supprimée.', 'Succès', 'success');
            this.loadData(this.item.uuid);
          },
          error: (err: any) => {
            this.toast('Erreur lors de la suppression.', 'Erreur', 'error');
          }
        });
      }
    });
  }

  openDetailModal(content: any, penalty: any) {
    this.selectedPenalty = penalty;
    this.modalService.open(content, { size: 'lg', centered: true });
  }

  toast(msg: string, title: string, type: string): void {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
    Toast.fire({
      icon: (['error', 'success', 'warning', 'info', 'question'].includes(type) ? type : 'info') as any,
      title: title ? `${title} - ${msg}` : msg
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Valid': return 'bg-success';
      case 'Expiring Soon': return 'bg-warning text-dark';
      case 'Expired': return 'bg-danger';
      case 'Missing': return 'bg-light text-dark';
      default: return 'bg-secondary';
    }
  }

  isAtFault(penalty: any): boolean {
    return penalty.status === 'Non payé' || penalty.status === 'En attente';
  }

  getDuration(startDate: string | null, endDate: string | null): string {
    if (!startDate || !endDate) return '';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? `(${diffDays} jours)` : '';
  }

  getFileUrl(path: string | null): string {
    if (!path) return '#';
    return path.startsWith('http') ? path : `${this.baseUrl}${path}`;
  }

  get filteredHistory(): any[] {
    return this.item?.history || [];
  }

  get filteredPenalties(): any[] {
    return this.item?.penalties || [];
  }

  applyFilters() {
    if (this.item && this.item.uuid) {
      this.loadData(this.item.uuid);
    }
  }

  resetFilters() {
    this.searchTerm = '';
    this.statusFilter = '';
    this.startDate = '';
    this.endDate = '';
    this.applyFilters();
  }
}

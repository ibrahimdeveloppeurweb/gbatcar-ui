import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { VehicleService } from '../../../../../../core/services/vehicle/vehicle.service';
import { VehicleComplianceService } from '../../../../../../core/services/compliance/vehicle-compliance.service';
import { Vehicle } from '../../../../../../core/models/vehicle.model';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherIconDirective } from '../../../../../../core/feather-icon/feather-icon.directive';

@Component({
  selector: 'app-compliance-add',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, NgSelectModule, FeatherIconDirective],
  templateUrl: './compliance-add.component.html',
  styleUrl: './compliance-add.component.scss'
})
export class ComplianceAddComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private vehicleService = inject(VehicleService);
  private complianceService = inject(VehicleComplianceService);

  vehicles: Vehicle[] = [];
  loading = false;
  submitting = false; // "submit" in vehicle-form
  complianceForm: FormGroup;
  selectedFile: File | null = null;

  documentTypes = [
    { value: 'assurance', label: 'Assurance (Tous Risques)' },
    { value: 'technicalInspection', label: 'Visite Technique' },
    { value: 'roadTax', label: 'Carte Grise (Vignette/Taxe)' },
    { value: 'transportLicense', label: 'Licence de transport' },
    { value: 'fireExtinguisher', label: 'Extincteur & Sécurité' },
    { value: 'carteGrise', label: 'Carte Grise' },
    { value: 'leaseContract', label: 'Contrat Location-Vente' }
  ];

  constructor() {
    this.initForm();
  }

  ngOnInit() {
    this.loadVehicles();
  }

  initForm() {
    this.complianceForm = this.fb.group({
      vehicleId: ['', Validators.required],
      type: ['assurance', Validators.required],
      deliveryDate: ['', Validators.required],
      expiryDate: ['', Validators.required],
      renewalCost: [0],
      observation: ['']
    });
  }

  loadVehicles() {
    this.loading = true;
    this.vehicleService.getList().subscribe({
      next: (res: any) => {
        this.vehicles = res.data || res;
        this.loading = false;

        // Handle pre-selection from query params
        this.route.queryParams.subscribe(params => {
          if (params['vehicle']) {
            // Use setTimeout to ensure the form is rendered after loading=false
            setTimeout(() => {
              this.complianceForm.patchValue({ vehicleId: params['vehicle'] });
            }, 100);
          }
        });
      },
      error: () => {
        this.loading = false;
        this.toast('Impossible de charger les véhicules.', 'Erreur', 'error');
      }
    });
  }

  customSearchFn = (term: string, item: any) => {
    term = term.toLowerCase();
    const marque = (item.marque || '').toLowerCase();
    const modele = (item.modele || '').toLowerCase();
    const plaque = (item.immatriculation || '').toLowerCase();
    return marque.includes(term) || modele.includes(term) || plaque.includes(term);
  };

  onFileSelected(event: any) {
    if (event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }

  onConfirme(): void {
    if (this.complianceForm.invalid) {
      this.toast('Veuillez remplir correctement les champs obligatoires.', 'Erreur', 'warning');
      return;
    }

    Swal.fire({
      title: '',
      text: "Confirmez-vous l'enregistrement de ce nouveau document de conformité ?",
      icon: 'warning',
      showCancelButton: true,
      showCloseButton: true,
      confirmButtonText: 'Confirmer <i class="fas fa-check"></i>',
      cancelButtonText: 'Annuler <i class="feather icon-x-circle"></i>',
      confirmButtonColor: '#1bc943',
      reverseButtons: true
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.saveData();
      }
    });
  }

  saveData(): void {
    this.submitting = true;
    const formData = new FormData();
    const values = this.complianceForm.value;
    const type = values.type;

    // Mapping fields for the backend manager
    formData.append('vehicleId', values.vehicleId);
    formData.append(`${type}ExpiryDate`, values.expiryDate);
    formData.append(`${type}DeliveryDate`, values.deliveryDate);
    formData.append(`${type}RenewalCost`, values.renewalCost || 0);
    formData.append(`${type}Observation`, values.observation);

    if (this.selectedFile) {
      formData.append(`${type}File`, this.selectedFile);
    }

    this.complianceService.create(formData).subscribe({
      next: () => {
        this.submitting = false;
        this.toast('Document enregistré avec succès.', 'Succès', 'success');
        this.navigateBack();
      },
      error: (err: any) => {
        this.submitting = false;
        this.toast(
          err?.error?.message || err?.error?.details || "Une erreur est survenue lors de l'enregistrement.",
          'Erreur', 'error'
        );
      }
    });
  }

  navigateBack(): void {
    this.router.navigate(['/gbatcar/vehicles/compliance']);
  }

  // ─── Utilitaires ─────────────────────────────────────────────────────────

  toast(msg: string, title: string, type: string): void {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });

    const iconType = (['error', 'success', 'warning', 'info', 'question'].includes(type))
      ? type as any : 'info';

    Toast.fire({
      icon: iconType,
      title: title ? `${title} - ${msg}` : msg
    });
  }
}

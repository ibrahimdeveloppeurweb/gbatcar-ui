import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';
import { MaintenanceAlertService } from '../../../../../core/services/maintenance/maintenance-alert.service';
import { VehicleService } from '../../../../../core/services/vehicle/vehicle.service';
import { NgSelectModule } from '@ng-select/ng-select';
import Swal from 'sweetalert2';
import { NgxPermissionsModule, NgxPermissionsService } from 'ngx-permissions';
import { AuthService } from '../../../../../core/services/auth/auth.service';

@Component({
  selector: 'app-maintenance-alert-form',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FeatherIconDirective, NgSelectModule, NgxPermissionsModule],
  templateUrl: './maintenance-alert-form.component.html',
  styleUrl: './maintenance-alert-form.component.scss'
})
export class MaintenanceAlertFormComponent implements OnInit {

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private alertService = inject(MaintenanceAlertService);
  private vehicleService = inject(VehicleService);
  private permissionsService = inject(NgxPermissionsService);
  private authService = inject(AuthService);

  alertForm!: FormGroup;
  isEditMode = false;
  alertUuid: string | null = null;
  loading = false;
  submit = false;
  isSubmitting = false;

  vehicles: any[] = [];
  loadingVehicles = false;

  severityOptions = ['Faible', 'Moyenne', 'Critique'];
  typeOptions = ['Accident', 'Panne lourde', 'Accrochage', 'Vandalisme', 'Autre'];

  private selectedPoliceReport: File | null = null;
  private selectedPhotos: File[] = [];

  constructor() { }

  ngOnInit(): void {
    const permissions = this.authService.getPermissions();
    this.permissionsService.loadPermissions(permissions);
    this.initForm();
    this.loadVehicles();

    this.alertUuid = this.route.snapshot.paramMap.get('uuid');
    if (this.alertUuid) {
      this.isEditMode = true;
      this.loadAlertData(this.alertUuid);
    }
  }

  initForm(): void {
    this.alertForm = this.fb.group({
      vehicle: [null, Validators.required],
      date: [new Date().toISOString().split('T')[0], Validators.required],
      type: [null, Validators.required],
      severity: ['Moyenne', Validators.required],
      description: ['', Validators.required],
      driverInfo: [''],
      observation: [''],
      repairCost: [0]
    });
  }

  loadVehicles(): void {
    this.loadingVehicles = true;
    this.vehicleService.getList().subscribe({
      next: (res: any) => {
        this.vehicles = res.data || res;
        this.loadingVehicles = false;
      },
      error: () => this.loadingVehicles = false
    });
  }

  loadAlertData(uuid: string): void {
    this.loading = true;
    this.alertService.getSingle(uuid).subscribe({
      next: (data: any) => {
        this.alertForm.patchValue({
          vehicle: data.vehicle?.uuid,
          date: data.date ? new Date(data.date).toISOString().split('T')[0] : '',
          type: data.type,
          severity: data.severity,
          description: data.description,
          driverInfo: data.driverInfo,
          observation: data.observation,
          repairCost: data.repairCost
        });
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.router.navigate(['/gbatcar/maintenance/alerts']);
      }
    });
  }

  onSubmit(): void {
    this.submit = true;
    if (this.alertForm.invalid) {
      this.alertForm.markAllAsTouched();
      this.toast('Veuillez remplir correctement les champs obligatoires.', 'Erreur', 'warning');
      return;
    }

    Swal.fire({
      title: '',
      text: "Confirmez-vous l'enregistrement de ce sinistre / alerte ?",
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

  onFileChange(event: any): void {
    if (event.target.files.length > 0) {
      this.selectedPoliceReport = event.target.files[0];
    }
  }

  onPhotosChange(event: any): void {
    if (event.target.files.length > 0) {
      this.selectedPhotos = Array.from(event.target.files);
    }
  }

  saveData(): void {
    this.isSubmitting = true;

    const formData = new FormData();
    const formValue = this.alertForm.value;

    // Append standard fields
    Object.keys(formValue).forEach(key => {
      if (formValue[key] !== null && formValue[key] !== undefined) {
        formData.append(key, formValue[key]);
      }
    });

    if (this.isEditMode && this.alertUuid) {
      formData.append('uuid', this.alertUuid);
    }

    // Append files
    if (this.selectedPoliceReport) {
      formData.append('policeReportFile', this.selectedPoliceReport);
    }

    if (this.selectedPhotos.length > 0) {
      this.selectedPhotos.forEach(file => {
        formData.append('photosFiles[]', file);
      });
    }

    this.alertService.add(formData).subscribe({
      next: () => {
        this.isSubmitting = false;
        const msg = this.isEditMode ? 'Alerte modifiée avec succès.' : 'Alerte enregistrée avec succès.';
        this.toast(msg, 'Succès', 'success');
        this.router.navigate(['/gbatcar/maintenance/alerts']);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.toast(err?.error?.message || "Une erreur est survenue lors de l'enregistrement.", 'Erreur', 'error');
      }
    });
  }

  toast(msg: string, title: string, type: string): void {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });

    const iconType = (['error', 'success', 'warning', 'info', 'question'].includes(type)) ? type as any : 'info';

    Toast.fire({
      icon: iconType,
      title: title ? `${title} - ${msg}` : msg
    });
  }
}

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';
import { ClientService } from '../../../../../core/services/client/client.service';

@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FeatherIconDirective],
  templateUrl: './client-form.component.html',
  styleUrl: './client-form.component.scss'
})
export class ClientFormComponent implements OnInit {

  private formBuilder = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private clientService = inject(ClientService);

  clientForm: FormGroup;
  isEditMode = false;
  clientId: string | null = null;
  pageTitle = 'Nouveau Client';
  loading = false;
  submit = false;
  submitting = false;

  // Selected files for upload
  selectedFiles: { [key: string]: File } = {};

  constructor() {
    this.clientForm = this.formBuilder.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      birthDate: [''],
      gender: ['Homme'],
      maritalStatus: ['Célibataire'],
      childrenCount: [0],
      educationLevel: [''],
      profession: [''],
      incomeBracket: [''],
      primaryBankAccount: [''],
      discoveryChannel: [''],
      drivingExperienceYears: [0],
      housingStatus: [''],
      previousCreditExperience: ['Aucun'],
      repaymentSource: [''],
      nationality: ['Côte d\'Ivoire'],
      birthPlace: [''],
      phone: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      city: [''],
      neighborhood: [''],
      address: ['', Validators.required],
      idNumber: ['', Validators.required],
      idIssueDate: [''],
      licenseNumber: ['', Validators.required],
      status: ['En attente de Validation'],
      type: ['Particulier']
    });
  }

  ngOnInit(): void {
    this.clientId = this.route.snapshot.paramMap.get('id');
    if (this.clientId) {
      this.isEditMode = true;
      this.pageTitle = 'Modifier le Dossier';
      this.loadClientData(this.clientId);
    }
  }

  onFileChange(event: Event, field: string) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFiles[field] = input.files[0];
    }
  }

  loadClientData(uuid: string) {
    this.loading = true;
    this.clientService.getSingle(uuid).subscribe({
      next: (res: any) => {
        const client = res.data || res;
        this.clientForm.patchValue({
          firstName: client.firstName,
          lastName: client.lastName,
          birthDate: client.birthDate ? new Date(client.birthDate.date || client.birthDate).toISOString().split('T')[0] : '',
          gender: client.gender,
          maritalStatus: client.maritalStatus,
          childrenCount: client.childrenCount,
          educationLevel: client.educationLevel,
          profession: client.profession,
          incomeBracket: client.incomeBracket,
          primaryBankAccount: client.primaryBankAccount,
          discoveryChannel: client.discoveryChannel,
          drivingExperienceYears: client.drivingExperienceYears,
          housingStatus: client.housingStatus,
          previousCreditExperience: client.previousCreditExperience,
          repaymentSource: client.repaymentSource,
          nationality: client.nationality || 'Côte d\'Ivoire',
          birthPlace: client.birthPlace,
          phone: client.phone,
          email: client.email,
          city: client.city,
          neighborhood: client.neighborhood,
          address: client.address,
          idNumber: client.idNumber,
          idIssueDate: client.idIssueDate ? new Date(client.idIssueDate.date || client.idIssueDate).toISOString().split('T')[0] : '',
          licenseNumber: client.licenseNumber,
          status: client.status,
          type: client.type
        });
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        Swal.fire('Erreur', 'Impossible de charger les données du client.', 'error');
        this.router.navigate(['/gbatcar/clients']);
      }
    });
  }

  onConfirme() {
    this.submit = true;
    if (this.clientForm.invalid) {
      this.clientForm.markAllAsTouched();
      this.toast('Veuillez remplir correctement les champs obligatoires.', 'Erreur', 'warning');
      return;
    }

    Swal.fire({
      title: '',
      text: "Confirmez-vous l'enregistrement de ce dossier client ?",
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

  saveData() {
    this.submitting = true;
    const formData = new FormData();
    const values = this.clientForm.value;

    Object.keys(values).forEach(key => {
      const val = values[key];
      if (val !== null && val !== undefined && val !== '') {
        formData.append(key, val);
      }
    });

    // Handle files
    if (this.selectedFiles['photoFile']) formData.append('photoFile', this.selectedFiles['photoFile']);
    if (this.selectedFiles['idScanFile']) formData.append('idScanFile', this.selectedFiles['idScanFile']);
    if (this.selectedFiles['licenseScanFile']) formData.append('licenseScanFile', this.selectedFiles['licenseScanFile']);

    if (this.isEditMode && this.clientId) {
      formData.append('uuid', this.clientId);
    }

    this.clientService.add(formData).subscribe({
      next: () => {
        this.submitting = false;
        const msg = this.isEditMode ? 'Modifications enregistrées avec succès.' : 'Client ajouté avec succès.';
        this.toast(msg, 'Succès', 'success');
        this.router.navigate(['/gbatcar/clients']);
      },
      error: (err: any) => {
        this.submitting = false;
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

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';

import { NgSelectModule } from '@ng-select/ng-select';
import { PenaltyService } from '../../../../../core/services/penalty/penalty.service';
import { ContractService } from '../../../../../core/services/contract/contract.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-penalty-form',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FeatherIconDirective, NgSelectModule],
  templateUrl: './penalty-form.component.html',
  styleUrl: './penalty-form.component.scss'
})
export class PenaltyFormComponent implements OnInit {

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private penaltyService = inject(PenaltyService);
  private contractService = inject(ContractService);
  private route = inject(ActivatedRoute);

  penaltyForm: FormGroup;
  contracts: any[] = [];
  loadingContracts: boolean = false;
  submitting: boolean = false;
  selectedFile: File | null = null;

  contractSearchFn = (term: string, item: any) => {
    term = term.toLowerCase();
    const ref = (item.reference || '').toLowerCase();
    const clientNom = (item.client?.lastName || '').toLowerCase();
    const clientPrenom = (item.client?.firstName || '').toLowerCase();
    const vehSummary = (item.vehicleSummary || '').toLowerCase();
    return ref.includes(term) || clientNom.includes(term) || clientPrenom.includes(term) || vehSummary.includes(term);
  };

  constructor() {
    this.penaltyForm = this.fb.group({
      contractId: [null, Validators.required],
      reason: ['Retard de paiement', Validators.required],
      severity: ['Moyenne', Validators.required],
      amount: [null, [Validators.required, Validators.min(1)]],
      dueDate: [this.getLocalISOString(new Date()).substring(0, 10), Validators.required],
      date: [this.getLocalISOString(new Date()), Validators.required],
      observation: ['']
    });
  }

  ngOnInit(): void {
    this.loadContracts();
  }

  loadContracts() {
    this.loadingContracts = true;
    this.contractService.getList({ status: 'VALIDÉ' }).subscribe({
      next: (res: any) => {
        this.contracts = res.data || res;
        this.loadingContracts = false;

        // Pre-select contract if contractUuid is in query params
        const contractUuid = this.route.snapshot.queryParamMap.get('contractUuid');
        if (contractUuid) {
          const selected = this.contracts.find(c => c.uuid === contractUuid);
          if (selected) {
            this.penaltyForm.patchValue({ contractId: selected.uuid });
          }
        }
      },
      error: () => this.loadingContracts = false
    });
  }

  onFileSelected(event: any) {
    if (event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }

  onConfirme() {
    if (this.penaltyForm.invalid) {
      this.penaltyForm.markAllAsTouched();
      this.toast('Veuillez remplir correctement les champs obligatoires.', 'Erreur', 'warning');
      return;
    }

    Swal.fire({
      title: 'Confirmation',
      text: "Voulez-vous vraiment enregistrer cette pénalité ?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Confirmer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#1bc943',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.onSubmit();
      }
    });
  }

  onSubmit() {
    this.submitting = true;
    const formData = new FormData();
    const formValues = this.penaltyForm.value;

    Object.keys(formValues).forEach(key => {
      if (formValues[key] !== null && formValues[key] !== undefined) {
        formData.append(key, formValues[key]);
      }
    });

    if (this.selectedFile) {
      formData.append('proofFile', this.selectedFile);
    }

    this.penaltyService.create(formData).subscribe({
      next: () => {
        this.submitting = false;
        this.toast('Pénalité enregistrée avec succès', 'Succès', 'success');
        this.router.navigate(['/gbatcar/payments/penalties']);
      },
      error: (err) => {
        this.submitting = false;
        this.toast(err.error?.message || 'Une erreur est survenue', 'Erreur', 'error');
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

  private getLocalISOString(date: Date): string {
    const tzOffset = date.getTimezoneOffset() * 60000;
    return (new Date(date.getTime() - tzOffset)).toISOString().substring(0, 16);
  }
}

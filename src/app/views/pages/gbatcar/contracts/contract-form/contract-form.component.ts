import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';
import { ContractService } from '../../../../../core/services/contract/contract.service';
import { ClientService } from '../../../../../core/services/client/client.service';
import { VehicleService } from '../../../../../core/services/vehicle/vehicle.service';
import { GeneralSettingService } from '../../../../../core/services/setting/setting.service';
import { NgSelectModule } from '@ng-select/ng-select';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-contract-form',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FeatherIconDirective, NgSelectModule],
  templateUrl: './contract-form.component.html',
  styleUrl: './contract-form.component.scss'
})
export class ContractFormComponent implements OnInit {

  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private contractService = inject(ContractService);
  private clientService = inject(ClientService);
  private vehicleService = inject(VehicleService);
  private settingService = inject(GeneralSettingService);

  contractForm: FormGroup;
  isEditMode: boolean = false;
  contractId: string | null = null;
  clients: any[] = [];
  vehicles: any[] = [];
  loading: boolean = false;
  submit: boolean = false;
  submitting: boolean = false;
  loadingClients: boolean = false;
  loadingVehicles: boolean = false;
  pageTitle: string = 'Nouveau Contrat';
  settings: any = null;
  canEditCaution: boolean = false;

  customSearchFn = (term: string, item: any) => {
    term = term.toLowerCase();
    const marque = (item.marque || '').toLowerCase();
    const modele = (item.modele || '').toLowerCase();
    const plaque = (item.immatriculation || '').toLowerCase();
    return marque.includes(term) || modele.includes(term) || plaque.includes(term);
  };

  clientSearchFn = (term: string, item: any) => {
    term = term.toLowerCase();
    const nom = (item.lastName || '').toLowerCase();
    const prenom = (item.firstName || '').toLowerCase();
    const reference = (item.uuid || '').toLowerCase(); // Or reference if available
    return nom.includes(term) || prenom.includes(term) || reference.includes(term);
  };

  constructor() {
    this.contractForm = this.fb.group({
      clientId: [null, Validators.required],
      vehicleId: [null, Validators.required],
      usageType: ['VTC', Validators.required],
      startDate: [new Date().toISOString().substring(0, 10), Validators.required],
      duration: [{ value: 36, disabled: true }, [Validators.required, Validators.min(1)]],
      paymentFrequency: ['Monthly', Validators.required],
      dailyRate: [0, [Validators.required, Validators.min(0)]],
      cautionAmount: [{ value: 0, disabled: true }, [Validators.required, Validators.min(0)]],
      gracePeriod: [{ value: 2, disabled: true }, Validators.min(0)],
      penaltyRate: [{ value: 5, disabled: true }, Validators.min(0)],
      insuranceSplit: ['Included', Validators.required],
      totalAmount: [{ value: 0, disabled: true }],
      projectedMargin: [{ value: 0, disabled: true }],
      prixDeVente: [{ value: 0, disabled: true }],
      notes: [''],
      // Checklist
      hasValidID: [true],
      hasDriverLicense: [true],
      hasProofOfAddress: [false],
      hasCriminalRecord: [false]
    });

    // Auto-calculate on changes
    this.contractForm.valueChanges.subscribe(() => {
      this.calculateTotals();
    });

    // Watch vehicle selection to calculate deposit
    this.contractForm.get('vehicleId')?.valueChanges.subscribe(vId => {
      this.calculateInitialDeposit(vId);
    });

    // Watch manual price changes to update deposit
    this.contractForm.get('prixDeVente')?.valueChanges.subscribe(() => {
      this.recalculateCautionFromPrice();
    });
  }

  ngOnInit(): void {
    this.loadClients();
    this.loadVehicles();
    this.loadSettings();

    const pId = this.route.snapshot.paramMap.get('id');
    if (pId) {
      this.isEditMode = true;
      this.contractId = pId;
      this.pageTitle = 'Modifier le Contrat';
      this.loadContract(pId);
    }
  }

  loadClients() {
    this.loadingClients = true;
    this.clientService.getList().subscribe({
      next: (res: any) => {
        this.clients = res.data || res;
        this.loadingClients = false;
      },
      error: () => this.loadingClients = false
    });
  }

  loadVehicles() {
    this.loadingVehicles = true;
    this.vehicleService.getList({ status: 'DISPONIBLE' }).subscribe({
      next: (res: any) => {
        this.vehicles = res.data || res;
        this.loadingVehicles = false;
      },
      error: () => this.loadingVehicles = false
    });
  }

  loadSettings() {
    this.settingService.getSettings().subscribe({
      next: (res: any) => {
        this.settings = res.data || res;
        if (!this.isEditMode && this.settings) {
          this.contractForm.patchValue({
            duration: this.settings.dureeContratDefautMois,
            penaltyRate: this.settings.penaliteRetardJournaliere,
            gracePeriod: this.settings.delaiGracePenalite,
          });
        }
      }
    });
  }

  calculateInitialDeposit(vehicleId: string) {
    if (!vehicleId || !this.settings || this.isEditMode) return;

    const vehicle = this.vehicles.find(v => v.uuid === vehicleId);
    if (vehicle) {
      const price = vehicle.prixDeVente || 0;
      const percentage = this.settings.apportInitialPourcentage || 0;
      const fees = this.settings.fraisDossier || 0;

      const deposit = (price * percentage / 100) + fees;
      this.contractForm.get('cautionAmount')?.setValue(deposit);
      this.contractForm.get('prixDeVente')?.setValue(price);
    }
  }

  toggleCautionEdit() {
    this.canEditCaution = !this.canEditCaution;
    const ctrl = this.contractForm.get('cautionAmount');
    if (this.canEditCaution) {
      ctrl?.enable();
    } else {
      ctrl?.disable();
    }
  }


  recalculateCautionFromPrice() {
    if (!this.settings || this.isEditMode || this.canEditCaution) return;

    const price = this.contractForm.get('prixDeVente')?.value || 0;
    const percentage = this.settings.apportInitialPourcentage || 0;
    const fees = this.settings.fraisDossier || 0;

    const deposit = (price * percentage / 100) + fees;
    this.contractForm.get('cautionAmount')?.setValue(deposit, { emitEvent: false });
  }

  loadContract(uuid: string) {
    this.loading = true;
    this.contractService.getSingle(uuid).subscribe({
      next: (res: any) => {
        this.contractForm.patchValue({
          clientId: res.client?.uuid,
          vehicleId: res.vehicle?.uuid,
          usageType: res.usageType,
          startDate: res.startDate ? res.startDate.substring(0, 10) : '',
          duration: res.durationInMonths,
          paymentFrequency: res.paymentFrequency,
          dailyRate: res.dailyRate,
          cautionAmount: res.caution,
          insuranceSplit: res.maintenanceAndInsurance,
          gracePeriod: res.gracePeriodDays,
          penaltyRate: res.penaltyRate,
          prixDeVente: res.prixDeVente,
          notes: res.observation,
          hasValidID: res.hasValidID,
          hasDriverLicense: res.hasDriverLicense,
          hasProofOfAddress: res.hasProofOfAddress,
          hasCriminalRecord: res.hasCriminalRecord
        });
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  calculateTotals() {
    const daily = this.contractForm.get('dailyRate')?.value || 0;
    const months = this.contractForm.get('duration')?.value || 0;
    const caution = this.contractForm.get('cautionAmount')?.value || 0;

    const total = (daily * months) + caution;
    this.contractForm.get('totalAmount')?.setValue(total, { emitEvent: false });

    // const margin = (daily * months) * 0.25;
    // this.contractForm.get('projectedMargin')?.setValue(margin, { emitEvent: false });
  }

  onConfirme() {
    this.submit = true;
    if (this.contractForm.invalid) {
      this.contractForm.markAllAsTouched();
      this.toast('Veuillez remplir correctement les champs obligatoires.', 'Erreur', 'warning');
      return;
    }

    Swal.fire({
      title: '',
      text: this.isEditMode ? "Confirmez-vous la modification de ce contrat ?" : "Confirmez-vous l'enregistrement de ce contrat ?",
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
    const data = {
      ...this.contractForm.getRawValue(),
      uuid: this.contractId
    };

    this.contractService.add(data).subscribe({
      next: () => {
        this.submitting = false;
        const msg = this.isEditMode ? 'Contrat mis à jour avec succès' : 'Contrat enregistré avec succès';
        this.toast(msg, 'Succès', 'success');
        this.router.navigate(['/gbatcar/contracts']);
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
}

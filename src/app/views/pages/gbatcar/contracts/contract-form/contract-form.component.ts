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
import { ContractDurationService } from '../../../../../core/services/contract/contract-duration.service';
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
  private durationService = inject(ContractDurationService);

  contractForm: FormGroup;
  isEditMode: boolean = false;
  contractId: string | null = null;
  clients: any[] = [];
  vehicles: any[] = [];
  brands: any[] = [];
  modelsByBrand: { [brandId: number]: any[] } = {};
  availableVehiclesByDemand: { [index: number]: any[] } = {};
  selectedVehiclesByDemand: { [index: number]: string[] } = {};

  loading: boolean = false;
  loadingDurations: boolean = false;
  submit: boolean = false;
  submitting: boolean = false;
  loadingClients: boolean = false;
  loadingVehicles: boolean = false;
  pageTitle: string = 'Nouveau Contrat';
  settings: any = null;
  durations: any[] = [];
  canEditCaution: boolean = false;
  canEditPrixDeVente: boolean = false;
  private isLoadingData: boolean = false; // Guard flag to prevent recalculating during data load

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
    const company = (item.companyName || '').toLowerCase();
    const manager = (item.managerName || '').toLowerCase();
    const reference = (item.uuid || '').toLowerCase();
    return nom.includes(term) || prenom.includes(term) || company.includes(term) || manager.includes(term) || reference.includes(term);
  };

  constructor() {
    this.contractForm = this.fb.group({
      clientId: [null, Validators.required],
      assignmentType: ['Specific', Validators.required], // 'Specific' ou 'Fleet'
      vehicleId: [null, Validators.required], // Optionnel conditionnellement
      vehicleDemands: this.fb.array([]), // FormArray pour les lignes de commande
      usageType: ['Personnel', Validators.required],
      startDate: [new Date().toISOString().substring(0, 10), Validators.required],
      duration: [36, [Validators.required, Validators.min(1)]],
      paymentFrequency: ['Monthly', Validators.required],
      dailyRate: [0, [Validators.required, Validators.min(0)]],
      cautionAmount: [{ value: 0, disabled: true }, [Validators.required, Validators.min(0)]],
      gracePeriod: [{ value: 2, disabled: true }, Validators.min(0)],
      penaltyRate: [{ value: 5, disabled: true }, Validators.min(0)],
      insuranceSplit: ['Included', Validators.required],
      totalAmount: [{ value: 0, disabled: true }],
      projectedMargin: [{ value: 0, disabled: true }],
      prixDeVente: [{ value: 0, disabled: true }],
      fraisDossier: [0],
      notes: [''],
      // Checklist
      hasValidID: [true],
      hasDriverLicense: [true],
      hasProofOfAddress: [false],
      hasCriminalRecord: [false]
    });

    // Auto-calculate specifically on dependency changes
    this.contractForm.get('paymentFrequency')?.valueChanges.subscribe(() => this.calculateRedevance());
    this.contractForm.get('duration')?.valueChanges.subscribe(() => this.calculateRedevance());
    this.contractForm.get('cautionAmount')?.valueChanges.subscribe(() => this.calculateRedevance());

    // Watch vehicle selection to calculate deposit
    this.contractForm.get('vehicleId')?.valueChanges.subscribe(vId => {
      this.calculateInitialDeposit(vId);
    });

    // Watch manual modifications to Redevance to strictly update the total simulation
    this.contractForm.get('dailyRate')?.valueChanges.subscribe(() => {
      this.calculateTotals();
    });

    // Watch assignment type to toggle validation and reset previous mode's data
    this.contractForm.get('assignmentType')?.valueChanges.subscribe(type => {
      const vIdCtrl = this.contractForm.get('vehicleId');
      if (type === 'Specific') {
        // Clear Fleet demands entirely — no empty rows needed in Specific mode
        while (this.vehicleDemandsArray.length) {
          this.vehicleDemandsArray.removeAt(0);
        }
        this.availableVehiclesByDemand = {};
        this.selectedVehiclesByDemand = {};
        vIdCtrl?.setValidators([Validators.required]);
      } else {
        // Reset Specific vehicle and financial fields
        vIdCtrl?.setValue(null);
        vIdCtrl?.clearValidators();
        this.contractForm.patchValue({
          prixDeVente: 0,
          cautionAmount: 0,
          fraisDossier: 0,
          dailyRate: 0,
          totalAmount: 0
        }, { emitEvent: false });
      }
      vIdCtrl?.updateValueAndValidity();
    });

    // Watch manual price changes to update deposit and redevance
    this.contractForm.get('prixDeVente')?.valueChanges.subscribe(() => {
      this.recalculateCautionFromPrice();
      this.calculateRedevance();
    });
  }

  ngOnInit(): void {
    const pId = this.route.snapshot.paramMap.get('id');
    if (pId) {
      this.isEditMode = true;
      this.contractId = pId;
      this.pageTitle = 'Modifier le Contrat';
    }

    // Pre-select client if UUID is passed in query parameters
    const queryClientUuid = this.route.snapshot.queryParamMap.get('clientUuid');
    if (queryClientUuid && !this.isEditMode) {
      this.contractForm.get('clientId')?.setValue(queryClientUuid);
    }

    this.loadClients();
    this.loadVehicles();
    this.loadBrands();
    this.loadSettings();
    this.loadDurations();

    if (this.isEditMode && this.contractId) {
      this.loadContract(this.contractId);
    } else if (this.contractForm.get('assignmentType')?.value === 'Fleet') {
      // Add one default empty demand row for user convenience only if in Fleet mode
      this.addVehicleDemand();
    }
  }

  get vehicleDemandsArray() {
    return this.contractForm.get('vehicleDemands') as any; // FormArray
  }

  addVehicleDemand() {
    const demand = this.fb.group({
      brandId: [null, Validators.required],
      modelId: [null, Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]]
    });

    // Écouter le changement de marque sur cette ligne
    const idx = this.vehicleDemandsArray.length;
    demand.get('brandId')?.valueChanges.subscribe(bId => {
      demand.get('modelId')?.setValue(null);
      delete this.availableVehiclesByDemand[idx];
      this.selectedVehiclesByDemand[idx] = [];
      if (bId) this.loadModelsForBrand(bId);
    });

    // Écouter le changement de modèle => chercher véhicules disponibles
    demand.get('modelId')?.valueChanges.subscribe(mId => {
      delete this.availableVehiclesByDemand[idx];
      this.selectedVehiclesByDemand[idx] = [];
      if (mId) this.loadAvailableVehiclesForDemand(idx, demand.get('brandId')?.value || 0, mId);
    });

    // Écouter quantité => auto-cocher
    demand.get('quantity')?.valueChanges.subscribe((qty: number | null) => {
      if (qty != null) this.autoSelectByQuantity(idx, qty);
    });

    this.vehicleDemandsArray.push(demand);
  }

  removeVehicleDemand(index: number) {
    this.vehicleDemandsArray.removeAt(index);
    delete this.availableVehiclesByDemand[index];
    delete this.selectedVehiclesByDemand[index];
  }

  loadAvailableVehiclesForDemand(index: number, brandId: number, modelId: number) {
    // Filter from already-loaded vehicles list by matching legacy string brand/model
    const brand = this.brands.find((b: any) => b.id === brandId);
    const models = this.modelsByBrand[brandId] || [];
    const model = models.find((m: any) => m.id === modelId);
    if (!brand || !model) return;

    this.availableVehiclesByDemand[index] = this.vehicles.filter((v: any) =>
      v.statut === 'Disponible' &&
      (v.marque?.toLowerCase() === brand.name?.toLowerCase() ||
        v.brand?.id === brandId) &&
      (v.modele?.toLowerCase() === model.name?.toLowerCase() ||
        v.vehicleModel?.id === modelId)
    );
    this.selectedVehiclesByDemand[index] = [];
  }

  isVehicleSelected(index: number, uuid: string): boolean {
    return (this.selectedVehiclesByDemand[index] || []).includes(uuid);
  }

  toggleVehicle(index: number, uuid: string) {
    if (!this.selectedVehiclesByDemand[index]) {
      this.selectedVehiclesByDemand[index] = [];
    }
    const sel = this.selectedVehiclesByDemand[index];
    const pos = sel.indexOf(uuid);
    if (pos === -1) {
      sel.push(uuid);
    } else {
      sel.splice(pos, 1);
    }
    // Sync quantity to number of selected vehicles
    const demand = this.vehicleDemandsArray.at(index);
    demand.get('quantity')?.setValue(sel.length || 1, { emitEvent: false });
    // Recalculate fleet totals
    this.calculateFleetTotals();
  }

  autoSelectByQuantity(index: number, qty: number) {
    const available = this.availableVehiclesByDemand[index] || [];
    const toSelect = available.slice(0, qty).map((v: any) => v.uuid);
    this.selectedVehiclesByDemand[index] = toSelect;
    this.calculateFleetTotals();
  }

  selectAllVehicles(index: number) {
    const available = this.availableVehiclesByDemand[index] || [];
    this.selectedVehiclesByDemand[index] = available.map((v: any) => v.uuid);
    const demand = this.vehicleDemandsArray.at(index);
    demand.get('quantity')?.setValue(available.length, { emitEvent: false });
    this.calculateFleetTotals();
  }

  deselectAllVehicles(index: number) {
    this.selectedVehiclesByDemand[index] = [];
    const demand = this.vehicleDemandsArray.at(index);
    demand.get('quantity')?.setValue(1, { emitEvent: false });
    this.calculateFleetTotals();
  }

  loadDurations() {
    this.loadingDurations = true;
    this.durationService.getAll().subscribe({
      next: (data) => {
        this.durations = data;
        this.loadingDurations = false;
      },
      error: () => this.loadingDurations = false
    });
  }

  addDurationTag = (name: string) => {
    return new Promise((resolve) => {
      // Append " mois" if not present
      const formattedName = name.toLowerCase().includes('mois') ? name : `${name} mois`;

      this.loadingDurations = true;
      this.durationService.create(formattedName).subscribe({
        next: (res: any) => {
          const newDuration = res.data || res;
          this.durations = [...this.durations, newDuration];
          this.loadingDurations = false;
          resolve(newDuration);
        },
        error: () => {
          this.loadingDurations = false;
          resolve(null);
        }
      });
    });
  };

  loadBrands() {
    this.vehicleService.getBrands().subscribe({
      next: (res: any) => {
        this.brands = res.data || res;
      }
    });
  }

  loadModelsForBrand(brandId: number) {
    if (this.modelsByBrand[brandId]) return; // Déjà chargé
    this.vehicleService.getModels(brandId).subscribe({
      next: (res: any) => {
        this.modelsByBrand[brandId] = res.data || res;
      }
    });
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
    const params: any = { status: 'DISPONIBLE', available_only: 'true' };
    if (this.isEditMode && this.contractId) {
      params.current_contract_uuid = this.contractId;
    }

    this.vehicleService.getList(params).subscribe({
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
      this.contractForm.get('fraisDossier')?.setValue(fees);
      this.contractForm.get('prixDeVente')?.setValue(price);

      if (vehicle.durationInMonths) {
        const durationValue = vehicle.durationInMonths;
        // Ensure duration exists in the dropdown list
        const exists = this.durations.some(d => d.monthsCount === durationValue);
        if (!exists) {
          this.durations = [...this.durations, {
            name: `${durationValue} mois`,
            monthsCount: durationValue
          }];
        }
        this.contractForm.get('duration')?.setValue(durationValue);
      }

      this.calculateRedevance();
    }
  }

  calculateFleetTotals() {
    if (!this.settings || this.isEditMode) return;

    const percentage = this.settings.apportInitialPourcentage || 0;
    const fees = this.settings.fraisDossier || 0;

    // Collect all selected vehicles across all demand rows
    const allSelectedUuids = Object.values(this.selectedVehiclesByDemand).flat();
    if (allSelectedUuids.length === 0) {
      this.contractForm.patchValue({ prixDeVente: 0, cautionAmount: 0, fraisDossier: 0, dailyRate: 0, totalAmount: 0 }, { emitEvent: false });
      return;
    }

    // Sum up prixDeVente of all selected vehicles
    const totalPrix = allSelectedUuids.reduce((sum, uuid) => {
      const v = this.vehicles.find((veh: any) => veh.uuid === uuid);
      return sum + (v?.prixDeVente || 0);
    }, 0);

    const totalDeposit = (totalPrix * percentage / 100) + fees;

    this.contractForm.get('prixDeVente')?.setValue(totalPrix, { emitEvent: false });
    this.contractForm.get('cautionAmount')?.setValue(totalDeposit, { emitEvent: false });
    this.contractForm.get('fraisDossier')?.setValue(fees, { emitEvent: false });
    this.calculateRedevance();
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

  togglePrixDeVenteEdit() {
    this.canEditPrixDeVente = !this.canEditPrixDeVente;
    const ctrl = this.contractForm.get('prixDeVente');
    if (this.canEditPrixDeVente) {
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
    this.contractForm.get('fraisDossier')?.setValue(fees, { emitEvent: false });
  }

  loadContract(uuid: string) {
    this.loading = true;
    this.isLoadingData = true; // Block auto-recalculation while patching
    this.contractService.getSingle(uuid).subscribe({
      next: (res: any) => {
        const data = res.contract || res;
        this.contractForm.patchValue({
          clientId: data.client?.uuid,
          vehicleId: data.vehicle?.uuid,
          usageType: data.usageType,
          startDate: data.startDate ? data.startDate.substring(0, 10) : '',
          duration: data.durationInMonths,
          paymentFrequency: data.paymentFrequency,
          dailyRate: data.dailyRate,
          cautionAmount: data.caution,
          fraisDossier: data.fraisDossier,
          insuranceSplit: data.maintenanceAndInsurance,
          gracePeriod: data.gracePeriodDays,
          penaltyRate: data.penaltyRate,
          prixDeVente: data.prixDeVente,
          notes: data.observation,
          hasValidID: data.hasValidID,
          hasDriverLicense: data.hasDriverLicense,
          hasProofOfAddress: data.hasProofOfAddress,
          hasCriminalRecord: data.hasCriminalRecord
        });

        // Check if status allows editing
        const status = (data.status || '').toUpperCase();
        const nonEditableStatuses = ['VALIDÉ', 'VALIDATED', 'ACTIVE', 'EN COURS', 'TERMINÉ', 'SOLDÉ', 'RÉSILIÉ', 'ROMPU'];
        if (nonEditableStatuses.includes(status)) {
          this.contractForm.disable();
          this.isEditMode = false; // Effectively view mode
          this.pageTitle = 'Consulter le Contrat (Lecture seule)';
          this.toast('Ce contrat est verrouillé car il est ' + (data.status || 'actif'), 'Lecture seule', 'info');
        }

        // Charger les lignes de demandes
        if (data.vehicleDemands && data.vehicleDemands.length > 0) {
          this.contractForm.get('assignmentType')?.setValue('Fleet');
          data.vehicleDemands.forEach((demand: any) => {
            if (demand.brand?.id) this.loadModelsForBrand(demand.brand.id);
            this.vehicleDemandsArray.push(this.fb.group({
              brandId: [demand.brand?.id, Validators.required],
              modelId: [demand.vehicleModel?.id, Validators.required],
              quantity: [demand.quantity || 1, [Validators.required, Validators.min(1)]]
            }));
          });
        } else if (!data.vehicle) {
          this.contractForm.get('assignmentType')?.setValue('Fleet');
          this.addVehicleDemand();
        } else {
          this.contractForm.get('assignmentType')?.setValue('Specific');
        }

        // Restore totalAmount from saved value, not recalculate
        this.contractForm.get('totalAmount')?.setValue(data.totalAmount, { emitEvent: false });
        this.isLoadingData = false; // Allow future user-triggered recalculations
        this.loading = false;
      },
      error: () => {
        this.isLoadingData = false;
        this.loading = false;
      }
    });
  }

  calculateRedevance() {
    if (this.isLoadingData) return; // Don't overwrite backend value during data loading
    const prixDeVente = this.contractForm.get('prixDeVente')?.value || 0;
    const caution = this.contractForm.get('cautionAmount')?.value || 0;
    const duration = this.contractForm.get('duration')?.value || 0;
    const frequency = this.contractForm.get('paymentFrequency')?.value || 'Monthly';

    if (prixDeVente <= 0 || duration <= 0) return;

    const resteAPayer = prixDeVente - caution;
    if (resteAPayer < 0) return;

    let numberOfPeriods = 0;
    if (frequency === 'Monthly') {
      numberOfPeriods = duration;
    } else if (frequency === 'Weekly') {
      numberOfPeriods = duration * 4;
    } else if (frequency === 'Daily') {
      numberOfPeriods = duration * 30;
    }

    if (numberOfPeriods > 0) {
      const redevance = Math.round(resteAPayer / numberOfPeriods);
      this.contractForm.get('dailyRate')?.setValue(redevance, { emitEvent: false });
    }

    this.calculateTotals();
  }

  calculateTotals() {
    const redevance = this.contractForm.get('dailyRate')?.value || 0;
    const durationMois = this.contractForm.get('duration')?.value || 0;
    const caution = this.contractForm.get('cautionAmount')?.value || 0;
    const freq = this.contractForm.get('paymentFrequency')?.value || 'Monthly';

    let numberOfPeriods = 0;
    if (freq === 'Monthly') {
      numberOfPeriods = durationMois;
    } else if (freq === 'Weekly') {
      numberOfPeriods = durationMois * 4;
    } else if (freq === 'Daily') {
      numberOfPeriods = durationMois * 30;
    }

    const total = (redevance * numberOfPeriods) + caution;
    this.contractForm.get('totalAmount')?.setValue(total, { emitEvent: false });
  }

  onConfirme() {
    this.submit = true;
    if (this.contractForm.invalid) {
      this.contractForm.markAllAsTouched();
      // Debug: Log invalid controls
      const invalidControls = [];
      const controls = this.contractForm.controls;
      for (const name in controls) {
        if (controls[name].invalid) {
          invalidControls.push(name);
        }
      }
      console.log('Invalid Controls:', invalidControls);

      this.toast(`Champs invalides : ${invalidControls.join(', ')}`, 'Erreur de validation', 'warning');
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
    const formValue = this.contractForm.getRawValue();

    // Nettoyer le payload selon le mode d'affectation
    if (formValue.assignmentType === 'Specific') {
      delete formValue.vehicleDemands;
    } else {
      delete formValue.vehicleId;
      // Filtrer les lignes vides et y ajouter les véhicules sélectionnés
      if (formValue.vehicleDemands) {
        formValue.vehicleDemands = formValue.vehicleDemands
          .filter((d: any) => d.brandId && d.modelId)
          .map((d: any, i: number) => ({
            ...d,
            assignedVehicleIds: this.selectedVehiclesByDemand[i] || []
          }));
      }
    }

    const data = {
      ...formValue,
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

  // Translation helper
  translateFrequency(value?: string): string {
    if (!value) return '';
    const normalized = value.toLowerCase();
    if (normalized === 'monthly') return 'Mensuel';
    if (normalized === 'weekly') return 'Hebdomadaire';
    if (normalized === 'daily') return 'Journalier';
    return value;
  }
}

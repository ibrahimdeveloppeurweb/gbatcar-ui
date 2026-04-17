import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';
import { ContractService } from '../../../../../core/services/contract/contract.service';
import { PaymentService } from '../../../../../core/services/payment/payment.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { PaymentScheduleService } from '../../../../../core/services/payment/payment-schedule.service';
import Swal from 'sweetalert2';
import { NgxPermissionsModule, NgxPermissionsService } from 'ngx-permissions';
import { AuthService } from '../../../../../core/services/auth/auth.service';

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FeatherIconDirective, NgSelectModule, NgxPermissionsModule],
  templateUrl: './payment-form.component.html',
  styleUrl: './payment-form.component.scss'
})
export class PaymentFormComponent implements OnInit {

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private contractService = inject(ContractService);
  private paymentService = inject(PaymentService);
  private scheduleService = inject(PaymentScheduleService);
  private permissionsService = inject(NgxPermissionsService);
  private authService = inject(AuthService);

  paymentForm: FormGroup;
  contracts: any[] = [];
  loadingContracts: boolean = false;
  loadingSchedule: boolean = false;
  noScheduleError: boolean = false;
  submitting: boolean = false;
  selectedFile: File | null = null;
  selectedFrequency: string = 'Monthly';
  isEditMode: boolean = false;
  paymentUuid: string | null = null;

  nextInstallment: any = null;
  remainingBalance: number = 0;

  // Simulation data
  fullSchedules: any[] = []; // Store raw schedule to simulate on
  simulatedAllocations: any[] = [];
  simulatedExcess: number = 0;
  originalPaymentDate: string | null = null;

  contractSearchFn = (term: string, item: any) => {
    term = term.toLowerCase();
    const ref = (item.reference || '').toLowerCase();
    const clientNom = (item.client?.lastName || '').toLowerCase();
    const clientPrenom = (item.client?.firstName || '').toLowerCase();
    const vehSummary = (item.vehicleSummary || '').toLowerCase();
    return ref.includes(term) || clientNom.includes(term) || clientPrenom.includes(term) || vehSummary.includes(term);
  };

  constructor() {
    this.paymentForm = this.fb.group({
      contractId: [null, Validators.required],
      date: [this.getLocalISOString(new Date()), Validators.required],
      amount: [null, [Validators.required, Validators.min(1)]],
      method: ['Mobile Money', Validators.required],
      reference: [''],
      type: ['Mensualité', Validators.required],
      period: [new Date().toISOString().substring(0, 7), Validators.required],
      notes: ['']
    });

    // Watch contract selection to set default amount (redevance) and frequency
    this.paymentForm.get('contractId')?.valueChanges.subscribe(uuid => {
      if (uuid && !this.isEditMode) { // Only auto-set if creating a new one
        this.applyContractDefaults(uuid);
      }
    });

    // Watch amount changes to simulate allocation
    this.paymentForm.get('amount')?.valueChanges.subscribe(() => {
      this.calculateSimulation();
    });
  }

  ngOnInit(): void {
    const permissions = this.authService.getPermissions();
    this.permissionsService.loadPermissions(permissions);
    this.loadContracts();
    this.paymentUuid = this.route.snapshot.paramMap.get('id');
    if (this.paymentUuid) {
      this.isEditMode = true;
      this.loadPaymentDetails(this.paymentUuid);
    } else {
      // Pre-select fields if passed in query parameters (e.g. from Penalty Solder action)
      const q = this.route.snapshot.queryParamMap;
      const contractId = q.get('contractId') || q.get('contractUuid');
      const amount = q.get('amount');
      const type = q.get('type');
      const penaltyRef = q.get('penaltyRef');

      if (contractId) {
        this.paymentForm.get('contractId')?.setValue(contractId);
      }
      if (amount) {
        this.paymentForm.get('amount')?.setValue(Number(amount));
      }
      if (type) {
        this.paymentForm.get('type')?.setValue(type);
      }
      if (penaltyRef) {
        this.paymentForm.get('notes')?.setValue(`Règlement amende ${penaltyRef}`);
      }
    }
  }

  applyContractDefaults(uuid: string) {
    const contract = this.contracts.find(c => c.uuid === uuid);
    if (contract) {
      this.selectedFrequency = contract.paymentFrequency || 'Monthly';
      this.remainingBalance = (contract.totalAmount || 0) - (contract.paidAmount || 0);

      // Only set default amount if creating a NEW payment
      if (!this.isEditMode && contract.dailyRate) {
        this.paymentForm.get('amount')?.setValue(contract.dailyRate);
      }

      // Fetch schedule to find next due period
      this.loadingSchedule = true;
      this.scheduleService.getList(uuid).subscribe({
        next: (schedules: any[]) => {
          this.loadingSchedule = false;
          this.fullSchedules = schedules || [];
          this.noScheduleError = !schedules || schedules.length === 0;

          // Compute virtual pending schedules for Simulation AND Summary
          const originalDateStr = this.originalPaymentDate ? new Date(this.originalPaymentDate).toISOString().substring(0, 10) : null;
          const pendingSchedulesForSimulation = (schedules || []).map(s => {
            const schedule = { ...s };
            if (this.isEditMode && schedule.status === 'Payé' && schedule.paidAt) {
              const paidAtDate = new Date(schedule.paidAt).toISOString().substring(0, 10);
              if (paidAtDate === originalDateStr) {
                schedule.status = 'À venir';
                schedule.paidAmount = 0;
              }
            }
            return schedule;
          });

          const totalScheduled = (schedules || []).reduce((acc, s) => acc + (s.amount || 0), 0);
          const totalPaidOnSchedules = (schedules || []).reduce((acc, s) => acc + (s.paidAmount || 0), 0);

          if (this.isEditMode) {
            const currentAmount = this.paymentForm.get('amount')?.value || 0;
            // Add back the current payment to show what's left to pay if THIS payment wasn't there
            this.remainingBalance = Math.max(0, totalScheduled - totalPaidOnSchedules + currentAmount);
          } else {
            this.remainingBalance = Math.max(0, totalScheduled - totalPaidOnSchedules);
          }

          if (this.noScheduleError) {
            this.nextInstallment = null;
            this.setPeriodFromDate(new Date());
            return;
          }

          this.nextInstallment = (schedules || []).find(s => s.status === 'À venir' || s.status === 'En retard' || (s.amount - (s.paidAmount || 0)) > 0.01);

          // In EDIT MODE, if everything is 'À jour', but we are editing the payment that MADE it à jour,
          // we want to show that payment's impact. Use the first virtually re-opened schedule.
          if (this.isEditMode && !this.nextInstallment) {
            this.nextInstallment = pendingSchedulesForSimulation.find(s => true);
          }

          if (this.nextInstallment && this.nextInstallment.expectedDate) {
            const date = new Date(this.nextInstallment.expectedDate);
            this.setPeriodFromDate(date);
          } else {
            this.setPeriodFromDate(new Date());
          }

          // Set default type based on frequency if creating new
          if (!this.isEditMode) {
            const freq = contract.paymentFrequency;
            let defaultType = 'Mensualité';
            if (freq === 'Weekly') defaultType = 'Hebdomadaire';
            if (freq === 'Daily') defaultType = 'Journalier';
            this.paymentForm.get('type')?.setValue(defaultType);
          }

          // Trigger initial simulation
          this.calculateSimulation();
        },
        error: () => {
          this.loadingSchedule = false;
          this.noScheduleError = false;
          this.setPeriodFromDate(new Date());
        }
      });
    }
  }

  calculateSimulation() {
    const type = this.paymentForm.get('type')?.value;
    const isInstallmentType = ['Mensualité', 'Hebdomadaire', 'Journalier', 'Loyer', 'Recette Journalière', 'Recette Hebdomadaire'].includes(type);

    if (!this.fullSchedules || this.fullSchedules.length === 0 || !isInstallmentType) {
      this.simulatedAllocations = [];
      this.simulatedExcess = 0;
      return;
    }

    let remaining = this.paymentForm.get('amount')?.value || 0;

    const paymentDate = this.paymentForm.get('date')?.value;
    const originalDateStr = this.originalPaymentDate ? new Date(this.originalPaymentDate).toISOString().substring(0, 10) : null;
    const currentFormDateStr = paymentDate ? new Date(paymentDate).toISOString().substring(0, 10) : null;

    // Process installments
    const pendingSchedules = this.fullSchedules.map(s => {
      const schedule = { ...s };
      // If we are in edit mode, we "virtually" reset schedules that were paid at the same time as this payment
      // so the simulation can show how the current amount is distributed over them.
      if (this.isEditMode && schedule.status === 'Payé' && schedule.paidAt) {
        const paidAtDate = new Date(schedule.paidAt).toISOString().substring(0, 10);
        if (paidAtDate === originalDateStr) {
          schedule.status = 'À venir';
          schedule.paidAmount = 0;
        }
      }
      return schedule;
    }).filter(s => s.status === 'À venir' || s.status === 'En retard' || s.status === 'Partiel' || (s.amount - (s.paidAmount || 0)) > 0.01)
      .sort((a, b) => new Date(a.expectedDate).getTime() - new Date(b.expectedDate).getTime());

    const allocations: any[] = [];

    for (const schedule of pendingSchedules) {
      if (remaining <= 0) break;

      const due = schedule.amount;
      const alreadyPaid = schedule.paidAmount || 0;
      const stillOwed = due - alreadyPaid;

      let coveredAmount = 0;
      let status = '';
      let isPartial = false;

      if (remaining >= stillOwed) {
        coveredAmount = stillOwed;
        remaining -= stillOwed;
        status = 'Complet';
        isPartial = false;
      } else {
        coveredAmount = remaining;
        remaining = 0;
        status = 'Partiel';
        isPartial = true;
      }

      allocations.push({
        date: schedule.expectedDate,
        due: due,
        wasPaid: alreadyPaid,
        willPay: coveredAmount,
        status: status,
        isPartial: isPartial
      });
    }

    this.simulatedAllocations = allocations;
    this.simulatedExcess = remaining;

    // Update the 'period' field automatically based on covered periods
    if (allocations.length > 0) {
      const periods = allocations.map(a => this.formatPeriod(new Date(a.date)));
      const uniquePeriods = Array.from(new Set(periods));

      let periodValue = '';
      if (uniquePeriods.length > 4) {
        periodValue = `${uniquePeriods[0]} -> ${uniquePeriods[uniquePeriods.length - 1]}`;
      } else {
        periodValue = uniquePeriods.join(', ');
      }
      this.paymentForm.get('period')?.setValue(periodValue);
    }
  }

  private formatPeriod(date: Date): string {
    if (this.selectedFrequency === 'Daily') {
      return date.toLocaleDateString('fr-FR');
    } else if (this.selectedFrequency === 'Weekly') {
      // Calculate week number
      const oneJan = new Date(date.getFullYear(), 0, 1);
      const numberOfDays = Math.floor((date.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
      const weekNumber = Math.ceil((date.getDay() + 1 + numberOfDays) / 7);
      return `Sem ${weekNumber}`;
    } else {
      return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    }
  }

  private setPeriodFromDate(date: Date) {
    if (this.selectedFrequency === 'Daily') {
      this.paymentForm.get('period')?.setValue(date.toISOString().substring(0, 10));
    } else if (this.selectedFrequency === 'Weekly') {
      const oneJan = new Date(date.getFullYear(), 0, 1);
      const numberOfDays = Math.floor((date.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
      const weekNumber = Math.ceil((date.getDay() + 1 + numberOfDays) / 7);
      const weekStr = `${date.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
      this.paymentForm.get('period')?.setValue(weekStr);
    } else {
      this.paymentForm.get('period')?.setValue(date.toISOString().substring(0, 7));
    }
  }

  loadPaymentDetails(uuid: string) {
    this.paymentService.getSingle(uuid).subscribe({
      next: (res: any) => {
        const payment = res.data || res;
        this.originalPaymentDate = payment.date;
        // IMPORTANT: Set frequency BEFORE patching values so the correct input field is shown
        if (payment.contract) {
          this.selectedFrequency = payment.contract.paymentFrequency || 'Monthly';
        }

        this.paymentForm.patchValue({
          contractId: payment.contract?.uuid,
          date: payment.date ? this.getLocalISOString(new Date(payment.date)) : null,
          amount: payment.amount,
          method: payment.method,
          reference: payment.reference,
          type: payment.type,
          period: payment.period,
          notes: payment.observation
        });

        // RE-TRIGGER schedule loading and simulation for edit mode
        if (payment.contract?.uuid) {
          this.applyContractDefaults(payment.contract.uuid);
        }
      },
      error: () => this.toast('Impossible de charger les détails du paiement', 'Erreur', 'error')
    });
  }

  loadContracts() {
    this.loadingContracts = true;
    this.contractService.getList({ status: 'VALIDÉ' }).subscribe({
      next: (res: any) => {
        this.contracts = res.data || res;
        this.loadingContracts = false;

        // If a contract was already selected (e.g. via query params), apply its defaults now that the list is loaded
        const currentId = this.paymentForm.get('contractId')?.value;
        if (currentId && !this.isEditMode) {
          this.applyContractDefaults(currentId);
        }
      },
      error: () => this.loadingContracts = false
    });
  }

  onFileChange(event: any) {
    if (event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }

  onConfirme() {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      this.toast('Veuillez remplir correctement les champs obligatoires.', 'Erreur', 'warning');
      return;
    }

    Swal.fire({
      title: '',
      text: `Confirmez-vous ${this.isEditMode ? 'la modification' : "l'enregistrement"} de ce paiement ?`,
      icon: 'warning',
      showCancelButton: true,
      showCloseButton: true,
      confirmButtonText: 'Confirmer <i class="fas fa-check"></i>',
      cancelButtonText: 'Annuler <i class="feather icon-x-circle"></i>',
      confirmButtonColor: '#1bc943',
      reverseButtons: true
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.onSubmit();
      }
    });
  }

  onSubmit() {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const formData = new FormData();
    const formValues = this.paymentForm.value;

    Object.keys(formValues).forEach(key => {
      if (formValues[key] !== null && formValues[key] !== undefined) {
        formData.append(key, formValues[key]);
      }
    });

    if (this.isEditMode && this.paymentUuid) {
      formData.append('uuid', this.paymentUuid);
    }

    if (this.selectedFile) {
      formData.append('receiptFile', this.selectedFile);
    }

    this.paymentService.add(formData).subscribe({
      next: () => {
        this.submitting = false;
        this.toast(`Paiement ${this.isEditMode ? 'modifié' : 'enregistré'} avec succès`, 'Succès', 'success');
        this.router.navigate(['/gbatcar/payments']);
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

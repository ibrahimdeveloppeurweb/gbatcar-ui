import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';
import { ContractService } from '../../../../../core/services/contract/contract.service';
import { Contract } from '../../../../../core/models/contract.model';
import { PaymentService } from '../../../../../core/services/payment/payment.service';
import { PaymentScheduleService } from '../../../../../core/services/payment/payment-schedule.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { environment } from '../../../../../../environments/environment';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-contract-details',
  standalone: true,
  imports: [CommonModule, RouterModule, NgbNavModule, FeatherIconDirective, ReactiveFormsModule],
  templateUrl: './contract-details.component.html',
  styleUrl: './contract-details.component.scss'
})
export class ContractDetailsComponent implements OnInit {

  contract: Contract | null = null;
  loading: boolean = true;
  activeId = 1;

  private contractService = inject(ContractService);
  private route = inject(ActivatedRoute);
  private paymentService = inject(PaymentService);
  private scheduleService = inject(PaymentScheduleService);
  private modalService = inject(NgbModal);
  private fb = inject(FormBuilder);

  baseUrl = environment.serverUrl.replace('/api', '');

  schedules: any[] = [];
  scheduleForm: FormGroup;

  constructor() {
    this.scheduleForm = this.fb.group({
      totalAmount: [0, [Validators.required, Validators.min(1)]],
      installments: [1, [Validators.required, Validators.min(1)]],
      startDate: ['', Validators.required],
      ruleDay: [1, Validators.required],
      excludeSundays: [false]
    });
  }

  openReceipt(url: string): void {
    if (url) {
      window.open(this.baseUrl + url, '_blank');
    } else {
      Swal.fire({
        title: 'Reçu non disponible',
        text: "Aucun fichier de justificatif n'a été téléversé pour ce paiement. L'impression du reçu officiel généré par le système sera disponible très prochainement.",
        icon: 'info',
        confirmButtonText: 'Compris'
      });
    }
  }

  validatePayment(uuid: string): void {
    Swal.fire({
      title: 'Valider ce paiement ?',
      text: "L'encaissement sera confirmé et le solde du contrat mis à jour.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Oui, valider',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#2ecc71',
      cancelButtonColor: '#d33'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.paymentService.changeStatus(uuid, 'Validé').subscribe({
          next: () => {
            Swal.fire({
              title: 'Succès',
              text: 'Le paiement a été validé.',
              icon: 'success',
              timer: 1500
            });
            const contractUuid = this.route.snapshot.paramMap.get('id');
            if (contractUuid) this.loadContract(contractUuid);
          },
          error: (err: any) => {
            console.error(err);
            Swal.fire('Erreur', 'Impossible de valider le paiement.', 'error');
            this.loading = false;
          }
        });
      }
    });
  }

  deletePayment(uuid: string): void {
    Swal.fire({
      title: 'Supprimer ce paiement ?',
      text: "Cette action est irréversible !",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#e74c3c',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.paymentService.delete(uuid).subscribe({
          next: () => {
            Swal.fire({
              title: 'Supprimé',
              text: 'Le paiement a été retiré.',
              icon: 'success',
              timer: 1500
            });
            const contractUuid = this.route.snapshot.paramMap.get('id');
            if (contractUuid) this.loadContract(contractUuid);
          },
          error: (err: any) => {
            console.error(err);
            Swal.fire('Erreur', 'Impossible de supprimer le paiement.', 'error');
            this.loading = false;
          }
        });
      }
    });
  }

  punctualityHistory: any[] = [];

  gpsStatus = {
    connected: false,
    lastUpdate: 'Non disponible',
    lastLocation: 'Inconnue',
    engineStatus: 'Inconnu'
  };

  ngOnInit(): void {
    const uuid = this.route.snapshot.paramMap.get('id');
    if (uuid) {
      this.loadContract(uuid);
    } else {
      this.loading = false;
    }
  }

  loadContract(uuid: string): void {
    this.loading = true;
    this.contractService.getSingle(uuid).subscribe({
      next: (res: any) => {
        this.contract = res.data || res;

        // Force sorting DESC by entry time/ID
        if (this.contract && this.contract.payments) {
          this.contract.payments.sort((a: any, b: any) => {
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : (a.id || 0);
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : (b.id || 0);
            return timeB - timeA;
          });
        }

        this.generatePunctualityHistory();
        this.updateGpsStatus();
        this.loadSchedules(uuid);
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Erreur lors du chargement du contrat:', err);
        Swal.fire('Erreur', 'Impossible de charger les détails du contrat.', 'error');
        this.loading = false;
      }
    });
  }

  generatePunctualityHistory(): void {
    if (!this.contract) return;

    const frequency = (this.contract.paymentFrequency || 'Monthly').toLowerCase();
    let prefix = 'M';
    let unit: 'month' | 'week' | 'day' = 'month';

    if (frequency === 'daily') {
      prefix = 'J';
      unit = 'day';
    } else if (frequency === 'weekly') {
      prefix = 'S';
      unit = 'week';
    }

    this.punctualityHistory = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = this.contract.startDate ? new Date(this.contract.startDate) : null;
    if (startDate) startDate.setHours(0, 0, 0, 0);

    for (let i = 5; i >= 0; i--) {
      const periodDate = new Date(today);
      if (unit === 'day') periodDate.setDate(today.getDate() - i);
      else if (unit === 'week') periodDate.setDate(today.getDate() - (i * 7));
      else periodDate.setMonth(today.getMonth() - i);

      let status = 'À jour';

      // Si la période est avant le début du contrat
      if (startDate && periodDate < startDate) {
        status = 'N/A';
      } else {
        // Logique de retard :
        // Si c'est une période passée (i > 0) et qu'il n'y a AUCUN paiement
        const hasPayments = (this.contract.payments && this.contract.payments.length > 0);
        if (i > 0 && !hasPayments) {
          status = 'En retard';
        }
        // Pour la période actuelle (i = 0), on se base sur le statut global de paiement du contrat
        if (i === 0) {
          status = (this.contract.paymentStatus === 'En retard' || this.contract.paymentStatus === 'Impayé définitif' || this.contract.paymentStatus === 'PENDING')
            ? 'En retard' : 'À jour';
        }
      }

      let label = `${prefix}-${i}`;
      if (i === 0) {
        if (unit === 'day') label = 'Aujourd\'hui';
        else if (unit === 'week') label = 'Cette Semaine';
        else label = 'Ce Mois';
      } else if (i === 1) {
        if (unit === 'day') label = 'Hier';
        else if (unit === 'week') label = 'Semaine Dernière';
        else label = 'Mois Dernier';
      }

      this.punctualityHistory.push({
        month: label,
        status: status
      });
    }
  }

  getFrequencyLabel(): string {
    if (!this.contract) return '6m';
    const freq = (this.contract.paymentFrequency || 'Monthly').toLowerCase();
    if (freq === 'daily') return '6j';
    if (freq === 'weekly') return '6s';
    return '6m';
  }

  updateGpsStatus(): void {
    if (this.contract) {
      this.gpsStatus.connected = this.contract.status !== 'Résilié' && this.contract.status !== 'Soldé';
      if (this.contract.paymentStatus === 'Impayé définitif') {
        this.gpsStatus.engineStatus = 'Immobilisé';
      } else {
        this.gpsStatus.engineStatus = 'Tournant';
      }
      this.gpsStatus.lastUpdate = 'Vérifié récemment';
    }
  }

  get totalPaidIncludingDeposit(): number {
    if (!this.contract) return 0;
    return this.contract.paidAmount || 0;
  }

  get remainingBalance(): number {
    if (!this.contract || !this.contract.totalAmount) return 0;
    const netTotal = (this.contract.totalAmount || 0);
    return Math.max(0, netTotal - this.totalPaidIncludingDeposit);
  }

  get progressPercentage(): number {
    if (!this.contract || !this.contract.totalAmount) return 0;
    const netTotal = this.contract.totalAmount;
    if (netTotal <= 0) return 0;
    return ((this.contract.paidAmount ?? 0) / netTotal) * 100;
  }

  getFrequencyType(): 'monthly' | 'weekly' | 'daily' {
    if (!this.contract || !this.contract.paymentFrequency) return 'monthly';
    const freq = this.contract.paymentFrequency.toLowerCase();
    if (freq.includes('hebdomadaire') || freq === 'weekly') return 'weekly';
    if (freq.includes('journalier') || freq.includes('quotidien') || freq === 'daily') return 'daily';
    return 'monthly';
  }

  // --- Payment Schedule Logic ---
  loadSchedules(contractUuid: string): void {
    this.scheduleService.getList(contractUuid).subscribe({
      next: (res: any) => {
        this.schedules = res || [];
      },
      error: (err) => console.error('Error fetching schedules', err)
    });
  }

  openScheduleModal(content: any): void {
    const netTotal = (this.contract?.totalAmount || 0);
    const balance = Math.max(0, netTotal - this.totalPaidIncludingDeposit);

    const freq = this.getFrequencyType();
    const today = new Date();

    let defaultRuleDay = 1;
    if (freq === 'monthly') defaultRuleDay = today.getDate() > 28 ? 28 : today.getDate();
    if (freq === 'weekly') defaultRuleDay = today.getDay() || 7; // 1=Mon...7=Sun

    let defaultInstallments = this.contract?.durationInMonths || 1;
    if (freq === 'weekly') defaultInstallments = defaultInstallments * 4;
    if (freq === 'daily') defaultInstallments = defaultInstallments * 30;

    // Auto-fill form
    this.scheduleForm.patchValue({
      totalAmount: balance > 0 ? balance : netTotal,
      installments: defaultInstallments,
      startDate: today.toISOString().substring(0, 10),
      ruleDay: defaultRuleDay,
      excludeSundays: false
    });

    this.modalService.open(content, { centered: true });
  }

  generateSchedule(modal: any): void {
    if (this.scheduleForm.invalid) {
      Swal.fire('Erreur', 'Veuillez remplir correctement tous les champs.', 'warning');
      return;
    }

    if (!this.contract || !this.contract.uuid) return;

    this.loading = true;
    const data = {
      contractUuid: this.contract.uuid,
      ...this.scheduleForm.value
    };

    this.scheduleService.generateSchedule(data).subscribe({
      next: (res) => {
        Swal.fire('Succès', 'Échéancier généré avec succès', 'success');
        this.schedules = res || [];
        modal.close();
        this.loading = false;
      },
      error: (err) => {
        Swal.fire('Erreur', err?.error?.message || 'Erreur lors de la génération', 'error');
        this.loading = false;
      }
    });
  }

  markOverdueSchedules(): void {
    this.loading = true;
    this.scheduleService.markOverdue().subscribe({
      next: (res) => {
        if (res?.updated > 0) {
          Swal.fire('Mise à jour', `${res.updated} échéance(s) passée(s) en "En retard".`, 'warning');
        } else {
          Swal.fire('Aucun retard', 'Toutes les échéances sont à jour.', 'success');
        }
        // Reload schedules to reflect new statuses
        if (this.contract?.uuid) this.loadSchedules(this.contract.uuid);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        Swal.fire('Erreur', 'Impossible de mettre à jour les retards.', 'error');
      }
    });
  }

  // File Upload Logic
  onFileSelected(event: any): void {
    const files: FileList = event.target.files;
    if (files && files.length > 0) {
      if (!this.contract || !this.contract.uuid) return;
      const contractUuid = this.contract.uuid as string;

      Swal.fire({
        title: 'Titre du document',
        text: 'Veuillez saisir un libellé (nom) pour ce(s) fichier(s)',
        input: 'text',
        inputPlaceholder: 'Ex: Avenant N°1...',
        showCancelButton: true,
        confirmButtonText: 'Ajouter',
        cancelButtonText: 'Annuler',
        inputValidator: (value) => {
          if (!value) {
            return 'Vous devez saisir un libellé !';
          }
          return null;
        }
      }).then((result) => {
        if (result.isConfirmed) {
          const formData = new FormData();
          for (let i = 0; i < files.length; i++) {
            formData.append('files[]', files[i]);
          }
          formData.append('libelle', result.value);

          this.loading = true;
          this.contractService.uploadDocument(contractUuid, formData).subscribe({
            next: (res) => {
              Swal.fire({
                icon: 'success',
                title: 'Succès',
                text: res.message || 'Fichiers ajoutés avec succès',
                timer: 2000,
                showConfirmButton: false
              });
              this.loadContract(contractUuid); // Reload to get updated documents
            },
            error: (err) => {
              console.error("Erreur lors de l'upload:", err);
              Swal.fire('Erreur', "L'envoi des fichiers a échoué.", 'error');
              this.loading = false;
            }
          });
        } else {
          // Si l'utilisateur annule, on vide l'input file
          event.target.value = '';
        }
      });
    }
  }

  downloadDocument(docUuid: string): void {
    if (!this.contract || !this.contract.uuid) return;
    const contractUuid = this.contract.uuid as string;
    this.contractService.downloadDocument(contractUuid, docUuid);
  }

  deleteDocument(docUuid: string): void {
    if (!this.contract || !this.contract.uuid) return;
    const contractUuid = this.contract.uuid as string;

    Swal.fire({
      title: 'Êtes-vous sûr ?',
      text: "Voulez-vous vraiment supprimer ce document ?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, supprimer!',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#d33'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.contractService.deleteDocument(contractUuid, docUuid).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Supprimé!',
              text: 'Le document a été supprimé.',
              timer: 1500,
              showConfirmButton: false
            });
            this.loadContract(contractUuid);
          },
          error: (err) => {
            console.error("Erreur lors de la suppression:", err);
            Swal.fire('Erreur', 'Impossible de supprimer le document.', 'error');
            this.loading = false;
          }
        });
      }
    });
  }

  validateContract(): void {
    if (!this.contract || !this.contract.uuid) return;
    const uuid = this.contract.uuid;

    Swal.fire({
      title: 'Valider le contrat ?',
      text: "Le contrat prendra effet à partir d'aujourd'hui. Les échéances commenceront à courir.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Oui, valider',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#2ecc71'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.contractService.validate(uuid).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Contrat Validé !',
              text: 'Le contrat est maintenant actif.',
              timer: 2000,
              showConfirmButton: false
            });
            this.loadContract(uuid);
          },
          error: (err) => {
            console.error("Erreur lors de la validation:", err);
            Swal.fire('Erreur', err?.error?.message || 'Impossible de valider le contrat.', 'error');
            this.loading = false;
          }
        });
      }
    });
  }

  // Translation helpers for UI
  translateFrequency(value?: string): string {
    if (!value) return 'Non Renseigné';
    const normalized = value.toLowerCase();
    if (normalized === 'monthly') return 'Mensuel';
    if (normalized === 'weekly') return 'Hebdomadaire';
    if (normalized === 'daily') return 'Journalier';
    return value;
  }

  translateMaintenance(value?: string): string {
    if (!value) return 'Aux frais du locataire';
    const normalized = value.toLowerCase();
    if (normalized === 'included') return 'Inclus dans la redevance (Full Service)';
    if (normalized === 'not included') return 'À la charge du client';
    return value;
  }

  translateStatus(status?: string): string {
    if (!status) return 'Inconnu';
    const normalized = status.toUpperCase();
    if (normalized === 'NEW' || normalized === 'PENDING') return 'NOUVEAU';
    if (normalized === 'VALIDATED' || normalized === 'VALIDÉ') return 'VALIDÉ';
    if (normalized === 'ACTIVE' || normalized === 'EN COURS') return 'EN COURS';
    if (normalized === 'SOLDÉ') return 'SOLDÉ';
    if (normalized === 'RÉSILIÉ') return 'RÉSILIÉ';
    return status;
  }

  getRiskLevel(contract: Contract | null): { label: string, class: string } {
    if (!contract) return { label: 'Inconnu', class: 'text-muted' };
    if (contract.paymentStatus === 'Impayé définitif') return { label: 'CRITIQUE', class: 'text-danger' };
    if (contract.paymentStatus === 'En retard') return { label: 'ÉLEVÉ', class: 'text-warning' };

    const paid = this.totalPaidIncludingDeposit;
    const total = contract.totalAmount || 1;
    const progress = (paid / total) * 100;

    if (progress < 25) return { label: 'MOYEN', class: 'text-info' };
    return { label: 'BAS', class: 'text-success' };
  }
}

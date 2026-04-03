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

  scrollToTabs(tabId: number): void {
    this.activeId = tabId;
    setTimeout(() => {
      const element = document.getElementById('contract-tabs');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  private contractService = inject(ContractService);
  private route = inject(ActivatedRoute);
  private paymentService = inject(PaymentService);
  private scheduleService = inject(PaymentScheduleService);
  private modalService = inject(NgbModal);
  private fb = inject(FormBuilder);

  baseUrl = environment.serverUrl.replace('/api', '');

  schedules: any[] = [];
  scheduleForm: FormGroup;
  promiseForm: FormGroup;

  constructor() {
    this.scheduleForm = this.fb.group({
      totalAmount: [0, [Validators.required, Validators.min(1)]],
      installments: [1, [Validators.required, Validators.min(1)]],
      startDate: ['', Validators.required],
      ruleDay: [1, Validators.required],
      includeSundays: [false]
    });

    this.promiseForm = this.fb.group({
      expectedDate: ['', Validators.required],
      amount: [null, [Validators.min(1)]],
      note: ['']
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
  reliabilityScore: number | null = null;
  reliabilityClass: string = 'text-success';

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
    if (!this.contract || !this.schedules || this.schedules.length === 0) {
      this.punctualityHistory = [];
      return;
    }

    // 1. Trier par date croissante
    const sortedSchedules = [...this.schedules].sort((a, b) =>
      new Date(a.expectedDate).getTime() - new Date(b.expectedDate).getTime()
    );

    // 2. Trouver l'échéance "Actuelle" par rapport à la DATE DU JOUR
    // On cherche la première échéance >= Aujourd'hui
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = this.formatDateYYYYMMDD(today);

    let currentIndex = sortedSchedules.findIndex(s => s.expectedDate?.substring(0, 10) >= todayStr);

    // Si toutes les échéances sont passées, on prend la dernière comme référence
    if (currentIndex === -1) currentIndex = sortedSchedules.length - 1;

    const startIndex = Math.max(0, currentIndex - 5);
    const windowSchedules = sortedSchedules.slice(startIndex, currentIndex + 1);

    this.punctualityHistory = windowSchedules.map((s, idx) => {
      const sDateObj = new Date(s.expectedDate);
      const sDateStr = s.expectedDate?.substring(0, 10);

      let finalStatus = 'N/A';
      if (s.status === 'Payé') {
        finalStatus = 'À jour';
      } else if (s.status === 'En retard' || s.status === 'Impayé' || (sDateStr < todayStr)) {
        finalStatus = 'En retard';
      } else {
        finalStatus = 'N/A';
      }

      // Utilisation de la chaîne de date brute pour éviter les décalages de fuseau horaire
      const dateParts = s.expectedDate?.split('T')[0].split('-');
      let formattedDate = s.expectedDate?.substring(0, 10);
      if (dateParts && dateParts.length === 3) {
        formattedDate = `${dateParts[2]}/${dateParts[1]}`;
      }

      let label = formattedDate;
      if (startIndex + idx === currentIndex) label = `Actuelle (${formattedDate})`;

      return {
        month: label,
        status: finalStatus
      };
    });

    this.calculateReliabilityScore();
  }

  calculateReliabilityScore(): void {
    if (!this.schedules || this.schedules.length === 0) {
      this.reliabilityScore = null;
      return;
    }

    // On compte les faits réels : ce qui est payé vs ce qui est en échec (Retards/Impayés)
    // On compte tout ce qui n'est pas "À venir" (donc tout ce qui a eu un mouvement : Payé, Retard, Partiel)
    const activeSchedules = this.schedules.filter(s => s.status !== 'À venir');

    const paidCount = activeSchedules.filter(s => s.status === 'Payé').length;
    const totalCount = activeSchedules.length;

    if (totalCount === 0) {
      this.reliabilityScore = null;
      return;
    }

    this.reliabilityScore = Math.round((paidCount / totalCount) * 100);

    // Définition de la classe de couleur
    if (this.reliabilityScore >= 80) {
      this.reliabilityClass = 'text-success';
    } else if (this.reliabilityScore >= 50) {
      this.reliabilityClass = 'text-warning';
    } else {
      this.reliabilityClass = 'text-danger';
    }
  }

  private formatDateYYYYMMDD(date: Date): string {
    return date.getFullYear() + '-' +
      String(date.getMonth() + 1).padStart(2, '0') + '-' +
      String(date.getDate()).padStart(2, '0');
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

  private normalizeSchedules(res: any): any[] {
    return (res || []).map((s: any) => ({
      ...s,
      localDate: s.expectedDate?.split('T')[0]
    }));
  }

  loadSchedules(contractUuid: string): void {
    this.scheduleService.getList(contractUuid).subscribe({
      next: (res: any) => {
        this.schedules = this.normalizeSchedules(res);
        this.generatePunctualityHistory();
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
      startDate: this.formatDateYYYYMMDD(today),
      ruleDay: defaultRuleDay,
      includeSundays: false
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

    // Ensure startDate is sent as a string YYYY-MM-DD to avoid timezone shifts during JSON serialization
    const formValue = { ...this.scheduleForm.value };
    if (formValue.startDate instanceof Date) {
      formValue.startDate = this.formatDateYYYYMMDD(formValue.startDate);
    }

    const data = {
      contractUuid: this.contract.uuid,
      ...formValue
    };

    this.scheduleService.generateSchedule(data).subscribe({
      next: (res) => {
        Swal.fire('Succès', 'Échéancier généré avec succès', 'success');
        this.schedules = this.normalizeSchedules(res);
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
    this.scheduleService.markOverdue(this.contract!.uuid!).subscribe({
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

  toggleSuspension(): void {
    if (!this.contract || !this.contract.uuid) return;
    const isSuspended = this.contract.status === 'SUSPENDU';
    const action = isSuspended ? 'réactiver' : 'suspendre';
    const confirmButtonText = isSuspended ? 'Oui, réactiver' : 'Oui, suspendre';

    Swal.fire({
      title: 'Confirmation',
      text: `Voulez-vous vraiment ${action} ce contrat ?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: confirmButtonText,
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.scheduleService.suspend({ contractUuid: this.contract!.uuid!, suspend: !isSuspended }).subscribe({
          next: (res) => {
            Swal.fire('Succès', res.message, 'success');
            if (this.contract) this.contract.status = res.status;
            this.loading = false;
          },
          error: (err) => {
            Swal.fire('Erreur', err?.error?.message || 'Erreur lors du changement de statut', 'error');
            this.loading = false;
          }
        });
      }
    });
  }

  prolongContract(): void {
    if (!this.contract || !this.contract.uuid) return;

    Swal.fire({
      title: 'Prolongement (Force Majeure)',
      text: 'De combien de jours voulez-vous décaler les prochaines échéances ?',
      input: 'number',
      inputAttributes: {
        min: '1',
        step: '1'
      },
      inputValue: 30,
      showCancelButton: true,
      confirmButtonText: 'Prolonger',
      cancelButtonText: 'Annuler',
      inputValidator: (value) => {
        if (!value || parseInt(value) <= 0) {
          return 'Veuillez saisir un nombre de jours positif !';
        }
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        const days = parseInt(result.value);
        this.scheduleService.prolong({ contractUuid: this.contract!.uuid!, days }).subscribe({
          next: (res) => {
            Swal.fire('Succès', res.message, 'success');
            if (this.contract?.uuid) this.loadSchedules(this.contract.uuid);
            this.loading = false;
          },
          error: (err) => {
            Swal.fire('Erreur', err?.error?.message || 'Erreur lors du prolongement', 'error');
            this.loading = false;
          }
        });
      }
    });
  }

  // File Upload Logic
  triggerContractDocUpload(): void {
    const fileInput = document.getElementById('contractDocUpload') as HTMLInputElement;
    if (fileInput) fileInput.click();
  }

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

  viewDocument(docUuid: string): void {
    if (!this.contract || !this.contract.uuid) return;
    const contractUuid = this.contract.uuid as string;
    this.contractService.downloadDocument(contractUuid, docUuid, false);
  }

  downloadDocument(docUuid: string): void {
    if (!this.contract || !this.contract.uuid) return;
    const contractUuid = this.contract.uuid as string;
    this.contractService.downloadDocument(contractUuid, docUuid, true);
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

  terminateContract() {
    Swal.fire({
      title: 'Terminer ce contrat ?',
      text: "Le contrat passera en statut 'TERMINÉ' et les véhicules seront libérés au catalogue.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#1bc943',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, terminer',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.contractService.terminate(this.contract!.uuid!).subscribe({
          next: (res) => {
            this.loading = false;
            this.contract = res;
            Swal.fire('Terminé !', 'Le contrat est fini et les véhicules sont libres.', 'success');
          },
          error: (err) => {
            this.loading = false;
            Swal.fire('Erreur', err.error.message || 'Impossible de terminer le contrat', 'error');
          }
        });
      }
    });
  }

  ruptureContract() {
    Swal.fire({
      title: 'Rompre ce contrat ?',
      text: "ATTENTION : Cette action marquera le contrat comme 'ROMPU' (Résiliation forcée). Les véhicules seront immédiatement libérés.",
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      cancelButtonColor: '#7f8c8d',
      confirmButtonText: 'Oui, rompre le contrat',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.contractService.rupture(this.contract!.uuid!).subscribe({
          next: (res) => {
            this.loading = false;
            this.contract = res;
            Swal.fire('Contrat Rompu', 'Le contrat est désormais résilié et les véhicules sont libres.', 'success');
          },
          error: (err) => {
            this.loading = false;
            Swal.fire('Erreur', err.error.message || 'Impossible de rompre le contrat', 'error');
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
    if (normalized === 'TERMINÉ') return 'TERMINÉ';
    if (normalized === 'ROMPU' || normalized === 'ANNULÉ') return 'ROMPU';
    if (normalized === 'RÉSILIÉ') return 'RÉSILIÉ';
    return status;
  }

  getRiskLevel(contract: Contract | null): { label: string, class: string, reason?: string } {
    if (!contract) return { label: 'Inconnu', class: 'text-muted' };

    if (contract.riskAnalysis) {
      return {
        label: contract.riskAnalysis.level,
        class: contract.riskAnalysis.class || 'text-muted',
        reason: contract.riskAnalysis.reason
      };
    }

    // Fallback
    if (contract.paymentStatus === 'Impayé définitif') return { label: 'CRITIQUE', class: 'text-danger' };
    if (contract.paymentStatus === 'En retard') return { label: 'ÉLEVÉ', class: 'text-warning' };

    if (!contract.hasSchedules) return { label: 'NON DÉFINI', class: 'text-muted' };

    const paid = this.totalPaidIncludingDeposit;
    const total = contract.totalAmount || 1;
    const progress = (paid / total) * 100;

    if (progress < 25) return { label: 'MOYEN', class: 'text-info' };
    return { label: 'BAS', class: 'text-success' };
  }

  // Promise Management
  openPromiseModal(content: any): void {
    if (!this.contract) return;

    this.promiseForm.patchValue({
      expectedDate: new Date().toISOString().split('T')[0],
      amount: (this.contract as any).riskAnalysis?.unpaidArrears || this.contract.unpaidAmount || 0,
      note: ''
    });

    this.modalService.open(content, { centered: true });
  }

  submitPromise(modal: any): void {
    if (this.promiseForm.invalid || !this.contract?.uuid) {
      Swal.fire('Erreur', 'Veuillez remplir correctement le formulaire.', 'warning');
      return;
    }

    this.loading = true;
    this.contractService.addPromise(this.contract.uuid, this.promiseForm.value).subscribe({
      next: (res) => {
        Swal.fire('Succès', 'Promesse de paiement enregistrée avec succès.', 'success');
        modal.close();
        // Reload contract to see the new promise in the list
        this.loadContract(this.contract!.uuid!);
      },
      error: (err) => {
        console.error('Error saving promise', err);
        Swal.fire('Erreur', 'Impossible d\'enregistrer la promesse.', 'error');
        this.loading = false;
      }
    });
  }

  translatePromiseStatus(status: string): string {
    if (!status) return 'Inconnu';
    const s = status.toUpperCase();
    if (s === 'PENDING' || s === 'EN ATTENTE') return 'EN ATTENTE';
    if (s === 'KEPT' || s === 'TENUE') return 'TENUE';
    if (s === 'BROKEN' || s === 'ROMPUE') return 'ROMPUE';
    if (s === 'CANCELLED' || s === 'ANNULÉE') return 'ANNULÉE';
    return status;
  }
}

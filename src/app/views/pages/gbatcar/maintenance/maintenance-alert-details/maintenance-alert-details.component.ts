import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';
import { MaintenanceAlertService } from '../../../../../core/services/maintenance/maintenance-alert.service';
import { PaymentService } from '../../../../../core/services/payment/payment.service';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import { environment } from '../../../../../../environments/environment';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-maintenance-alert-details',
  standalone: true,
  imports: [CommonModule, RouterModule, FeatherIconDirective, NgbDropdownModule],
  templateUrl: './maintenance-alert-details.component.html',
  styleUrl: './maintenance-alert-details.component.scss'
})
export class MaintenanceAlertDetailsComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private alertService = inject(MaintenanceAlertService);
  private paymentService = inject(PaymentService);

  alertUuid: string | null = null;
  record: any = null;
  loading = true;
  isAddingFiles = false;
  payments: any[] = [];

  constructor() { }

  ngOnInit(): void {
    this.alertUuid = this.route.snapshot.paramMap.get('id');
    if (this.alertUuid) {
      this.loadAlert();
    } else {
      this.router.navigate(['/gbatcar/maintenance/alerts']);
    }
  }

  loadAlert(): void {
    this.loading = true;
    this.alertService.getSingle(this.alertUuid!).subscribe({
      next: (data: any) => {
        this.record = data;
        this.loading = false;
        this.loadAssociatedPayments();
      },
      error: () => {
        this.loading = false;
        this.router.navigate(['/gbatcar/maintenance/alerts']);
      }
    });
  }

  changeStatus(newStatus: string): void {
    Swal.fire({
      title: 'Confirmer le changement',
      text: `Voulez-vous passer cette alerte au statut "${newStatus}" ?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Oui, confirmer',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.alertService.changeStatus(this.alertUuid!, newStatus).subscribe({
          next: () => {
            Swal.fire('Succès', 'Le statut a été mis à jour.', 'success');
            this.loadAlert();
          },
          error: (err) => Swal.fire('Erreur', err?.error?.message || 'Erreur lors du changement de statut', 'error')
        });
      }
    });
  }

  invoiceAlert(): void {
    if (!this.record.repairCost || this.record.repairCost <= 0) {
      Swal.fire('Attention', 'Veuillez d\'abord renseigner un coût de réparation dans le formulaire de modification.', 'warning');
      return;
    }

    Swal.fire({
      title: 'Facturer l\'incident',
      text: 'Qui doit prendre en charge les frais de réparation ?',
      icon: 'info',
      input: 'radio',
      inputOptions: {
        'SOCIETE': '🏢 La Société (Défaut)',
        'CLIENT': '👤 Le Client'
      },
      inputValue: 'SOCIETE',
      showCancelButton: true,
      confirmButtonText: 'Confirmer la facturation',
      cancelButtonText: 'Annuler',
      inputValidator: (value) => {
        if (!value) {
          return 'Vous devez choisir un payeur !';
        }
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.alertService.invoice(this.alertUuid!, result.value).subscribe({
          next: () => {
            Swal.fire('Facturé !', 'L\'enregistrement de paiement a été créé.', 'success');
            this.loadAlert();
          },
          error: (err) => Swal.fire('Erreur', err?.error?.message || 'Erreur lors de la facturation', 'error')
        });
      }
    });
  }

  deleteAlert(): void {
    Swal.fire({
      title: 'Supprimer l\'alerte ?',
      text: "Cette action est irréversible !",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.alertService.delete(this.alertUuid!).subscribe({
          next: () => {
            Swal.fire('Supprimé !', 'L\'alerte a été supprimée.', 'success');
            this.router.navigate(['/gbatcar/maintenance/alerts']);
          },
          error: (err) => Swal.fire('Erreur', err?.error?.message || 'Erreur lors de la suppression', 'error')
        });
      }
    });
  }

  onAddFiles(event: any): void {
    const files = Array.from(event.target.files) as File[];
    if (files.length > 0) {
      this.uploadFiles(files);
    }
  }

  private uploadFiles(files: File[]): void {
    this.isAddingFiles = true;
    const formData = new FormData();
    formData.append('uuid', this.alertUuid!);

    // Identify images vs pdf
    files.forEach(file => {
      if (file.type === 'application/pdf') {
        formData.append('policeReportFile', file);
      } else if (file.type.startsWith('image/')) {
        formData.append('photosFiles[]', file);
      }
    });

    this.alertService.add(formData).subscribe({
      next: () => {
        this.isAddingFiles = false;
        Swal.fire({
          icon: 'success',
          title: 'Fichiers ajoutés',
          timer: 1500,
          showConfirmButton: false
        });
        this.loadAlert();
      },
      error: (err) => {
        this.isAddingFiles = false;
        Swal.fire('Erreur', err?.error?.message || 'Erreur lors de l\'ajout des fichiers', 'error');
      }
    });
  }

  getFilename(url: string): string {
    if (!url) return '';
    return url.split('/').pop() || '';
  }

  getFileUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const baseUrl = environment.serverUrl.replace('/api', '');
    return baseUrl + path;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Ouvert': return 'bg-secondary';
      case 'En traitement': return 'bg-warning text-dark';
      case 'Immobilisé': return 'bg-danger';
      case 'Résolu': return 'bg-success';
      case 'Annulé': return 'bg-light text-dark border';
      default: return 'bg-light text-dark';
    }
  }

  getSeverityClass(severity: string): string {
    switch (severity) {
      case 'Faible': return 'bg-info';
      case 'Moyenne': return 'bg-warning text-dark';
      case 'Critique':
      case 'Haute': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  private loadAssociatedPayments() {
    if (!this.record?.uuid) return;
    const alertId = this.record.uuid.substring(0, 8).toUpperCase();
    const humanRef = this.record.reference;

    // 1. Try new human reference format: INV-ALT-YYYY-XXX
    const mainSearch = humanRef ? ('INV-' + humanRef) : ('INV-' + alertId);

    this.paymentService.getList({ search: mainSearch }).subscribe({
      next: (res: any) => {
        this.payments = res?.data || res || [];

        // 2. Fallback: If no payments found and we have a humanRef, 
        // it might be an older record or search mismatch, try UUID prefix
        if (this.payments.length === 0 && humanRef) {
          this.paymentService.getList({ search: 'INV-' + alertId }).subscribe({
            next: (res2: any) => {
              this.payments = res2?.data || res2 || [];
            }
          });
        }
      }
    });
  }
}

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';
import { MaintenanceService } from '../../../../../core/services/maintenance/maintenance.service';
import { PaymentService } from '../../../../../core/services/payment/payment.service';
import { ApiService } from '../../../../../utils/api.service';
import { PenaltyService } from '../../../../../core/services/penalty/penalty.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-maintenance-details',
  standalone: true,
  imports: [CommonModule, RouterModule, FeatherIconDirective],
  templateUrl: './maintenance-details.component.html',
  styleUrl: './maintenance-details.component.scss'
})
export class MaintenanceDetailsComponent implements OnInit {

  maintenanceId: string | null = null;
  record: any = null;
  loading = true;
  uploading = false;
  docs: any[] = [];
  payments: any[] = [];

  private maintenanceService = inject(MaintenanceService);
  private paymentService = inject(PaymentService);
  private apiService = inject(ApiService);
  private penaltyService = inject(PenaltyService);
  private router = inject(Router);

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.maintenanceId = this.route.snapshot.paramMap.get('id');
    if (this.maintenanceId) {
      this.maintenanceService.getSingle(this.maintenanceId).subscribe({
        next: (res: any) => {
          this.record = res.data ?? res;
          this.docs = this.record?.documents ?? [];
          this.loading = false;
          this.loadAssociatedPayments();
        },
        error: () => { this.loading = false; }
      });
    } else {
      this.loading = false;
    }
  }

  /** Called when user picks files to upload */
  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files.length || !this.record?.uuid) return;
    this.uploading = true;
    this.maintenanceService.uploadDocuments(this.record.uuid, input.files).subscribe({
      next: (res: any) => {
        // Reload the record to get fresh document list
        this.maintenanceService.getSingle(this.record.uuid).subscribe({
          next: (fresh: any) => {
            const r = fresh.data ?? fresh;
            this.docs = r?.documents ?? [];
            this.uploading = false;
          },
          error: () => { this.uploading = false; }
        });
      },
      error: () => { this.uploading = false; }
    });
    // Reset the input so the same file can be re-uploaded if needed
    input.value = '';
  }

  /** Download a document as a Blob */
  downloadDoc(doc: any): void {
    if (!this.record?.uuid) return;
    this.maintenanceService.downloadDocument(this.record.uuid, doc.uuid).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        // Revoke the URL after a short delay so the new window has time to load it
        setTimeout(() => window.URL.revokeObjectURL(url), 10000);
      },
      error: () => {
        // Fallback or error message
      }
    });
  }

  /** Delete a document */
  deleteDoc(doc: any): void {
    if (!confirm(`Supprimer "${doc.originalName}" ?`)) return;
    this.maintenanceService.deleteDocument(this.record.uuid, doc.uuid).subscribe({
      next: () => {
        this.docs = this.docs.filter(d => d.uuid !== doc.uuid);
      }
    });
  }

  /** Human-readable file size */
  formatSize(bytes: number): string {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' o';
    if (bytes < 1048576) return Math.round(bytes / 1024) + ' Ko';
    return (bytes / 1048576).toFixed(1) + ' Mo';
  }

  /** Icon by mime type */
  fileIcon(mime: string): string {
    if (!mime) return 'file';
    if (mime.includes('pdf')) return 'file-text';
    if (mime.includes('image')) return 'image';
    if (mime.includes('word') || mime.includes('document')) return 'file-text';
    if (mime.includes('excel') || mime.includes('sheet')) return 'bar-chart-2';
    return 'paperclip';
  }

  changeStatus(status: string) {
    if (!this.record?.uuid) return;
    Swal.fire({
      title: 'Changer le statut ?',
      text: `Vous allez passer cette intervention à "${status}"`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#1bc943',
      cancelButtonText: 'Annuler',
      confirmButtonText: 'Oui, confirmer'
    }).then((result) => {
      if (result.isConfirmed) {
        this.maintenanceService.changeStatus(this.record.uuid, status).subscribe({
          next: () => {
            this.record.status = status;
            Swal.fire('Succès', 'Le statut a été mis à jour.', 'success');
          },
          error: () => Swal.fire('Erreur', 'Impossible de changer le statut', 'error')
        });
      }
    });
  }

  refactureClient() {
    if (!this.record?.vehicle?.client?.uuid) {
      Swal.fire('Information', "Aucun client n'est associé à ce véhicule pour la facturation.", 'info');
      return;
    }
    const cost = this.record.cost || 0;
    Swal.fire({
      title: 'Refacturer au client ?',
      html: `
        <p class="text-muted tx-13 mb-3">Une pénalité sera ajoutée au dossier du client.</p>
        <div class="mb-3 text-start">
            <label class="form-label fw-bold">Montant à facturer (FCFA)</label>
            <input type="number" id="swal-amount" class="form-control" value="${cost}">
        </div>
        <div class="mb-3 text-start">
            <label class="form-label fw-bold">Motif de facturation</label>
            <textarea id="swal-reason" class="form-control" rows="3">Frais de maintenance - Réf: ${this.record.reference}</textarea>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Facturer le client',
      cancelButtonText: 'Annuler',
      preConfirm: () => {
        const amount = (document.getElementById('swal-amount') as HTMLInputElement).value;
        const reason = (document.getElementById('swal-reason') as HTMLTextAreaElement).value;
        if (!amount || !reason) {
          Swal.showValidationMessage('Veuillez remplir le montant et le motif');
        }
        return { amount: Number(amount), reason };
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const payload = {
          clientId: this.record.vehicle.client.uuid,
          vehicleId: this.record.vehicle.uuid,
          amount: result.value.amount,
          reason: result.value.reason,
          status: 'Non payé',
          date: new Date().toISOString()
        };
        this.penaltyService.add(payload).subscribe({
          next: () => Swal.fire('Facturé !', 'La pénalité a été ajoutée.', 'success'),
          error: () => Swal.fire('Erreur', 'Impossible de refacturer le client.', 'error')
        });
      }
    });
  }

  private loadAssociatedPayments() {
    if (!this.record?.reference) return;
    this.paymentService.getList({ search: this.record.reference }).subscribe({
      next: (payments: any) => {
        this.payments = payments?.data || payments || [];
      }
    });
  }

  printWorkOrder() {
    if (!this.record?.uuid) return;
    const url = this.router.serializeUrl(this.router.createUrlTree(['/gbatcar/maintenance/print', this.record.uuid]));
    window.open(url, '_blank');
  }
}

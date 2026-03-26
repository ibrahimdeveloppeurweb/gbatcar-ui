import { Component, OnInit, TemplateRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { NgbNavModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';
import { ClientService } from '../../../../../core/services/client/client.service';
import Swal from 'sweetalert2';

import { environment } from '../../../../../../environments/environment';

@Component({
  selector: 'app-client-details',
  standalone: true,
  imports: [CommonModule, RouterModule, NgbNavModule, FeatherIconDirective],
  templateUrl: './client-details.component.html',
  styleUrl: './client-details.component.scss'
})
export class ClientDetailsComponent implements OnInit {
  private clientService = inject(ClientService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private modalService = inject(NgbModal);

  baseUrl = environment.serverUrl.replace('/api', '');
  client: any = null;
  loading: boolean = false;
  progressPercentage: number = 0;
  totalPaidAmount: number = 0;
  activeContracts: any[] = [];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadClientData(id);
    }
  }

  loadClientData(uuid: string) {
    this.loading = true;
    this.clientService.getSingle(uuid).subscribe({
      next: (res: any) => {
        this.client = res.data || res;
        this.loading = false;
        this.activeContracts = [];

        // 1. Process all contracts to find active ones
        if (this.client.contracts && Array.isArray(this.client.contracts)) {
          const validContracts = this.client.contracts.filter((c: any) =>
            c.status === 'VALIDÉ' || c.status === 'Validé' || c.status === 'VALIDATED'
          );

          this.activeContracts = validContracts.map((c: any) => {
            const total = c.totalAmount || 0;
            const paid = c.paidAmount ?? 0;
            return {
              ...c,
              totalPaidAmount: paid,
              progressPercentage: total > 0 ? (paid / total) * 100 : 0
            };
          });
        }

        // 2. Backward compatibility / Fallback for existing UI if needed
        const main = this.activeContracts[0] || this.client.activeContract || this.client;
        if (main && main.totalAmount > 0) {
          this.totalPaidAmount = main.paidAmount ?? main.amountPaid ?? 0;
          this.progressPercentage = (this.totalPaidAmount / main.totalAmount) * 100;
        }

        // Sync main status if active contracts exist
        if (this.activeContracts.length > 0) {
          const first = this.activeContracts[0];
          this.client.paymentStatus = first.paymentStatus;
          this.client.totalAmount = first.totalAmount;
          this.client.cautionAmount = first.caution;
        }
      },
      error: (err: any) => {
        this.loading = false;
        console.error('Error loading client details', err);
        Swal.fire('Erreur', 'Impossible de charger les détails du client', 'error');
      }
    });
  }

  goBack() {
    this.router.navigate(['/gbatcar/clients']);
  }

  openModal(content: TemplateRef<any>) {
    this.modalService.open(content, { centered: true });
  }

  openImage(content: TemplateRef<any>) {
    this.modalService.open(content, { centered: true, size: 'lg', windowClass: 'modal-dark' });
  }

  validateClient() {
    Swal.fire({
      title: 'Valider le dossier ?',
      text: "Le dossier passera en statut 'Dossier Validé' (Validation Administrative).",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, valider',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.clientService.validate(this.client.uuid).subscribe({
          next: (res: any) => {
            this.client = res.data || res;
            this.loading = false;
            Swal.fire('Dossier Validé !', 'Le dossier a été validé administrativement.', 'success');
          },
          error: (err: any) => {
            this.loading = false;
            console.error('Error validating client', err);
            Swal.fire('Erreur', 'Impossible de valider le dossier', 'error');
          }
        });
      }
    });
  }

  translateStatus(status: string): string {
    const normalized = status ? status.toLowerCase() : '';
    if (normalized.includes('attente') || normalized.includes('validation')) return 'En attente de Validation';
    if (normalized.includes('validé')) return 'Dossier Validé';
    if (normalized.includes('approuvé') || normalized.includes('actif')) return 'Dossier Approuvé';
    if (normalized.includes('prospect')) return 'Prospect';
    return status;
  }
}

import { Component, OnInit, TemplateRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { NgbNavModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';
import { ClientService } from '../../../../../core/services/client/client.service';
import { ContractService } from '../../../../../core/services/contract/contract.service';
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
  private contractService = inject(ContractService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private modalService = inject(NgbModal);

  baseUrl = environment.serverUrl.replace('/api', '');
  client: any = null;
  loading: boolean = false;
  progressPercentage: number = 0;
  totalPaidAmount: number = 0;
  activeContracts: any[] = [];
  allDocuments: any[] = [];
  allPayments: any[] = [];

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

        // 1. Process all contracts
        if (this.client.contracts && Array.isArray(this.client.contracts)) {
          this.activeContracts = this.client.contracts.map((c: any) => {
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

        this.processDocuments();
        this.processPayments();
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

  translateContractStatus(status: string): string {
    const s = status ? status.toUpperCase() : '';
    if (s === 'VALIDÉ' || s === 'ACTIVE' || s === 'ACTIF' || s === 'VALIDATED') return 'En Cours';
    if (s === 'ROMPU' || s === 'RÉSILIÉ') return 'Rompu';
    if (s === 'CLÔTURÉ' || s === 'TERMINÉ' || s === 'FINI') return 'Terminé';
    if (s === 'EN ATTENTE' || s === 'WAITING') return 'En Attente';
    return status;
  }

  translateVehicleStatus(status: string): string {
    const s = status ? status.toLowerCase() : '';
    if (s.includes('location') || s.includes('circulation')) return 'En Location-Vente';
    if (s.includes('vendu')) return 'Vendu';
    if (s.includes('disponible')) return 'Disponible';
    if (s.includes('maintenance')) return 'En Maintenance';
    return status || 'Disponible';
  }

  processPayments() {
    this.allPayments = [];
    if (this.activeContracts && Array.isArray(this.activeContracts)) {
      this.activeContracts.forEach(contract => {
        if (contract.payments && Array.isArray(contract.payments)) {
          const contractPayments = contract.payments.map((p: any) => ({
            ...p,
            contractRef: contract.reference || contract.uuid.substring(0, 8),
            contractUuid: contract.uuid
          }));
          this.allPayments.push(...contractPayments);
        }
      });

      // Sort by date DESC
      this.allPayments.sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      });
    }
  }

  processDocuments() {
    this.allDocuments = [];

    // 1. Client specific docs
    if (this.client.idScanUrl) {
      this.allDocuments.push({
        libelle: "Scan CNI / Passeport",
        originalName: "Piece_Identite.pdf",
        storedName: this.client.idScanUrl,
        type: 'official',
        isStatic: true
      });
    }
    if (this.client.licenseScanUrl) {
      this.allDocuments.push({
        libelle: "Scan Permis de conduire",
        originalName: "Permis_Conduire.pdf",
        storedName: this.client.licenseScanUrl,
        type: 'official',
        isStatic: true
      });
    }

    // 2. Contract docs
    if (this.activeContracts) {
      this.activeContracts.forEach(c => {
        if (c.documents && Array.isArray(c.documents)) {
          c.documents.forEach((d: any) => {
            this.allDocuments.push({
              ...d,
              contractRef: c.reference,
              contractUuid: c.uuid,
              type: 'contract'
            });
          });
        }
      });
    }
  }

  triggerFileUpload() {
    if (this.activeContracts.length === 0) {
      Swal.fire('Information', 'Veuillez d\'abord créer un contrat pour ce client afin d\'y attacher de nouveaux documents.', 'info');
      return;
    }
    const fileInput = document.getElementById('clientDocInput') as HTMLInputElement;
    if (fileInput) fileInput.click();
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file && this.activeContracts.length > 0) {
      const formData = new FormData();
      formData.append('files', file);
      formData.append('libelle', file.name);

      // Attach to the most recent contract by default for general client docs
      const targetContractUuid = this.activeContracts[0].uuid;

      this.loading = true;
      this.contractService.uploadDocument(targetContractUuid, formData).subscribe({
        next: (res: any) => {
          this.loading = false;
          Swal.fire('Succès', 'Document ajouté avec succès', 'success');
          this.loadClientData(this.client.uuid); // Reload to see new doc
        },
        error: (err: any) => {
          this.loading = false;
          Swal.fire('Erreur', 'Impossible d\'ajouter le document', 'error');
        }
      });
    }
  }

  viewDocument(doc: any) {
    if (doc.isStatic) {
      window.open(this.baseUrl + doc.storedName, '_blank');
    } else {
      this.contractService.downloadDocument(doc.contractUuid, doc.uuid, false);
    }
  }

  downloadDocument(doc: any) {
    if (doc.isStatic) {
      // For static files, we can use a hidden link to trigger download if needed, 
      // but usually window.open on a direct file link is enough to view.
      // If we want to force download of a static file:
      const link = document.createElement('a');
      link.href = this.baseUrl + doc.storedName;
      link.download = doc.originalName || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      this.contractService.downloadDocument(doc.contractUuid, doc.uuid, true);
    }
  }

  deleteDocument(doc: any) {
    if (doc.isStatic) {
      Swal.fire('Information', 'Les documents officiels du profil ne peuvent être supprimés que via la modification du profil client.', 'info');
      return;
    }

    Swal.fire({
      title: 'Supprimer ce document ?',
      text: "Cette action est irréversible.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.contractService.deleteDocument(doc.contractUuid, doc.uuid).subscribe({
          next: () => {
            this.loading = false;
            Swal.fire('Supprimé !', 'Le document a été supprimé.', 'success');
            this.loadClientData(this.client.uuid);
          },
          error: (err: any) => {
            this.loading = false;
            Swal.fire('Erreur', 'Impossible de supprimer le document', 'error');
          }
        });
      }
    });
  }

  openReceipt(url: string | null): void {
    if (url) {
      window.open(this.baseUrl + (url.startsWith('/') ? '' : '/') + url, '_blank');
    } else {
      Swal.fire({
        title: 'Reçu non disponible',
        text: "Aucun fichier de justificatif n'a été téléversé pour ce paiement.",
        icon: 'info',
        confirmButtonText: 'Compris'
      });
    }
  }
}

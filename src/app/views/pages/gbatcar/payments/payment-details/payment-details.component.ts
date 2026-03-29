import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';
import { PaymentService } from '../../../../../core/services/payment/payment.service';
import { ContractService } from '../../../../../core/services/contract/contract.service';
import Swal from 'sweetalert2';
import { environment } from '../../../../../../environments/environment';

@Component({
  selector: 'app-payment-details',
  standalone: true,
  imports: [CommonModule, RouterModule, FeatherIconDirective],
  templateUrl: './payment-details.component.html',
  styleUrl: './payment-details.component.scss'
})
export class PaymentDetailsComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private paymentService = inject(PaymentService);
  private contractService = inject(ContractService);

  paymentUuid: string | null = null;
  payment: any = null;
  isLoading: boolean = false;
  errorMessage: string | null = null;
  serverUrl = environment.serverUrl.replace('/api', '');

  ngOnInit(): void {
    this.paymentUuid = this.route.snapshot.paramMap.get('id');
    if (this.paymentUuid) {
      this.loadPaymentDetails(this.paymentUuid);
    }
  }

  loadPaymentDetails(uuid: string) {
    this.isLoading = true;
    this.paymentService.getSingle(uuid).subscribe({
      next: (res: any) => {
        this.payment = res.data || res;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = "Une erreur est survenue lors du chargement des détails.";
      }
    });
  }

  validatePayment() {
    if (!this.paymentUuid) return;
    Swal.fire({
      title: 'Valider ce paiement ?',
      text: "Le montant sera ajouté au solde payé du contrat.",
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: '#1bc943',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Oui, valider',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.paymentService.changeStatus(this.paymentUuid!, 'Validé').subscribe({
          next: () => {
            Swal.fire('Validé !', 'Le paiement a été validé avec succès.', 'success');
            this.loadPaymentDetails(this.paymentUuid!);
          },
          error: (err: any) => {
            Swal.fire('Erreur', 'Impossible de valider le paiement', 'error');
          }
        });
      }
    });
  }

  deletePayment() {
    if (!this.paymentUuid) return;
    Swal.fire({
      title: 'Supprimer ce paiement ?',
      text: "Cette action est irréversible !",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.paymentService.delete(this.paymentUuid!).subscribe({
          next: () => {
            Swal.fire('Supprimé !', 'Le paiement a été supprimé.', 'success');
            this.router.navigate(['/gbatcar/payments']);
          },
          error: (err: any) => {
            Swal.fire('Erreur', 'Impossible de supprimer le paiement', 'error');
          }
        });
      }
    });
  }

  triggerFileUpload() {
    const fileInput = document.getElementById('paymentDocInput') as HTMLInputElement;
    if (fileInput) fileInput.click();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file && this.paymentUuid) {
      Swal.fire({
        title: 'Ajout de document',
        text: 'Donnez un nom à ce document :',
        input: 'text',
        inputValue: file.name,
        showCancelButton: true,
        confirmButtonText: 'Téléverser',
        cancelButtonText: 'Annuler',
        inputValidator: (value) => {
          if (!value) return 'Le nom est obligatoire !';
          return null;
        }
      }).then((result) => {
        if (result.isConfirmed) {
          this.isLoading = true;
          const formData = new FormData();
          formData.append('files', file);
          formData.append('libelle', result.value);

          this.paymentService.uploadDocument(this.paymentUuid!, formData).subscribe({
            next: () => {
              this.isLoading = false;
              Swal.fire('Succès', 'Document ajouté avec succès', 'success');
              this.loadPaymentDetails(this.paymentUuid!);
            },
            error: (err: any) => {
              this.isLoading = false;
              Swal.fire('Erreur', 'Impossible d\'ajouter le document', 'error');
            }
          });
        }
      });
    }
  }

  downloadDocument(docUuid: string) {
    if (!this.paymentUuid) return;
    this.paymentService.downloadDocument(this.paymentUuid, docUuid);
  }

  deleteDocument(docUuid: string) {
    if (!this.paymentUuid) return;

    Swal.fire({
      title: 'Supprimer ce document ?',
      text: "Cette action est irréversible.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.paymentService.deleteDocument(this.paymentUuid!, docUuid).subscribe({
          next: () => {
            Swal.fire('Supprimé !', 'Le document a été retiré.', 'success');
            this.loadPaymentDetails(this.paymentUuid!);
          },
          error: (err: any) => {
            Swal.fire('Erreur', 'Impossible de supprimer le document', 'error');
          }
        });
      }
    });
  }

  translateStatus(status?: string): string {
    if (!status) return 'Inconnu';
    const normalized = status.toUpperCase();
    if (normalized === 'NEW' || normalized === 'PENDING' || normalized === 'EN ATTENTE') return 'EN ATTENTE';
    if (normalized === 'VALIDATED' || normalized === 'VALIDÉ') return 'VALIDÉ';
    if (normalized === 'REJECTED' || normalized === 'REJETÉ') return 'REJETÉ';
    return status;
  }
}

// Forced rebuild: 10:35
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';
import { SubscriptionService } from '../../../../../core/services/subscription/subscription.service';
import { Subscription } from '../../../../../core/models/subscription.model';
import { environment } from '../../../../../../environments/environment';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-subscription-details',
  standalone: true,
  imports: [CommonModule, RouterModule, FeatherIconDirective],
  templateUrl: './subscription-details.component.html',
  styleUrl: './subscription-details.component.scss'
})
export class SubscriptionDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private subscriptionService = inject(SubscriptionService);

  subscription: Subscription | null = null;
  loading: boolean = true;
  backendBaseUrl: string = '';

  ngOnInit(): void {
    // Generate backend base URL (e.g. http://localhost:8000)
    this.backendBaseUrl = environment.serverUrl.replace('/api', '');

    this.route.paramMap.subscribe(params => {
      const uuid = params.get('id');
      if (uuid) {
        this.loadSubscription(uuid);
      }
    });
  }

  loadSubscription(uuid: string) {
    this.loading = true;
    this.subscriptionService.getSingle(uuid).subscribe({
      next: (res: any) => {
        this.subscription = res;
        this.loading = false;
      },
      error: (err: any) => {
        this.loading = false;
        console.error('Error loading subscription', err);
        Swal.fire('Erreur', 'Impossible de charger les détails de cette souscription', 'error');
      }
    });
  }

  getFileUrl(filename: string): string {
    if (filename.startsWith('/')) {
      return `${this.backendBaseUrl}${filename}`;
    }
    return `${this.backendBaseUrl}/uploads/subscriptions/${filename}`;
  }

  validateSubscription() {
    Swal.fire({
      title: 'Valider la souscription ?',
      text: "Voulez-vous transformer cette souscription en client officiel GBATCAR ?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, Valider',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.subscriptionService.validate(this.subscription!.uuid!).subscribe({
          next: () => {
            Swal.fire('Validé !', 'La souscription a été validée avec succès.', 'success');
            this.loadSubscription(this.subscription!.uuid!);
          },
          error: (err) => {
            console.error(err);
            Swal.fire('Erreur', 'La validation a échoué.', 'error');
          }
        });
      }
    });
  }

  rejectSubscription() {
    if (!this.subscription?.uuid) return;
    Swal.fire({
      title: 'Refuser la souscription ?',
      text: "Voulez-vous rejeter ce dossier ? Un email sera envoyé au client.",
      icon: 'warning',
      input: 'textarea',
      inputPlaceholder: 'Motif du refus (optionnel)',
      showCancelButton: true,
      confirmButtonColor: '#f3a4b5',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Oui, Refuser',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        const reason = result.value || '';
        this.subscriptionService.reject(this.subscription!.uuid!, reason).subscribe({
          next: () => {
            Swal.fire('Refusé !', 'La souscription a été rejetée et le client notifié.', 'success');
            this.loadSubscription(this.subscription!.uuid!);
          },
          error: (err) => {
            console.error(err);
            Swal.fire('Erreur', 'L\'opération a échoué.', 'error');
          }
        });
      }
    });
  }

  deleteSubscription() {
    if (!this.subscription?.uuid) return;
    Swal.fire({
      title: 'Supprimer définitivement ?',
      text: "Cette action est irréversible. Toutes les pièces jointes associées à cette souscription seront perdues.",
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Oui, Supprimer',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.subscriptionService.delete(this.subscription!.uuid!).subscribe({
          next: () => {
            Swal.fire('Supprimé !', 'La souscription a été supprimée avec succès.', 'success').then(() => {
              this.router.navigate(['/gbatcar/clients/subscriptions']);
            });
          },
          error: (err) => {
            console.error(err);
            Swal.fire('Erreur', 'Impossible de supprimer cette souscription.', 'error');
          }
        });
      }
    });
  }
}

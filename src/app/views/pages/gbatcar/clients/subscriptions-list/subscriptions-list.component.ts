// Forced rebuild: 10:35
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';
import { SubscriptionService } from '../../../../../core/services/subscription/subscription.service';
import { Subscription } from '../../../../../core/models/subscription.model';
import { NgxPermissionsModule } from 'ngx-permissions';
import Swal from 'sweetalert2';

import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-subscriptions-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FeatherIconDirective, FormsModule, NgxPermissionsModule, NgbPaginationModule],
  templateUrl: './subscriptions-list.component.html',
  styleUrl: './subscriptions-list.component.scss'
})
export class SubscriptionsListComponent implements OnInit {
  private subscriptionService = inject(SubscriptionService);

  subscriptions: Subscription[] = [];
  loading: boolean = false;
  searchTerm: string = '';

  // Pagination
  page: number = 1;
  pageSize: number = 10;

  ngOnInit(): void {
    this.loadSubscriptions();
  }

  loadSubscriptions() {
    this.loading = true;
    this.subscriptionService.getList().subscribe({
      next: (res: any) => {
        this.subscriptions = res as Subscription[];
        this.loading = false;
      },
      error: (err: any) => {
        this.loading = false;
        console.error('Error loading subscriptions', err);
        Swal.fire('Erreur', 'Impossible de charger la liste des souscriptions', 'error');
      }
    } as any);
  }

  get filteredList(): Subscription[] {
    if (!this.searchTerm) return this.subscriptions;
    const term = this.searchTerm.toLowerCase();
    return this.subscriptions.filter(sub =>
      sub.fullName?.toLowerCase().includes(term) ||
      sub.companyName?.toLowerCase().includes(term) ||
      sub.email?.toLowerCase().includes(term) ||
      sub.phone?.toLowerCase().includes(term)
    );
  }

  get paginatedList(): Subscription[] {
    const startIndex = (this.page - 1) * this.pageSize;
    return this.filteredList.slice(startIndex, startIndex + this.pageSize);
  }

  deleteSubscription(uuid: string | undefined) {
    if (!uuid) return;

    Swal.fire({
      title: 'Êtes-vous sûr ?',
      text: "Voulez-vous rejeter et supprimer définitivement cette souscription ?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#secondary',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.subscriptionService.delete(uuid).subscribe({
          next: () => {
            Swal.fire('Supprimé !', 'La souscription a été rejetée et supprimée.', 'success');
            this.loadSubscriptions();
          },
          error: (err) => {
            console.error(err);
            Swal.fire('Erreur', 'La suppression a échoué.', 'error');
          }
        });
      }
    });
  }
}

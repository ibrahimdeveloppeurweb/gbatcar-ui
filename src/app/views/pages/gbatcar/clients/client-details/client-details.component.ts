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
        if (this.client && this.client.totalAmount && this.client.amountPaid) {
          this.progressPercentage = Math.round((this.client.amountPaid / this.client.totalAmount) * 100);
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
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';
import { PenaltyService } from '../../../../../core/services/penalty/penalty.service';
import { Penalty } from '../../../../../core/models/penalty.model';
import { NgxPermissionsModule, NgxPermissionsService } from 'ngx-permissions';
import { AuthService } from '../../../../../core/services/auth/auth.service';

@Component({
  selector: 'app-penalty-details',
  standalone: true,
  imports: [CommonModule, RouterModule, FeatherIconDirective, NgxPermissionsModule],
  templateUrl: './penalty-details.component.html',
  styleUrl: './penalty-details.component.scss'
})
export class PenaltyDetailsComponent implements OnInit {

  penaltyUuid: string | null = null;
  penalty: Penalty | null = null;
  isLoading = false;
  window = window;

  constructor(
    private route: ActivatedRoute,
    private penaltyService: PenaltyService,
    private router: Router,
    private permissionsService: NgxPermissionsService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    const permissions = this.authService.getPermissions();
    this.permissionsService.loadPermissions(permissions);

    this.penaltyUuid = this.route.snapshot.paramMap.get('id');
    if (this.penaltyUuid) {
      this.loadPenalty();
    }
  }

  loadPenalty(): void {
    this.isLoading = true;
    this.penaltyService.getSingle(this.penaltyUuid!).subscribe({
      next: (res) => {
        this.penalty = res;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching penalty details', err);
        this.isLoading = false;
      }
    });
  }

  isImage(url: string | undefined): boolean {
    if (!url) return false;
    const extension = url.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '');
  }

  getFullUrl(path: string | undefined): string {
    if (!path) return '';
    return this.penaltyService.getAttachmentUrl(path);
  }

  isPaid(): boolean {
    if (!this.penalty || !this.penalty.status) return false;
    const s = this.penalty.status.toUpperCase();
    return s === 'PAYÉ' || s === 'PAYE' || s === 'SOLDÉ' || s === 'SOLDE';
  }

  onSolder(): void {
    if (!this.penalty || !this.penalty.contract?.uuid) {
      console.warn('Cannot solder penalty without contract UUID');
      return;
    }

    const amountToPay = (this.penalty.amount || 0) - (this.penalty.paidAmount || 0);

    this.router.navigate(['/gbatcar/payments/new'], {
      queryParams: {
        contractId: this.penalty.contract.uuid,
        amount: amountToPay,
        type: 'PÉNALITÉ',
        penaltyRef: this.penalty.reference
      }
    });
  }

}

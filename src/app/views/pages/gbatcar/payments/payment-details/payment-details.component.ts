import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';
import { MOCK_PAYMENTS } from '../../../../../core/mock/gbatcar-admin.mock';

@Component({
  selector: 'app-payment-details',
  standalone: true,
  imports: [CommonModule, RouterModule, FeatherIconDirective],
  templateUrl: './payment-details.component.html',
  styleUrl: './payment-details.component.scss'
})
export class PaymentDetailsComponent implements OnInit {

  paymentId: string | null = null;
  payment: any = null;

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.paymentId = this.route.snapshot.paramMap.get('id');
    if (this.paymentId) {
      this.payment = MOCK_PAYMENTS.find(p => p.id === this.paymentId);
      if (!this.payment) {
        // Fallback just for display purposes
        this.payment = MOCK_PAYMENTS[0];
      }
    }
  }

}

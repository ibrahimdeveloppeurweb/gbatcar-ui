import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';
import { MOCK_CONTRACTS, MOCK_PAYMENTS } from '../../../../../core/mock/gbatcar-admin.mock';

@Component({
  selector: 'app-contract-details',
  standalone: true,
  imports: [CommonModule, RouterModule, NgbNavModule, FeatherIconDirective],
  templateUrl: './contract-details.component.html',
  styleUrl: './contract-details.component.scss'
})
export class ContractDetailsComponent implements OnInit {

  contract: any = null;
  payments: any[] = [];
  activeId = 1;
  punctualityHistory = [
    { month: 'Sept', status: 'À jour' },
    { month: 'Oct', status: 'À jour' },
    { month: 'Nov', status: 'En retard' },
    { month: 'Déc', status: 'À jour' },
    { month: 'Jan', status: 'À jour' },
    { month: 'Fév', status: 'À jour' }
  ];

  gpsStatus = {
    connected: true,
    lastUpdate: 'Il y a 2 minutes',
    lastLocation: 'Abidjan, Cocody Angré',
    engineStatus: 'Tournant'
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.contract = MOCK_CONTRACTS.find(c => c.id === id);
      if (this.contract) {
        this.payments = MOCK_PAYMENTS.filter(p => p.contractId === id);
        // Special case for critical contracts to show engine immobilized
        if (this.contract.paymentStatus === 'Impayé définitif') {
          this.gpsStatus.engineStatus = 'Immobilisé';
          this.gpsStatus.connected = true;
        }
      } else {
        // Handle mock fallback
        this.contract = MOCK_CONTRACTS[0];
        this.payments = MOCK_PAYMENTS.filter(p => p.contractId === this.contract.id);
      }
    }
  }


  get progressPercentage(): number {
    if (!this.contract || this.contract.totalAmount === 0) return 0;
    return (this.contract.paidAmount / this.contract.totalAmount) * 100;
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';

@Component({
  selector: 'app-maintenance-alert-details',
  standalone: true,
  imports: [CommonModule, RouterModule, FeatherIconDirective],
  templateUrl: './maintenance-alert-details.component.html',
  styleUrl: './maintenance-alert-details.component.scss'
})
export class MaintenanceAlertDetailsComponent implements OnInit {

  alertId: string | null = null;
  // Mock data for demonstration purposes as we don't have a specific mock object for alerts yet.
  record: any = {
    id: 'SIN-2024-001',
    date: new Date('2024-02-26T14:30:00'),
    vehicle: 'Toyota Corolla (7890 IJ 01)',
    client: 'Amadou Coulibaly',
    type: 'Accident Matériel',
    description: 'Choc avant droit survenu à un carrefour. Le pare-choc et le phare droit sont endommagés.',
    severity: 'Moyenne',
    status: 'En traitement',
    driverInfo: 'Tiers non identifié (délit de fuite).',
    policeReport: true
  };

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.alertId = this.route.snapshot.paramMap.get('id');
    if (this.alertId) {
      this.record.id = this.alertId;
    }
  }

}

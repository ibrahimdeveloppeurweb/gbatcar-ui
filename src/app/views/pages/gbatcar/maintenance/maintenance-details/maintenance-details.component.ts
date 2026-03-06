import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';
import { MOCK_MAINTENANCE } from '../../../../../core/mock/gbatcar-admin.mock';

@Component({
  selector: 'app-maintenance-details',
  standalone: true,
  imports: [CommonModule, RouterModule, FeatherIconDirective],
  templateUrl: './maintenance-details.component.html',
  styleUrl: './maintenance-details.component.scss'
})
export class MaintenanceDetailsComponent implements OnInit {

  maintenanceId: string | null = null;
  record: any = null;

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.maintenanceId = this.route.snapshot.paramMap.get('id');
    if (this.maintenanceId) {
      this.record = MOCK_MAINTENANCE.find(m => m.id === this.maintenanceId);
      if (!this.record) {
        // Fallback just for display purposes
        this.record = MOCK_MAINTENANCE[0];
      }
    }
  }

}

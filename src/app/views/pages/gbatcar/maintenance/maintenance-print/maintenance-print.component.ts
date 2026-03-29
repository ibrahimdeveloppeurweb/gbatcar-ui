import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MaintenanceService } from '../../../../../core/services/maintenance/maintenance.service';

@Component({
  selector: 'app-maintenance-print',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './maintenance-print.component.html',
  styleUrl: './maintenance-print.component.scss'
})
export class MaintenancePrintComponent implements OnInit {
  record: any = null;
  loading = true;
  today = new Date();

  private maintenanceService = inject(MaintenanceService);
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.maintenanceService.getSingle(id).subscribe({
        next: (res: any) => {
          this.record = res.data ?? res;
          this.loading = false;
          // Automatiquement imprimer au chargement
          setTimeout(() => {
            window.print();
          }, 800);
        },
        error: () => this.loading = false
      });
    }
  }
}

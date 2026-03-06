import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { MOCK_VEHICLES } from '../../../../../core/mock/gbatcar-admin.mock';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';

@Component({
  selector: 'app-vehicle-details',
  standalone: true,
  imports: [CommonModule, RouterModule, NgbNavModule, FeatherIconDirective],
  templateUrl: './vehicle-details.component.html',
  styleUrl: './vehicle-details.component.scss'
})
export class VehicleDetailsComponent implements OnInit {

  vehicle: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.vehicle = MOCK_VEHICLES.find((v: any) => v.id === id);
    }
  }

  goBack() {
    this.router.navigate(['/gbatcar/vehicles']);
  }
}

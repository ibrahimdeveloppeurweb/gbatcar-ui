import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MOCK_COMPLIANCE } from '../../../../../../core/mock/gbatcar-compliance.mock';

@Component({
  selector: 'app-compliance-add',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './compliance-add.component.html',
  styleUrl: './compliance-add.component.scss'
})
export class ComplianceAddComponent implements OnInit {
  vehicles: any[] = [];

  ngOnInit() {
    this.vehicles = MOCK_COMPLIANCE.map(c => ({
      id: c.id,
      vehicle: c.vehicle,
      licensePlate: c.licensePlate
    }));
  }
}

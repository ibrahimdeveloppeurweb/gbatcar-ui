import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MOCK_COMPLIANCE } from '../../../../../../core/mock/gbatcar-compliance.mock';

@Component({
  selector: 'app-compliance-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './compliance-details.component.html',
  styleUrl: './compliance-details.component.scss'
})
export class ComplianceDetailsComponent implements OnInit {
  item: any;

  constructor(private route: ActivatedRoute) { }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.item = MOCK_COMPLIANCE.find(c => c.id === +id);
      }
    });
  }
}

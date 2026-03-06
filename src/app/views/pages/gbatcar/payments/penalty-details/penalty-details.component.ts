import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';
import { MOCK_PENALTIES } from '../../../../../core/mock/gbatcar-admin.mock';

@Component({
  selector: 'app-penalty-details',
  standalone: true,
  imports: [CommonModule, RouterModule, FeatherIconDirective],
  templateUrl: './penalty-details.component.html',
  styleUrl: './penalty-details.component.scss'
})
export class PenaltyDetailsComponent implements OnInit {

  penaltyId: string | null = null;
  penalty: any = null;

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.penaltyId = this.route.snapshot.paramMap.get('id');
    if (this.penaltyId) {
      this.penalty = MOCK_PENALTIES.find(p => p.id === this.penaltyId);
      if (!this.penalty) {
        // Fallback just for display purposes
        this.penalty = MOCK_PENALTIES[0];
      }
    }
  }

}

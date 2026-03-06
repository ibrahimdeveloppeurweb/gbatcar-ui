import { Component, OnInit, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { NgbNavModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MOCK_CLIENTS } from '../../../../../core/mock/gbatcar-admin.mock';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';

@Component({
  selector: 'app-client-details',
  standalone: true,
  imports: [CommonModule, RouterModule, NgbNavModule, FeatherIconDirective],
  templateUrl: './client-details.component.html',
  styleUrl: './client-details.component.scss'
})
export class ClientDetailsComponent implements OnInit {

  client: any = null;
  progressPercentage: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.client = MOCK_CLIENTS.find((c: any) => c.id === id);
      if (this.client && this.client.totalAmount && this.client.amountPaid) {
        this.progressPercentage = Math.round((this.client.amountPaid / this.client.totalAmount) * 100);
      }
    }
  }

  goBack() {
    this.router.navigate(['/gbatcar/clients']);
  }

  openModal(content: TemplateRef<any>) {
    this.modalService.open(content, { centered: true });
  }
}

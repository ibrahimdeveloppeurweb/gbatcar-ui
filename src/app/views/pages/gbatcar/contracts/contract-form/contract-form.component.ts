import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';

@Component({
  selector: 'app-contract-form',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FeatherIconDirective],
  templateUrl: './contract-form.component.html',
  styleUrl: './contract-form.component.scss'
})
export class ContractFormComponent implements OnInit {

  contractForm: FormGroup;
  isEditMode: boolean = false;
  contractId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.contractForm = this.fb.group({
      clientId: ['', Validators.required],
      vehicleId: ['', Validators.required],
      startDate: ['', Validators.required],
      duration: [36, Validators.required],
      dailyRate: [15000, Validators.required],
      cautionAmount: [0, Validators.required],
      totalAmount: [{ value: 0, disabled: true }],
      notes: ['']
    });
  }

  ngOnInit(): void {
    const pId = this.route.snapshot.paramMap.get('id');
    if (pId) {
      this.isEditMode = true;
      this.contractId = pId;
      // In a real app, you would fetch data here
    }
  }
}

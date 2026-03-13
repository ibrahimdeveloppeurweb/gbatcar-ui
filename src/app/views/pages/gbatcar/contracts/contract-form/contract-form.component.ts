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
      usageType: ['VTC', Validators.required],
      startDate: ['', Validators.required],
      duration: [36, [Validators.required, Validators.min(1)]],
      paymentFrequency: ['Weekly', Validators.required],
      dailyRate: [15000, [Validators.required, Validators.min(0)]],
      cautionAmount: [500000, [Validators.required, Validators.min(0)]],
      gracePeriod: [2, Validators.min(0)], // Jours de grâce
      penaltyRate: [5, Validators.min(0)], // % par jour de retard
      insuranceSplit: ['Included', Validators.required],
      totalAmount: [{ value: 0, disabled: true }],
      projectedMargin: [{ value: 0, disabled: true }],
      notes: ['']
    });

    this.calculateTotals();

    // Auto-calculate on changes
    this.contractForm.valueChanges.subscribe(() => {
      this.calculateTotals();
    });
  }

  calculateTotals() {
    const daily = this.contractForm.get('dailyRate')?.value || 0;
    const months = this.contractForm.get('duration')?.value || 0;
    const caution = this.contractForm.get('cautionAmount')?.value || 0;

    // Approx calculation: daily rate * 30 days * months + caution
    const total = (daily * 30 * months) + caution;
    this.contractForm.get('totalAmount')?.setValue(total, { emitEvent: false });

    // Simulation: Margin is approx 25% of the total rentals
    const margin = (daily * 30 * months) * 0.25;
    this.contractForm.get('projectedMargin')?.setValue(margin, { emitEvent: false });
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

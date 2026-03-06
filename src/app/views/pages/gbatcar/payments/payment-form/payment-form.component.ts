import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FeatherIconDirective],
  templateUrl: './payment-form.component.html',
  styleUrl: './payment-form.component.scss'
})
export class PaymentFormComponent implements OnInit {

  paymentForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.paymentForm = this.fb.group({
      contractId: ['', Validators.required],
      date: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(1)]],
      method: ['Mobile Money', Validators.required],
      reference: ['', Validators.required],
      period: ['', Validators.required],
      notes: ['']
    });
  }

  ngOnInit(): void {
  }
}

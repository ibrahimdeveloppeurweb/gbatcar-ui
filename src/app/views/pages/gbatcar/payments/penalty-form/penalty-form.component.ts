import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';

@Component({
  selector: 'app-penalty-form',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FeatherIconDirective],
  templateUrl: './penalty-form.component.html',
  styleUrl: './penalty-form.component.scss'
})
export class PenaltyFormComponent implements OnInit {

  penaltyForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.penaltyForm = this.fb.group({
      contractId: ['', Validators.required],
      reason: ['', Validators.required],
      severity: ['Faible', Validators.required],
      amount: ['', [Validators.required, Validators.min(1)]],
      dueDate: ['', Validators.required],
      notes: ['']
    });
  }

  ngOnInit(): void {
  }
}

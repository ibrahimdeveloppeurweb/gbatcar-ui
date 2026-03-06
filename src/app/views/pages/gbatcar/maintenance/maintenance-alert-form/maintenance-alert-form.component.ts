import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';

@Component({
  selector: 'app-maintenance-alert-form',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FeatherIconDirective],
  templateUrl: './maintenance-alert-form.component.html',
  styleUrl: './maintenance-alert-form.component.scss'
})
export class MaintenanceAlertFormComponent implements OnInit {

  alertForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.alertForm = this.fb.group({
      vehicleId: ['', Validators.required],
      date: ['', Validators.required],
      type: ['', Validators.required],
      severity: ['Moyenne', Validators.required],
      description: ['', Validators.required],
      driverInfo: [''],
      policeReport: [null],
      photos: [null]
    });
  }

  ngOnInit(): void {
  }
}

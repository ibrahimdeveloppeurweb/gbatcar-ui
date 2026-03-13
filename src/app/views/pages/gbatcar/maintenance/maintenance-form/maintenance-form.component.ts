import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';

@Component({
    selector: 'app-maintenance-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, FeatherIconDirective],
    templateUrl: './maintenance-form.component.html',
    styleUrl: './maintenance-form.component.scss'
})
export class MaintenanceFormComponent implements OnInit {

    form!: FormGroup;
    isSubmitting = false;
    submitSuccess = false;

    // Options pour les selects
    interventionTypes = [
        'Vidange & Filtres',
        'Plaquettes de frein',
        'Révision Générale',
        'Changement Pneus',
        'Révision pneumatiques',
        'Contrôle technique',
        'Remplacement batterie',
        'Freins & Disques',
        'Électrique',
        'Carrosserie',
        'Autre',
    ];

    providers = [
        'Garage GbatCar Centre',
        'Auto Plus Marcory',
        'Pneumatique Express',
        'Atelier Mécanique Adjamé',
        'Centre Auto Plateau',
        'Autre prestataire',
    ];

    statusOptions = [
        'Planifié',
        'En cours',
        'Terminé',
        'Annulé',
    ];

    // Véhicules disponibles (mock)
    vehicles = [
        { id: 'V001', label: 'Toyota Yaris (1234 AB 01)' },
        { id: 'V002', label: 'Suzuki Swift (9012 EF 01)' },
        { id: 'V003', label: 'Toyota Corolla (7890 IJ 01)' },
        { id: 'V004', label: 'Kia Rio (3456 GH 01)' },
        { id: 'V005', label: 'Hyundai Accent (5678 CD 01)' },
        { id: 'V006', label: 'Toyota Yaris (4567 CD 02)' },
    ];

    constructor(private fb: FormBuilder, private router: Router) { }

    ngOnInit(): void {
        this.form = this.fb.group({
            date: [new Date().toISOString().split('T')[0], Validators.required],
            vehicle: ['', Validators.required],
            type: ['', Validators.required],
            typeAutre: [''],
            provider: ['', Validators.required],
            providerAutre: [''],
            cost: [null, [Validators.required, Validators.min(0)]],
            status: ['Planifié', Validators.required],
            kilometrage: [null, Validators.min(0)],
            technicien: [''],
            description: [''],
            nextMaintenanceDate: [''],
            nextMaintenanceKm: [null],
        });
    }

    get isTypeAutre(): boolean { return this.form.get('type')?.value === 'Autre'; }
    get isProviderAutre(): boolean { return this.form.get('provider')?.value === 'Autre prestataire'; }

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        this.isSubmitting = true;
        // Simulate API call
        setTimeout(() => {
            this.isSubmitting = false;
            this.submitSuccess = true;
            // Navigate back after success
            setTimeout(() => this.router.navigate(['/gbatcar/maintenance']), 1500);
        }, 900);
    }

    onCancel(): void {
        this.router.navigate(['/gbatcar/maintenance']);
    }

    isInvalid(field: string): boolean {
        const control = this.form.get(field);
        return !!(control && control.invalid && control.touched);
    }
}

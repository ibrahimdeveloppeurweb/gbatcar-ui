import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { MOCK_VEHICLES } from '../../../../../core/mock/gbatcar-admin.mock';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';

@Component({
  selector: 'app-vehicle-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FeatherIconDirective],
  templateUrl: './vehicle-form.component.html',
  styleUrl: './vehicle-form.component.scss'
})
export class VehicleFormComponent implements OnInit {

  vehicleForm: FormGroup;
  isEditMode = false;
  vehicleId: string | null = null;
  pageTitle = 'Nouveau Véhicule';

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.vehicleForm = this.formBuilder.group({
      brand: ['', Validators.required],
      model: ['', Validators.required],
      trim: [''], // Finition (ex: LE, GLS)
      transmission: ['Automatique', Validators.required],
      fuelType: ['Essence', Validators.required],
      year: ['', [Validators.required, Validators.min(1990), Validators.max(2030)]],
      color: ['', Validators.required],
      licensePlate: ['', Validators.required],
      chassisNumber: ['', Validators.required],
      mileage: [0, Validators.required],
      status: ['Disponible', Validators.required],
      dailyRate: [15000, Validators.required],
      totalPrice: ['', Validators.required],
      depositPercentage: ['', [Validators.required, Validators.min(0), Validators.max(100)]],
      durationInMonths: ['', [Validators.required, Validators.min(1)]],
      includingInsurance: [false],
      includingGPS: [false]
    });
  }

  ngOnInit(): void {
    this.vehicleId = this.route.snapshot.paramMap.get('id');
    if (this.vehicleId) {
      this.isEditMode = true;
      this.pageTitle = 'Modifier le Véhicule';
      this.loadVehicleData(this.vehicleId);
    }
  }

  loadVehicleData(id: string) {
    const vehicle = MOCK_VEHICLES.find((v: any) => v.id === id);
    if (vehicle) {
      this.vehicleForm.patchValue({
        brand: vehicle.brand,
        model: vehicle.model,
        trim: vehicle.trim,
        transmission: vehicle.transmission,
        fuelType: vehicle.fuelType,
        year: vehicle.year,
        color: vehicle.color,
        licensePlate: vehicle.licensePlate,
        chassisNumber: vehicle.chassisNumber,
        mileage: vehicle.mileage,
        status: vehicle.status,
        dailyRate: vehicle.dailyRate
      });
    }
  }

  saveVehicle() {
    if (this.vehicleForm.valid) {
      Swal.fire({
        position: 'center',
        icon: 'success',
        title: this.isEditMode ? 'Véhicule modifié avec succès !' : 'Véhicule enregistré avec succès !',
        showConfirmButton: false,
        timer: 1500
      }).then(() => {
        this.router.navigate(['/gbatcar/vehicles']);
      });
    } else {
      this.vehicleForm.markAllAsTouched();
      Swal.fire({
        icon: 'error',
        title: 'Formulaire incomplet',
        text: 'Veuillez remplir correctement tous les champs obligatoires.',
        confirmButtonColor: '#ff3366'
      });
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR').format(Math.round(amount)) + ' FCFA';
  }
}

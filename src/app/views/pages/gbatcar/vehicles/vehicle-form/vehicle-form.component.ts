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
      // Base Info
      brand: ['', Validators.required],
      model: ['', Validators.required],
      trim: [''],
      transmission: ['Automatique', Validators.required],
      fuelType: ['Essence', Validators.required],
      year: ['', [Validators.required, Validators.min(1990), Validators.max(2030)]],
      color: [''],
      seats: ['5'],
      status: ['Disponible', Validators.required],
      // Technical ID
      licensePlate: ['', Validators.required],
      chassisNumber: [''],
      mileage: [0],
      nextMaintenanceMileage: [''],
      lastMaintenance: [''],
      gpsStatus: ['Non installé'],
      // TCO
      purchasePrice: [null],
      customsFees: [null],
      transitFees: [null],
      preparationCost: [null],
      gpsInstallationCost: [null],
      otherCosts: [null],
      // Commercial Offer
      totalPrice: ['', Validators.required],
      depositPercentage: ['', [Validators.min(0), Validators.max(100)]],
      durationInMonths: ['', [Validators.min(1)]],
      dailyRate: [15000],
      intendedUse: ['VTC'],
      includingInsurance: [false],
      includingGPS: [false],
      // Misc
      notes: ['']
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
        dailyRate: vehicle.dailyRate,
        totalPrice: vehicle.totalPrice,
        depositPercentage: vehicle.depositPercentage,
        durationInMonths: vehicle.durationInMonths,
        includingInsurance: vehicle.includingInsurance,
        includingGPS: vehicle.includingGPS,
        gpsStatus: vehicle.gpsStatus || 'Non installé',
        nextMaintenanceMileage: vehicle.nextMaintenanceMileage,
        lastMaintenance: vehicle.lastMaintenance,
        purchasePrice: (vehicle as any).tco?.purchasePrice || null,
        customsFees: (vehicle as any).tco?.customs || null,
        transitFees: (vehicle as any).tco?.transport || null,
        preparationCost: (vehicle as any).tco?.preparation || null,
        gpsInstallationCost: (vehicle as any).tco?.gpsInstallation || null,
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

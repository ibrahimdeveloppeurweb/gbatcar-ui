import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';
import { VehicleService } from '../../../../../core/services/vehicle/vehicle.service';
import { Vehicle } from '../../../../../core/models/vehicle.model';
import { environment } from '../../../../../../environments/environment';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-vehicle-details',
  standalone: true,
  imports: [CommonModule, RouterModule, NgbNavModule, FeatherIconDirective],
  templateUrl: './vehicle-details.component.html',
  styleUrl: './vehicle-details.component.scss'
})
export class VehicleDetailsComponent implements OnInit {

  vehicle: Vehicle | any = null;
  loading: boolean = true;
  baseUrl = environment.serverUrl.replace('/api', '');

  // ─── Lightbox state ─────────────────────────────────────────────────────────
  lightboxOpen = false;
  lightboxIndex = 0;

  get lightboxPhotos(): string[] {
    return this.vehicle?.photos || [];
  }

  get lightboxCurrentPhoto(): string {
    return this.lightboxPhotos[this.lightboxIndex] || '';
  }

  openLightbox(index: number, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.lightboxIndex = index;
    this.lightboxOpen = true;
  }

  closeLightbox(): void {
    this.lightboxOpen = false;
    this.lightboxIndex = 0;
  }

  prevPhoto(event: Event): void {
    event.stopPropagation();
    if (this.lightboxIndex > 0) this.lightboxIndex--;
  }

  nextPhoto(event: Event): void {
    event.stopPropagation();
    if (this.lightboxIndex < this.lightboxPhotos.length - 1) this.lightboxIndex++;
  }

  // ─── Actions ───────────────────────────────────────────────────────────────
  setAsCover(event: Event): void {
    event.stopPropagation();
    const photo = this.lightboxCurrentPhoto;
    if (!photo || !this.vehicle) return;

    this.vehicleService.setCoverImage(this.vehicle.uuid || this.vehicle.id, photo).subscribe({
      next: (res: any) => {
        this.vehicle.photo = photo;
        if (res.photos && Array.isArray(res.photos)) {
          this.vehicle.photos = res.photos;
        } else {
          const idx = this.vehicle.photos?.indexOf(photo);
          if (idx !== undefined && idx > -1) {
            this.vehicle.photos.splice(idx, 1);
            this.vehicle.photos.unshift(photo);
          }
        }
        this.lightboxIndex = 0;
        Swal.fire({
          title: 'Couverture définie !',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
      },
      error: (err) => {
        console.error('Error setting cover:', err);
        Swal.fire({ title: 'Erreur', text: 'Impossible de définir la couverture.', icon: 'error', timer: 2000, showConfirmButton: false });
      }
    });
  }

  deletePhoto(event: Event): void {
    event.stopPropagation();
    const photo = this.lightboxCurrentPhoto;
    if (!photo || !this.vehicle) return;

    Swal.fire({
      title: 'Supprimer cette photo ?',
      text: 'Cette action retirera la photo de ce véhicule.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
    }).then((result) => {
      if (result.isConfirmed) {
        this.vehicleService.removeGalleryImage(this.vehicle.uuid || this.vehicle.id, photo).subscribe({
          next: (res: any) => {
            const idx = this.vehicle.photos?.indexOf(photo);
            if (idx > -1) {
              this.vehicle.photos.splice(idx, 1);
            }
            if (this.lightboxIndex >= this.lightboxPhotos.length) {
              this.lightboxIndex = Math.max(0, this.lightboxPhotos.length - 1);
            }
            if (this.lightboxPhotos.length === 0) {
              this.closeLightbox();
            }
            Swal.fire({
              title: 'Supprimée !',
              icon: 'success',
              timer: 1200,
              showConfirmButton: false,
              toast: true,
              position: 'top-end'
            });
          },
          error: (err) => {
            console.error('Deletion error:', err);
            Swal.fire({ title: 'Erreur', text: 'Impossible de supprimer la photo.', icon: 'error', timer: 2000, showConfirmButton: false });
          }
        });
      }
    });
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private vehicleService: VehicleService
  ) { }

  ngOnInit(): void {
    const uuid = this.route.snapshot.paramMap.get('uuid');
    if (uuid) {
      this.loadVehicle(uuid);
    }
  }

  loadVehicle(uuid: string) {
    this.loading = true;
    this.vehicleService.getSingle(uuid).subscribe({
      next: (data: any) => {
        const vehicleData = data.data || data;

        // 1. Active contract mapping (Legacy singular)
        let activeContract = vehicleData.contracts?.find((c: any) =>
          c.status === 'En cours' || c.status === 'Actif' || c.status === 'Acting' || c.status === 'VALIDÉ'
        );

        // 2. Or from fleet demands (New)
        if (!activeContract && vehicleData.vehicleDemands?.length > 0) {
          const firstDemand = vehicleData.vehicleDemands[0];
          if (firstDemand.contract) {
            activeContract = firstDemand.contract;
          }
        }

        if (activeContract) {
          console.log('Active contract found for detail repartition:', activeContract);
          // Count total vehicles in this contract for repartition (pro-rata display)
          const totalVehicles = activeContract.vehicleCount || activeContract.vehicleDemands?.reduce((acc: number, d: any) => acc + (d.quantity || 0), 0) || 1;
          console.log('Total vehicles for repartition:', totalVehicles);

          vehicleData.totalContractAmount = (activeContract.totalAmount || 0) / (totalVehicles || 1);
          vehicleData.paidAmount = (activeContract.paidAmount || 0) / (totalVehicles || 1);
          vehicleData.contractProgress = activeContract.totalAmount > 0
            ? (activeContract.paidAmount / activeContract.totalAmount) * 100
            : 0;

          vehicleData.paymentStatus = activeContract.paymentStatus || vehicleData.paymentStatus || 'À jour';
          vehicleData.daysLate = activeContract.daysLate || 0;

          // Fix for Redevance journalière (Divided by total vehicles for unit display)
          vehicleData.dailyRate = (activeContract.dailyRate || 0) / (totalVehicles || 1);
          if (activeContract.endDate) {
            vehicleData.contractEndDate = activeContract.endDate;
          }
          if (activeContract.uuid) {
            vehicleData.activeContractUuid = activeContract.uuid;
          }
        } else {
          vehicleData.totalContractAmount = 0;
          vehicleData.paidAmount = 0;
          vehicleData.contractProgress = 0;
          vehicleData.dailyRate = vehicleData.prixParJour || 0;
        }

        this.vehicle = vehicleData;
        this.loading = false;
        console.log('Vehicle loaded with contract data:', this.vehicle);
      },
      error: (err) => {
        this.loading = false;
        console.error('Error loading vehicle:', err);
      }
    });
  }

  goBack() {
    this.router.navigate(['/gbatcar/vehicles']);
  }

  // ─── Utilities ──────────────────────────────────────────────────────────────
  calculateDeposit(totalPrice: number, percentage: number): number {
    if (!totalPrice || !percentage) return 0;
    return (totalPrice * percentage) / 100;
  }

  calculateMonthlyPayment(totalPrice: number, deposit: number, months: number): number {
    if (!totalPrice || !months || months === 0) return 0;
    return (totalPrice - (deposit || 0)) / months;
  }

  formatCurrency(amount: number): string {
    if (!amount && amount !== 0) return '0 FCFA';
    return new Intl.NumberFormat('fr-FR').format(Math.round(amount)) + ' FCFA';
  }
}

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';
import { VehicleService } from '../../../../../core/services/vehicle/vehicle.service';
import { AuthService } from '../../../../../core/services/auth/auth.service';
import { environment } from '../../../../../../environments/environment';
import Swal from 'sweetalert2';

import { Vehicle } from '../../../../../core/models/vehicle.model';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, RouterModule, FeatherIconDirective, FormsModule],
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.scss'
})
export class CatalogComponent implements OnInit {

  private vehicleService = inject(VehicleService);
  private authService = inject(AuthService);

  catalogItems: Vehicle[] = [];
  loading: boolean = false;

  baseUrl = environment.serverUrl.replace('/api', '');

  // Quick Filters
  quickSearchTerm: string = '';
  quickStatusFilter: string = '';

  // Advanced Filters
  advSearchTerm: string = '';
  advStatusFilter: string = '';
  advYearMin: number | null = null;
  advYearMax: number | null = null;
  advPriceMin: number | null = null;
  advPriceMax: number | null = null;

  showAdvancedFilters: boolean = true;

  // ─── Lightbox state ─────────────────────────────────────────────────────────
  lightboxOpen = false;
  lightboxVehicle: any = null;
  lightboxIndex = 0;

  get lightboxPhotos(): string[] {
    if (!this.lightboxVehicle) return [];
    return this.lightboxVehicle.photos || [];
  }

  get lightboxCurrentPhoto(): string {
    return this.lightboxPhotos[this.lightboxIndex] || '';
  }

  openLightbox(vehicle: any, index: number, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.lightboxVehicle = vehicle;
    this.lightboxIndex = index;
    this.lightboxOpen = true;
  }

  closeLightbox(): void {
    this.lightboxOpen = false;
    this.lightboxVehicle = null;
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

  getVehicleCoverUrl(vehicle: any): string {
    const photos: string[] = vehicle.photos || [];
    const cover = vehicle.photo || (photos.length > 0 ? photos[0] : null);
    return cover ? this.baseUrl + cover : 'assets/images/placeholder.jpg';
  }

  setAsCover(event: Event): void {
    event.stopPropagation();
    const photo = this.lightboxCurrentPhoto;
    if (!photo || !this.lightboxVehicle) return;

    console.log('Setting cover:', photo, 'for vehicle:', this.lightboxVehicle.uuid || this.lightboxVehicle.id);

    this.vehicleService.setCoverImage(this.lightboxVehicle.uuid || this.lightboxVehicle.id, photo).subscribe({
      next: (res: any) => {
        console.log('Cover set success:', res);
        this.lightboxVehicle.photo = photo;
        if (res.photos && Array.isArray(res.photos)) {
          this.lightboxVehicle.photos = res.photos;
        } else {
          const idx = this.lightboxVehicle.photos?.indexOf(photo);
          if (idx !== undefined && idx > -1) {
            this.lightboxVehicle.photos.splice(idx, 1);
            this.lightboxVehicle.photos.unshift(photo);
          }
        }
        this.lightboxIndex = 0;
        Swal.fire({
          title: 'Couverture définie !',
          text: 'L\'image apparaîtra désormais en premier.',
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
    if (!photo || !this.lightboxVehicle) return;

    this.vehicleService.removeGalleryImage(this.lightboxVehicle.uuid || this.lightboxVehicle.id, photo).subscribe({
      next: (res: any) => {
        console.log('Deletion success:', res);
        // Suppression locale
        const idx = this.lightboxVehicle.photos?.indexOf(photo);
        if (idx > -1) {
          this.lightboxVehicle.photos.splice(idx, 1);
        }

        // Ajustement de l'index
        if (this.lightboxIndex >= this.lightboxPhotos.length) {
          this.lightboxIndex = Math.max(0, this.lightboxPhotos.length - 1);
        }

        // Fermer si plus de photos
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

    // Swal.fire({
    //   title: 'Supprimer cette photo ?',
    //   text: 'Cette action retirera la photo de ce véhicule.',
    //   icon: 'warning',
    //   showCancelButton: true,
    //   confirmButtonText: 'Oui, supprimer',
    //   cancelButtonText: 'Annuler',
    //   confirmButtonColor: '#d33',
    //   cancelButtonColor: '#6c757d',
    // }).then((result) => {
    //   if (result.isConfirmed) {
    //     console.log('Confirmed deletion of:', photo, 'for vehicle:', this.lightboxVehicle.id);


    //   }
    // });
  }

  // ─── Catalog loading & filters ────────────────────────────────────────────
  constructor() { }

  ngOnInit(): void {
    this.loadCatalog();
  }

  loadCatalog() {
    this.loading = true;
    const filters: any = { available_only: 'true' };
    if (this.advSearchTerm) filters.search = this.advSearchTerm;
    if (this.advStatusFilter) filters.status = this.advStatusFilter;
    if (this.advYearMin) filters.yearMin = this.advYearMin;
    if (this.advYearMax) filters.yearMax = this.advYearMax;
    if (this.advPriceMin) filters.priceMin = this.advPriceMin;
    if (this.advPriceMax) filters.priceMax = this.advPriceMax;

    this.vehicleService.getCatalog(filters).subscribe({
      next: (res: any) => { this.catalogItems = res; this.loading = false; },
      error: (err) => { console.error('Erreur catalogue', err); this.loading = false; }
    });
  }

  toggleAdvancedFilters() { this.showAdvancedFilters = !this.showAdvancedFilters; }

  applyQuickFilters() {
    this.advSearchTerm = this.quickSearchTerm;
    this.advStatusFilter = this.quickStatusFilter;
    this.loadCatalog();
  }

  applyAdvancedFilters() {
    this.quickSearchTerm = this.advSearchTerm;
    this.quickStatusFilter = this.advStatusFilter;
    this.loadCatalog();
  }

  resetFilters() {
    this.advSearchTerm = ''; this.advStatusFilter = '';
    this.advYearMin = null; this.advYearMax = null;
    this.advPriceMin = null; this.advPriceMax = null;
    this.quickSearchTerm = ''; this.quickStatusFilter = '';
    this.loadCatalog();
  }

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

  reserveVehicle(vehicle: Vehicle) {
    if (vehicle.statut !== 'Disponible') {
      Swal.fire('Info', 'Ce véhicule n\'est pas disponible à la réservation.', 'info');
      return;
    }

    Swal.fire({
      title: 'Réserver ce véhicule ?',
      text: `Voulez-vous marquer le ${vehicle.marque} ${vehicle.modele} (${vehicle.immatriculation}) comme RÉSERVÉ ?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Oui, réserver',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#3085d6'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        const user = this.authService.getDataToken();
        const agentName = user ? `${user.firstname} ${user.nom}` : 'Agent';

        this.vehicleService.reserve(vehicle.uuid || '', agentName).subscribe({
          next: (res: any) => {
            vehicle.statut = 'Réservé';
            vehicle.preReservedBy = agentName;
            this.loading = false;
            Swal.fire('Succès', 'Véhicule réservé avec succès !', 'success');
          },
          error: (err: any) => {
            this.loading = false;
            Swal.fire('Erreur', 'Impossible de réserver le véhicule.', 'error');
          }
        });
      }
    });
  }

  cancelReservation(vehicle: Vehicle) {
    Swal.fire({
      title: 'Annuler la réservation ?',
      text: `Voulez-vous remettre le ${vehicle.marque} ${vehicle.modele} en DISPONIBLE ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, annuler',
      cancelButtonText: 'Non, garder',
      confirmButtonColor: '#d33'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.vehicleService.updateStatus(vehicle.uuid || '', 'Disponible').subscribe({
          next: () => {
            vehicle.statut = 'Disponible';
            vehicle.preReservedBy = undefined;
            this.loading = false;
            Swal.fire('Annulé', 'Le véhicule est à nouveau disponible au catalogue.', 'success');
          },
          error: (err) => {
            this.loading = false;
            Swal.fire('Erreur', 'Impossible d\'annuler la réservation.', 'error');
          }
        });
      }
    });
  }
}

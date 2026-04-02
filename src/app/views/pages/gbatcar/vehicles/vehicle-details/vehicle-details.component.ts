import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { NgbNavModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';
import { VehicleService } from '../../../../../core/services/vehicle/vehicle.service';
import { MaintenanceService } from '../../../../../core/services/maintenance/maintenance.service';
import { Vehicle } from '../../../../../core/models/vehicle.model';
import { environment } from '../../../../../../environments/environment';
import { NgSelectModule } from '@ng-select/ng-select';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-vehicle-details',
  standalone: true,
  imports: [CommonModule, RouterModule, NgbNavModule, FeatherIconDirective, ReactiveFormsModule, NgSelectModule],
  templateUrl: './vehicle-details.component.html',
  styleUrl: './vehicle-details.component.scss'
})
export class VehicleDetailsComponent implements OnInit {

  private vehicleService = inject(VehicleService);
  private maintenanceService = inject(MaintenanceService);
  private modalService = inject(NgbModal);
  private fb = inject(FormBuilder);

  vehicle: Vehicle | any = null;
  loading: boolean = true;
  baseUrl = environment.serverUrl.replace('/api', '');

  maintenanceForm: FormGroup;
  isSubmitting = false;

  // ─── Files handling ───
  selectedFiles: File[] = [];
  uploading = false;

  // Options pour les selects (Copy from MaintenanceFormComponent)
  interventionTypes = [
    'Vidange & Filtres', 'Plaquettes de frein', 'Révision Générale',
    'Changement Pneus', 'Révision pneumatiques', 'Contrôle technique',
    'Remplacement batterie', 'Freins & Disques', 'Électrique',
    'Carrosserie', 'Autre'
  ];

  providers = [
    'Garage GbatCar Centre', 'Auto Plus Marcory', 'Pneumatique Express',
    'Atelier Mécanique Adjamé', 'Centre Auto Plateau', 'Autre prestataire'
  ];

  statusOptions = ['Planifié', 'En cours', 'Terminé', 'Annulé'];

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
    private router: Router
  ) {
    this.maintenanceForm = this.fb.group({
      type: [null, Validators.required],
      typeAutre: [''],
      dateIntervention: [new Date().toISOString().split('T')[0], Validators.required],
      kilometrage: [0, Validators.required],
      cost: [0, [Validators.required, Validators.min(0)]],
      provider: [null, Validators.required],
      providerAutre: [''],
      status: ['Terminé', Validators.required],
      description: ['']
    });
  }

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
          ['En cours', 'Actif', 'VALIDÉ', 'TERMINÉ', 'SOLDÉ', 'Vendu', 'Solder'].includes(c.status)
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

        // Sort maintenance history by ID DESC (absolute creation order)
        if (vehicleData.maintenances && Array.isArray(vehicleData.maintenances)) {
          vehicleData.maintenances.sort((a: any, b: any) => {
            const idA = a.id || 0;
            const idB = b.id || 0;
            return idB - idA;
          });
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

  // ─── Maintenance Modal Logic ──────────────────────────────────────────────
  openAddMaintenanceModal(content: any): void {
    if (!this.vehicle) return;

    this.maintenanceForm.patchValue({
      kilometrage: this.vehicle.kilometrage || 0,
      dateIntervention: new Date().toISOString().split('T')[0],
      type: null,
      provider: 'Garage GbatCar Centre',
      status: 'Terminé'
    });
    this.selectedFiles = []; // Reset files

    this.modalService.open(content, { size: 'lg', centered: true }).result.then(
      (result) => {
        if (result === 'save') {
          this.saveMaintenance();
        }
      },
      () => { }
    );
  }

  saveMaintenance(): void {
    if (this.maintenanceForm.invalid) {
      Swal.fire('Erreur', 'Veuillez remplir correctement tous les champs obligatoires.', 'error');
      return;
    }

    this.isSubmitting = true;
    const vals = this.maintenanceForm.value;

    const data = {
      ...vals,
      type: vals.type === 'Autre' ? vals.typeAutre : vals.type,
      provider: vals.provider === 'Autre prestataire' ? vals.providerAutre : vals.provider,
      vehicle: this.vehicle.uuid
    };

    this.maintenanceService.create(data).subscribe({
      next: (res: any) => {
        const created = res.data || res;
        const finalUuid = created.uuid;

        if (this.selectedFiles.length > 0 && finalUuid) {
          this.uploadFiles(finalUuid);
        } else {
          this.finalizeSave();
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Error saving maintenance:', err);
        Swal.fire('Erreur', err?.error?.message || 'Une erreur est survenue lors de l\'enregistrement.', 'error');
      }
    });
  }

  private uploadFiles(uuid: string): void {
    this.uploading = true;
    this.maintenanceService.uploadDocuments(uuid, this.selectedFiles as any).subscribe({
      next: () => {
        this.uploading = false;
        this.finalizeSave();
      },
      error: (err) => {
        this.uploading = false;
        console.error('Error uploading files:', err);
        Swal.fire({
          title: 'Attention',
          text: 'Intervention enregistrée, mais une erreur est survenue lors de l\'envoi des documents.',
          icon: 'warning',
          timer: 3000,
          showConfirmButton: false
        });
        this.finalizeSave();
      }
    });
  }

  private finalizeSave(): void {
    this.isSubmitting = false;
    Swal.fire({
      title: 'Succès !',
      text: 'L\'intervention a été enregistrée.',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false
    });
    this.maintenanceForm.reset({
      dateIntervention: new Date().toISOString().split('T')[0],
      provider: 'Garage GbatCar Centre',
      status: 'Terminé'
    });
    this.loadVehicle(this.vehicle.uuid); // Refresh with new maintenance history
  }

  get isTypeAutre(): boolean { return this.maintenanceForm.get('type')?.value === 'Autre'; }
  get isProviderAutre(): boolean { return this.maintenanceForm.get('provider')?.value === 'Autre prestataire'; }

  // --- File Handlers ---
  onFilesSelected(event: any): void {
    const files: FileList = event.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      this.selectedFiles.push(files.item(i)!);
    }
  }

  removeSelectedFile(index: number): void {
    this.selectedFiles.splice(index, 1);
  }

  formatSize(size: number): string {
    if (!size) return '0 o';
    if (size < 1024) return size + ' o';
    if (size < 1048576) return (size / 1024).toFixed(1) + ' Ko';
    return (size / 1048576).toFixed(1) + ' Mo';
  }

  formatCurrency(amount: number): string {
    if (!amount && amount !== 0) return '0 FCFA';
    return new Intl.NumberFormat('fr-FR').format(Math.round(amount)) + ' FCFA';
  }
}

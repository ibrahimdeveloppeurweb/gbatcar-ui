import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';
import { VehicleService } from '../../../../../core/services/vehicle/vehicle.service';
import { GeneralSettingService } from '../../../../../core/services/setting/setting.service';
import { environment } from '../../../../../../environments/environment';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-vehicle-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FeatherIconDirective, NgSelectModule],
  templateUrl: './vehicle-form.component.html',
  styleUrl: './vehicle-form.component.scss'
})
export class VehicleFormComponent implements OnInit {
  private formBuild = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private vehicleService = inject(VehicleService);
  private settingService = inject(GeneralSettingService);

  form!: FormGroup;
  isEditMode = false;
  vehicleId: string | null = null;
  pageTitle = 'Nouveau Véhicule';
  submit = false;
  loading = false;
  settings: any = null;

  // Base URL for Images
  baseUrl = environment.serverUrl.replace('/api', '');

  // Fichiers sélectionnés
  selectedFiles: { [key: string]: File } = {};

  // Galerie d'images par marque
  showGalleryModal = false;
  brandImages: string[] = [];
  uploadingImage = false;

  // Marques et Modèles dynamiques
  brands: any[] = [];
  models: any[] = [];
  selectedBrandId: number | null = null;
  isPatchingForm = false;

  constructor() {
    this.newForm();
  }

  ngOnInit(): void {
    this.vehicleId = this.route.snapshot.paramMap.get('uuid');
    if (this.vehicleId) {
      this.isEditMode = true;
      this.pageTitle = 'Modifier le Véhicule';
      this.loadVehicleData(this.vehicleId);
    } else {
      this.loadSettings();
    }

    // Auto-calcul du TCO depuis les composantes
    const tcoFields = ['purchasePrice', 'customsFees', 'transitFees', 'preparationCost', 'gpsInstallationCost', 'otherCosts'];
    tcoFields.forEach(field => {
      this.form.get(field)?.valueChanges.subscribe(() => this.updateTco());
    });

    // Auto-calcul de la marge brute
    this.form.get('prixDeVente')?.valueChanges.subscribe(() => {
      this.updateMarge();
      this.updateDailyRate();
    });
    this.form.get('tcoEstime')?.valueChanges.subscribe(() => this.updateMarge());

    // Ecouter les changements de paramètres (même s'ils sont désactivés, ils peuvent changer via patchValue)
    this.form.get('durationInMonths')?.valueChanges.subscribe(() => this.updateDailyRate());
    this.form.get('depositPercentage')?.valueChanges.subscribe(() => this.updateDailyRate());

    // Ecouter la marque pour charger les modèles
    this.loadBrands();
    this.form.get('marque')?.valueChanges.subscribe(brandName => {
      if (!brandName) {
        this.models = [];
        this.selectedBrandId = null;
        if (!this.isPatchingForm) this.form.get('modele')?.setValue(null);
        return;
      }

      const brand = this.brands.find(b => b.name === brandName);
      if (brand) {
        this.selectedBrandId = brand.id;
        this.loadModels(brand.id);
      } else {
        // En cas de saisie libre ou avant création (normalement impossible avec bindValue)
        this.models = [];
        this.selectedBrandId = null;
      }

      if (!this.isPatchingForm) {
        this.form.get('modele')?.setValue(null);
      }
    });
  }

  loadBrands() {
    this.vehicleService.getBrands().subscribe({
      next: (res: any) => {
        this.brands = res.data || res;
        // Si on est en mode édition et que la marque est déjà setée, on déclenche le loadModels
        if (this.isEditMode && this.form.get('marque')?.value) {
          const b = this.brands.find(br => br.name === this.form.get('marque')?.value);
          if (b) {
            this.selectedBrandId = b.id;
            this.loadModels(b.id);
          }
        }
      }
    });
  }

  loadModels(brandId: number) {
    this.vehicleService.getModels(brandId).subscribe({
      next: (res: any) => {
        this.models = res.data || res;
      }
    });
  }

  addBrandTag = (term: string) => {
    return new Promise((resolve) => {
      this.loading = true;
      this.vehicleService.addBrand(term).subscribe({
        next: (res: any) => {
          const brand = res.data || res;
          this.brands = [...this.brands, brand];
          this.loading = false;
          resolve(brand); // Doit renvoyer l'objet correspondant au bindValue
        },
        error: () => {
          this.loading = false;
          this.toast("Impossible d'ajouter la marque", 'Erreur', 'error');
          resolve(null);
        }
      });
    });
  };

  addModelTag = (term: string) => {
    return new Promise((resolve) => {
      if (!this.selectedBrandId) {
        this.toast("Sélectionnez une marque d'abord", 'Attention', 'warning');
        resolve(null);
        return;
      }
      this.loading = true;
      this.vehicleService.addModel(this.selectedBrandId, term).subscribe({
        next: (res: any) => {
          const model = res.data || res;
          this.models = [...this.models, model];
          this.loading = false;
          resolve(model);
        },
        error: () => {
          this.loading = false;
          this.toast("Impossible d'ajouter le modèle", 'Erreur', 'error');
          resolve(null);
        }
      });
    });
  };

  loadSettings() {
    this.settingService.getSettings().subscribe({
      next: (res: any) => {
        this.settings = res.data || res;
        if (this.settings) {
          this.form.patchValue({
            durationInMonths: this.settings.dureeContratDefautMois,
            depositPercentage: this.settings.apportInitialPourcentage,
          });
        }
      }
    });
  }

  newForm(): void {
    this.form = this.formBuild.group({
      // Base Info
      marque: [null, Validators.required],
      modele: [null, Validators.required],
      finition: [null],
      photo: [null],
      photos: [[]],  // Tableau d'images
      transmission: ['Automatique', Validators.required],
      carburant: ['Essence', Validators.required],
      annee: [null, [Validators.required, Validators.min(1990), Validators.max(2030)]],
      couleur: [null],
      nombrePlaces: ['5'],
      statut: ['Disponible', Validators.required],
      // Technical ID
      immatriculation: [null, Validators.required],
      numeroChassis: [null],
      kilometrage: [0],
      prochainEntretien: [null],
      lastMaintenance: [null],
      gpsStatus: ['Non installé'],
      notesInternes: [null],
      // Rentabilité (calculée automatiquement)
      prixDeVente: [null, Validators.required],
      tcoEstime: [null],
      margeBrutePrevisionnelle: [null],
      // TCO composantes (UI only → sommées dans tcoEstime)
      purchasePrice: [null],
      customsFees: [null],
      transitFees: [null],
      preparationCost: [null],
      gpsInstallationCost: [null],
      otherCosts: [null],
      // Offre Commerciale
      totalPrice: [null],
      depositPercentage: [{ value: null, disabled: true }, [Validators.min(0), Validators.max(100)]],
      durationInMonths: [{ value: null, disabled: true }, [Validators.min(1)]],
      dailyRate: [0],
      intendedUse: ['VTC'],
      includingInsurance: [false],
      includingGPS: [false],
      // Commercial
      prixParJour: [null],
      description: [null],
      pipelineStatus: [null],
    });
  }

  // ─── Calculs automatiques ────────────────────────────────────────────────

  updateTco(): void {
    const f = this.form.value;
    const tco = (f.purchasePrice || 0) + (f.customsFees || 0) + (f.transitFees || 0)
      + (f.preparationCost || 0) + (f.gpsInstallationCost || 0) + (f.otherCosts || 0);
    this.form.patchValue({ tcoEstime: tco }, { emitEvent: false });
    this.updateMarge();
  }

  updateMarge(): void {
    const prix = this.form.get('prixDeVente')?.value || 0;
    const tco = this.form.get('tcoEstime')?.value || 0;
    this.form.patchValue({ margeBrutePrevisionnelle: prix - tco }, { emitEvent: false });
  }

  updateDailyRate(): void {
    const prix = this.form.get('prixDeVente')?.value || 0;
    const percentage = this.form.get('depositPercentage')?.value || 0;
    const duration = this.form.get('durationInMonths')?.value || 1;

    if (prix > 0 && duration > 0) {
      const remaining = prix - (prix * percentage / 100);
      const monthlyRate = remaining / duration;

      this.form.patchValue({
        dailyRate: Math.round(monthlyRate),
        prixParJour: Math.round(monthlyRate) // Synchro pour le backend
      }, { emitEvent: false });
    }
  }

  // ─── Fichiers ────────────────────────────────────────────────────────────

  onFileChange(event: Event, field: string): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFiles[field] = input.files[0];
    }
  }

  // ─── Galerie d'images par marque ─────────────────────────────────────────

  get currentBrand(): string {
    return this.form.get('marque')?.value?.trim();
  }

  openGallery(): void {
    if (!this.currentBrand) {
      this.toast("Veuillez d'abord saisir une marque.", 'Attention', 'warning');
      return;
    }
    this.showGalleryModal = true;
    this.loadBrandImages();
  }

  closeGallery(): void {
    this.showGalleryModal = false;
  }

  loadBrandImages(): void {
    this.uploadingImage = true;
    this.vehicleService.getBrandImages(this.currentBrand).subscribe({
      next: (images) => {
        this.brandImages = images;
        this.uploadingImage = false;
      },
      error: () => {
        this.toast('Erreur lors du chargement des images.', 'Erreur', 'error');
        this.uploadingImage = false;
      }
    });
  }

  selectImage(imgUrl: string): void {
    // on enlève la baseUrl pour ne stocker que le chemin relatif dans la DB
    const relativeUrl = imgUrl.replace(this.baseUrl, '');

    // Toggle logic for multiple photos array
    const currentPhotos: string[] = this.form.get('photos')?.value || [];
    const index = currentPhotos.indexOf(relativeUrl);

    if (index === -1) {
      // Add if not present
      this.form.patchValue({ photos: [...currentPhotos, relativeUrl] });
    } else {
      // Remove if already present
      currentPhotos.splice(index, 1);
      this.form.patchValue({ photos: [...currentPhotos] });
    }
  }

  removeImage(index: number, event: Event): void {
    event.stopPropagation();
    const currentPhotos: string[] = this.form.get('photos')?.value || [];
    currentPhotos.splice(index, 1);
    this.form.patchValue({ photos: [...currentPhotos] });
  }

  onGalleryUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.uploadingImage = true;
      this.vehicleService.uploadBrandImage(this.currentBrand, file).subscribe({
        next: (res) => {
          this.toast('Image ajoutée à la galerie.', 'Succès', 'success');
          // On recharge la liste pour voir la nouvelle image
          this.loadBrandImages();
          // On peut aussi l'auto-sélectionner
          this.selectImage(res.url);
        },
        error: () => {
          this.toast("Erreur lors de l'upload de l'image.", 'Erreur', 'error');
          this.uploadingImage = false;
        }
      });
    }
  }

  // ─── Chargement en mode édition ──────────────────────────────────────────

  loadVehicleData(uuid: string): void {
    this.loading = true;
    this.vehicleService.getSingle(uuid).subscribe({
      next: (res: any) => {
        const v = res.data || res;
        this.isPatchingForm = true;
        this.form.patchValue({
          marque: v.marque,
          modele: v.modele,
          finition: v.finition,
          transmission: v.transmission,
          carburant: v.carburant,
          annee: v.annee,
          couleur: v.couleur,
          nombrePlaces: v.nombrePlaces,
          statut: v.statut,
          immatriculation: v.immatriculation,
          numeroChassis: v.numeroChassis,
          kilometrage: v.kilometrage,
          prochainEntretien: v.prochainEntretien,
          lastMaintenance: v.dateDerniereMaintenance ? new Date(v.dateDerniereMaintenance.date || v.dateDerniereMaintenance).toISOString().split('T')[0] : v.lastMaintenance,
          gpsStatus: v.gpsStatus,
          notesInternes: v.notesInternes,
          prixDeVente: v.prixDeVente,
          tcoEstime: v.tcoEstime,
          margeBrutePrevisionnelle: v.margeBrutePrevisionnelle,
          includingInsurance: v.includingInsurance,
          includingGPS: v.includingGPS,
          prixParJour: v.prixParJour,
          photo: v.photo,
          photos: v.photos || [],
          description: v.description,
          pipelineStatus: v.pipelineStatus,
          purchasePrice: v.purchasePrice,
          customsFees: v.customsFees,
          transitFees: v.transitFees,
          preparationCost: v.preparationCost,
          gpsInstallationCost: v.gpsInstallationCost,
          otherCosts: v.otherCosts,
          totalPrice: v.prixDeVente, // Le prixDeVente sert aussi de totalPrice dans la section commerciale
          depositPercentage: v.depositPercentage,
          durationInMonths: v.durationInMonths
        });
        this.isPatchingForm = false;

        // Charger les modèles de la marque pour que l'affichage soit correct
        if (v.marque) {
          setTimeout(() => {
            const b = this.brands.find(br => br.name === v.marque);
            if (b) {
              this.selectedBrandId = b.id;
              this.loadModels(b.id);
            }
          }, 500); // Laisse le temps au template de se synchroniser
        }

        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast('Impossible de charger les données du véhicule.', 'Erreur', 'error');
        this.navigateBack();
      }
    });
  }

  // ─── Sauvegarde ──────────────────────────────────────────────────────────

  onConfirme(): void {
    this.submit = true;
    if (this.form.invalid) {
      this.toast('Veuillez remplir correctement les champs obligatoires.', 'Erreur', 'warning');
      return;
    }

    Swal.fire({
      title: '',
      text: this.isEditMode
        ? 'Confirmez-vous la modification de ce véhicule ?'
        : "Confirmez-vous l'enregistrement de ce nouveau véhicule ?",
      icon: 'warning',
      showCancelButton: true,
      showCloseButton: true,
      confirmButtonText: 'Confirmer <i class="fas fa-check"></i>',
      cancelButtonText: 'Annuler <i class="feather icon-x-circle"></i>',
      confirmButtonColor: '#1bc943',
      reverseButtons: true
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.saveData();
      }
    });
  }

  saveData(): void {
    this.loading = true;

    // Sync prixDeVente depuis totalPrice si renseigné dans l'UI
    const tv = this.form.get('totalPrice')?.value;
    if (tv) this.form.patchValue({ prixDeVente: tv }, { emitEvent: false });
    this.updateTco();

    // Construction du FormData (supporte fichiers + champs)
    const formData = new FormData();
    const values = this.form.getRawValue();
    Object.keys(values).forEach(key => {
      const val = values[key];
      if (val !== null && val !== undefined && val !== '') {
        formData.append(key, val);
      }
    });

    // Ajout des fichiers sélectionnés
    Object.entries(this.selectedFiles).forEach(([field, file]) => {
      formData.append(field, file, file.name);
    });

    // En mode édition, ajouter l'uuid pour le routage dans le service
    if (this.isEditMode && this.vehicleId) {
      formData.append('uuid', this.vehicleId);
    }

    this.vehicleService.add(formData as any).subscribe({
      next: () => {
        this.loading = false;
        this.toast(
          this.isEditMode ? 'Véhicule modifié avec succès' : 'Véhicule créé avec succès',
          'Succès', 'success'
        );
        this.navigateBack();
      },
      error: (err: any) => {
        this.loading = false;
        this.toast(
          err?.error?.message || err?.error?.details || "Une erreur est survenue lors de l'enregistrement.",
          'Erreur', 'error'
        );
      }
    });
  }

  navigateBack(): void {
    this.router.navigate(['/gbatcar/vehicles']);
  }

  // ─── Utilitaires ─────────────────────────────────────────────────────────

  toast(msg: string, title: string, type: string): void {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });

    const iconType = (['error', 'success', 'warning', 'info', 'question'].includes(type))
      ? type as any : 'info';

    Toast.fire({
      icon: iconType,
      title: title ? `${title} - ${msg}` : msg
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR').format(Math.round(amount)) + ' XOF';
  }
}

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import { FeatherIconDirective } from '../../../core/feather-icon/feather-icon.directive';
import { SubscriptionService } from '../../../core/services/subscription/subscription.service';
import { VehicleService } from '../../../core/services/vehicle/vehicle.service';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
    selector: 'app-landing-page',
    standalone: true,
    imports: [CommonModule, RouterModule, ReactiveFormsModule, FeatherIconDirective, NgSelectModule],
    templateUrl: './landing-page.component.html',
    styleUrl: './landing-page.component.scss'
})
export class LandingPageComponent implements OnInit {
    private formBuild = inject(FormBuilder);
    private subscriptionService = inject(SubscriptionService);
    private vehicleService = inject(VehicleService);

    form!: FormGroup;
    submit = false;
    loading = false;
    drawerOpen = false;

    // List of catalog brands with nested models
    brands: any[] = [];
    // Models filtered by selected brand
    filteredModels: any[] = [];
    selectedBrandId: number | null = null;

    // Stores display name (or count) for each uploaded document slot
    uploadedFiles: Record<string, string> = {};
    // Stores actual File objects for FormData submission
    selectedFiles: Record<string, File | File[]> = {};

    // ─── Drawer ──────────────────────────────────────────────────────────────

    toggleDrawer(): void {
        this.drawerOpen = !this.drawerOpen;
        document.body.style.overflow = this.drawerOpen ? 'hidden' : '';
    }

    // ─── Lifecycle ───────────────────────────────────────────────────────────

    // ─── Lifecycle ───────────────────────────────────────────────────────────
    private particulierFields = ['fullName', 'phoneParticulier', 'emailParticulier', 'locationParticulier', 'profession', 'monthlyIncome'];
    private entrepriseFields = ['companyName', 'managerName', 'phoneEntreprise', 'emailEntreprise', 'locationEntreprise', 'taxAccountNb'];

    constructor() {
        this.newForm();
    }

    ngOnInit(): void {
        const particulierFiles = ['permis', 'cni', 'casier', 'photos', 'certif', 'bulletin'];
        const entrepriseFiles = ['rc', 'dfe', 'cniGerant', 'casierGerant', 'statut', 'releve'];

        // Initial validators
        this.updateValidators('Particulier');

        this.form.get('clientType')?.valueChanges.subscribe((type: string) => {
            const fieldsToReset = type === 'Particulier' ? this.entrepriseFields : this.particulierFields;
            const filesToReset = type === 'Particulier' ? entrepriseFiles : particulierFiles;

            this.updateValidators(type);

            fieldsToReset.forEach(field => this.form.get(field)?.reset(''));
            filesToReset.forEach(key => {
                delete this.uploadedFiles[key];
                delete this.selectedFiles[key];
            });
        });

        this.form.get('brand')?.valueChanges.subscribe((brandId: any) => {
            this.onBrandChange(brandId);
        });

        this.loadVehicles();
    }

    private loadVehicles(): void {
        this.vehicleService.getPublicCatalog().subscribe({
            next: (data) => {
                this.brands = data;
            },
            error: (err) => {
                console.error('Error loading brand catalog:', err);
            }
        });
    }

    onBrandChange(brandId: any): void {
        this.selectedBrandId = brandId ? +brandId : null;
        if (this.selectedBrandId) {
            const brand = this.brands.find(b => b.id == this.selectedBrandId);
            this.filteredModels = (brand && brand.models) ? [...brand.models] : [];
        } else {
            this.filteredModels = [];
        }

        // Reset model selection when brand changes
        // Use emitEvent: false to avoid circular or unnecessary triggers if needed, 
        // but here it's fine since it's the model field.
        this.form.get('vehicleType')?.setValue('', { emitEvent: false });
    }

    private updateValidators(type: string): void {
        const isParticulier = type === 'Particulier';

        this.particulierFields.forEach(field => {
            const ctrl = this.form.get(field);
            if (isParticulier) {
                ctrl?.setValidators(field === 'emailParticulier' ? [Validators.required, Validators.email] : [Validators.required]);
            } else {
                ctrl?.clearValidators();
            }
            ctrl?.updateValueAndValidity();
        });

        this.entrepriseFields.forEach(field => {
            const ctrl = this.form.get(field);
            if (!isParticulier) {
                ctrl?.setValidators(field === 'emailEntreprise' ? [Validators.required, Validators.email] : [Validators.required]);
            } else {
                ctrl?.clearValidators();
            }
            ctrl?.updateValueAndValidity();
        });
    }

    // ─── Form builder ────────────────────────────────────────────────────────

    newForm(): void {
        this.form = this.formBuild.group({
            // Type de client
            clientType: ['Particulier', Validators.required],

            // Champs Particulier (Validators will be set by updateValidators)
            fullName: [''],
            phoneParticulier: [''],
            emailParticulier: [''],
            locationParticulier: [''],
            profession: [''],
            monthlyIncome: [''],

            // Champs Entreprise (Validators will be set by updateValidators)
            companyName: [''],
            managerName: [''],
            phoneEntreprise: [''],
            emailEntreprise: [''],
            locationEntreprise: [''],
            taxAccountNb: [''],

            // Choix du véhicule & Conditions de leasing (Always required)
            vehicleType: ['', Validators.required],
            brand: ['', Validators.required],
            vehicleCount: [1, [Validators.required, Validators.min(1)]],
            contractType: ['', Validators.required],
            paymentMethod: ['', Validators.required],
        });
    }

    // ─── Required files per client type ─────────────────────────────────────

    private get requiredFiles(): string[] {
        return this.form.get('clientType')?.value === 'Entreprise'
            ? ['rc', 'dfe', 'cniGerant', 'casierGerant', 'statut', 'releve']
            : ['permis', 'cni', 'casier', 'photos', 'certif'];
    }

    private hasAllRequiredFiles(): boolean {
        return this.requiredFiles.every(key => !!this.selectedFiles[key]);
    }

    // ─── File upload ─────────────────────────────────────────────────────────

    onFileSelected(event: Event, key: string): void {
        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        if (input.files.length === 1) {
            this.uploadedFiles[key] = input.files[0].name;
            this.selectedFiles[key] = input.files[0];
        } else {
            this.uploadedFiles[key] = `${input.files.length} fichiers sélectionnés`;
            this.selectedFiles[key] = Array.from(input.files);
        }
    }

    // ─── Navigation ──────────────────────────────────────────────────────────

    scrollToSection(sectionId: string): void {
        const element = document.getElementById(sectionId);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
    }

    // ─── Submit ──────────────────────────────────────────────────────────────

    onSubmit(): void {
        this.submit = true;

        if (this.form.invalid) {
            this.toast('Veuillez remplir correctement les champs obligatoires.', 'Erreur', 'warning');
            return;
        }

        if (!this.hasAllRequiredFiles()) {
            this.toast('Veuillez télécharger tous les documents obligatoires (*).', 'Documents manquants', 'warning');
            return;
        }

        Swal.fire({
            title: '',
            text: 'Confirmez-vous l\'envoi de votre demande de souscription ?',
            icon: 'question',
            showCancelButton: true,
            showCloseButton: true,
            confirmButtonText: 'Confirmer <i class="feather icon-check"></i>',
            cancelButtonText: 'Annuler <i class="feather icon-x-circle"></i>',
            confirmButtonColor: '#d4a04d',
            reverseButtons: true
        }).then((result: any) => {
            if (result.isConfirmed) {
                this.saveData();
            }
        });
    }

    saveData(): void {
        this.loading = true;

        const formData = new FormData();
        const values = this.form.getRawValue();

        // Prepare specialized vehicle string for backoffice
        const brandId = values.brand ? +values.brand : null;
        const brandObj = brandId ? this.brands.find(b => b.id == brandId) : null;
        const brandName = brandObj ? brandObj.name : '';
        const model = values.vehicleType;
        const vehicleFull = `${brandName} ${model}`.trim();

        // Append text fields
        Object.keys(values).forEach(key => {
            if (key === 'brand') return; // Skip raw brand ID
            const val = key === 'vehicleType' ? vehicleFull : values[key];
            if (val !== null && val !== undefined && val !== '') {
                formData.append(key, val);
            }
        });

        // Append file fields
        Object.entries(this.selectedFiles).forEach(([key, file]) => {
            if (Array.isArray(file)) {
                file.forEach(f => formData.append(key, f, f.name));
            } else {
                formData.append(key, file, file.name);
            }
        });

        this.subscriptionService.submit(formData).subscribe({
            next: () => {
                this.loading = false;
                this.form.reset({ clientType: 'Particulier', vehicleCount: 1 });
                this.uploadedFiles = {};
                this.selectedFiles = {};
                this.submit = false;
                this.toast(
                    'Votre demande a été envoyée avec succès. Nous vous contacterons bientôt.',
                    'Succès', 'success'
                );
            },
            error: (err: any) => {
                this.loading = false;
                this.toast(
                    err?.error?.message || err?.error?.details || "Une erreur est survenue lors de l'envoi.",
                    'Erreur', 'error'
                );
            }
        });
    }

    // ─── Utilitaires ─────────────────────────────────────────────────────────

    toast(msg: string, title: string, type: string): void {
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 4000,
            timerProgressBar: true,
        });

        const iconType = (['error', 'success', 'warning', 'info', 'question'].includes(type))
            ? type as any : 'info';

        Toast.fire({
            icon: iconType,
            title: title ? `${title} - ${msg}` : msg
        });
    }
}

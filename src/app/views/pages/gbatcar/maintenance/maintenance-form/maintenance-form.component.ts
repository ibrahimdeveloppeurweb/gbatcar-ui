import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';
import { MaintenanceService } from '../../../../../core/services/maintenance/maintenance.service';
import { VehicleService } from '../../../../../core/services/vehicle/vehicle.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { ApiService } from '../../../../../utils/api.service';
import { MaintenanceTypeService } from '../../../../../core/services/maintenance/maintenance-type.service';
import { MaintenanceProviderService } from '../../../../../core/services/maintenance/maintenance-provider.service';
import { NgxPermissionsModule, NgxPermissionsService } from 'ngx-permissions';
import { AuthService } from '../../../../../core/services/auth/auth.service';

@Component({
    selector: 'app-maintenance-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, FeatherIconDirective, NgSelectModule, NgxPermissionsModule],
    templateUrl: './maintenance-form.component.html',
    styleUrl: './maintenance-form.component.scss'
})
export class MaintenanceFormComponent implements OnInit {

    private fb = inject(FormBuilder);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private maintenanceService = inject(MaintenanceService);
    private vehicleService = inject(VehicleService);
    private apiService = inject(ApiService);
    private maintenanceTypeService = inject(MaintenanceTypeService);
    private maintenanceProviderService = inject(MaintenanceProviderService);
    private permissionsService = inject(NgxPermissionsService);
    private authService = inject(AuthService);

    customSearchFn = (term: string, item: any) => {
        term = term.toLowerCase();
        const marque = (item.marque || '').toLowerCase();
        const modele = (item.modele || '').toLowerCase();
        const plaque = (item.immatriculation || '').toLowerCase();
        return marque.includes(term) || modele.includes(term) || plaque.includes(term);
    };

    form!: FormGroup;
    isEditMode = false;
    maintenanceId: string | null = null;
    pageTitle = 'Nouvelle Intervention';
    submit = false;
    loading = false;
    isSubmitting = false;

    // Options pour les selects
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

    // Dynamic vehicles list
    vehicles: any[] = [];
    loadingVehicles = false;

    // Maintenance types
    maintenanceTypes: any[] = [];
    loadingTypes = false;

    // Maintenance providers
    maintenanceProviders: any[] = [];
    loadingProviders = false;

    // Files handling
    selectedFiles: File[] = [];
    existingDocs: any[] = [];
    uploading = false;

    constructor() { }

    ngOnInit(): void {
        const permissions = this.authService.getPermissions();
        this.permissionsService.loadPermissions(permissions);
        this.newForm();
        this.loadVehicles();
        this.loadMaintenanceTypes();
        this.loadMaintenanceProviders();

        this.maintenanceId = this.route.snapshot.paramMap.get('uuid') || this.route.snapshot.paramMap.get('id');

        // Auto select vehicle if passed in queryParams (from Alert Dashboard)
        const queryVehicleUuid = this.route.snapshot.queryParamMap.get('vehicleUuid');
        const queryReason = this.route.snapshot.queryParamMap.get('reason');
        if (queryVehicleUuid) {
            this.form.patchValue({ vehicle: queryVehicleUuid });
            if (queryReason) {
                this.form.patchValue({ description: 'Alerte Dashboard: ' + queryReason });
            }
        }

        if (this.maintenanceId) {
            this.isEditMode = true;
            this.pageTitle = 'Modifier l\'Intervention';
            this.loadMaintenanceData(this.maintenanceId);
        }
    }

    newForm(): void {
        this.form = this.fb.group({
            date: [new Date().toISOString().split('T')[0], Validators.required],
            vehicle: [null, Validators.required], // Store vehicle UUID
            type: [null, Validators.required],
            typeAutre: [''],
            provider: [null, Validators.required],
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

    loadVehicles(): void {
        this.loadingVehicles = true;
        this.vehicleService.getList().subscribe({
            next: (res: any) => {
                this.vehicles = res.data || res;
                this.loadingVehicles = false;
            },
            error: () => {
                this.loadingVehicles = false;
                this.toast('Erreur lors du chargement des véhicules', 'Erreur', 'error');
            }
        });
    }

    loadMaintenanceTypes(): void {
        this.loadingTypes = true;
        this.maintenanceTypeService.getAll().subscribe({
            next: (res: any) => {
                this.maintenanceTypes = res.data || res;
                this.loadingTypes = false;
            },
            error: () => {
                this.loadingTypes = false;
                this.toast('Erreur lors du chargement des types d\'intervention', 'Erreur', 'error');
            }
        });
    }

    addTypeTag = (name: string) => {
        return new Promise((resolve) => {
            this.loadingTypes = true;
            this.maintenanceTypeService.create(name).subscribe({
                next: (res: any) => {
                    const newType = res.data || res;
                    this.maintenanceTypes = [...this.maintenanceTypes, newType];
                    this.loadingTypes = false;
                    resolve(newType);
                },
                error: () => {
                    this.loadingTypes = false;
                    resolve(null);
                }
            });
        });
    };

    loadMaintenanceProviders(): void {
        this.loadingProviders = true;
        this.maintenanceProviderService.getAll().subscribe({
            next: (res: any) => {
                this.maintenanceProviders = res.data || res;
                this.loadingProviders = false;
            },
            error: () => {
                this.loadingProviders = false;
                this.toast('Erreur lors du chargement des prestataires', 'Erreur', 'error');
            }
        });
    }

    addProviderTag = (name: string) => {
        return new Promise((resolve) => {
            this.loadingProviders = true;
            this.maintenanceProviderService.create(name).subscribe({
                next: (res: any) => {
                    const newProvider = res.data || res;
                    this.maintenanceProviders = [...this.maintenanceProviders, newProvider];
                    this.loadingProviders = false;
                    resolve(newProvider);
                },
                error: () => {
                    this.loadingProviders = false;
                    resolve(null);
                }
            });
        });
    };

    loadMaintenanceData(uuid: string): void {
        this.loading = true;
        this.maintenanceService.getSingle(uuid).subscribe({
            next: (res: any) => {
                const m = res.data || res;
                // Parse options if "Autre"
                let t = m.type;
                let tA = '';
                if (!this.interventionTypes.includes(t)) {
                    tA = t; t = 'Autre';
                }
                let p = m.provider || m.prestataire;
                let pA = '';
                // Handle legacy providers that might not be in the new dynamic list yet
                if (p && !this.maintenanceProviders.find(mp => mp.name === p)) {
                    // We'll trust the value from the database
                }

                this.form.patchValue({
                    date: m.date || m.dateIntervention ? new Date(m.date || m.dateIntervention).toISOString().split('T')[0] : '',
                    vehicle: m.vehicle?.uuid || m.vehicleId || m.vehicle,
                    type: t,
                    typeAutre: tA,
                    provider: p,
                    providerAutre: pA,
                    cost: m.cost || m.cout,
                    status: m.status || m.statut,
                    kilometrage: m.kilometrage,
                    technicien: m.technician || m.technicien,
                    description: m.description || m.observation,
                    nextMaintenanceDate: m.nextMaintenanceDate ? new Date(m.nextMaintenanceDate).toISOString().split('T')[0] : '',
                    nextMaintenanceKm: m.nextMaintenanceMileage,
                });
                this.existingDocs = m.documents || [];
                this.loading = false;
            },
            error: () => {
                this.loading = false;
                this.toast('Impossible de charger les données de la maintenance.', 'Erreur', 'error');
                this.navigateBack();
            }
        });
    }

    get isTypeAutre(): boolean { return this.form.get('type')?.value === 'Autre'; }
    get isProviderAutre(): boolean { return this.form.get('provider')?.value === 'Autre prestataire'; }

    onConfirme(): void {
        this.submit = true;
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            this.toast('Veuillez remplir correctement les champs obligatoires.', 'Erreur', 'warning');
            return;
        }

        Swal.fire({
            title: '',
            text: this.isEditMode
                ? 'Confirmez-vous la modification de cette intervention ?'
                : "Confirmez-vous l'enregistrement de cette nouvelle intervention ?",
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
        this.isSubmitting = true;
        const vals = this.form.value;
        let typeValue = vals.type;
        if (typeValue && typeof typeValue === 'object') {
            typeValue = typeValue.name;
        }

        const payload: any = {
            dateIntervention: vals.date,
            vehicle: vals.vehicle,
            type: typeof vals.type === 'object' ? vals.type?.name : (vals.type === 'Autre' ? vals.typeAutre : vals.type),
            prestataire: typeof vals.provider === 'object' ? vals.provider?.name : (vals.provider === 'Autre prestataire' ? vals.providerAutre : vals.provider),
            cost: vals.cost,
            statut: vals.status,
            kilometrage: vals.kilometrage,
            technicien: vals.technicien,
            observation: vals.description,
            nextMaintenanceDate: vals.nextMaintenanceDate,
            nextMaintenanceMileage: vals.nextMaintenanceKm,
        };

        if (this.isEditMode && this.maintenanceId) {
            payload.uuid = this.maintenanceId;
        }

        this.maintenanceService.add(payload).subscribe({
            next: (res: any) => {
                const created = res.data || res;
                const finalUuid = created.uuid || this.maintenanceId;

                // Handle file uploads if any
                if (this.selectedFiles.length > 0 && finalUuid) {
                    this.uploadFiles(finalUuid);
                } else {
                    this.finalizeSave();
                }
            },
            error: (err: any) => {
                this.isSubmitting = false;
                this.toast(
                    err?.error?.message || "Une erreur est survenue lors de l'enregistrement.",
                    'Erreur', 'error'
                );
            }
        });
    }

    uploadFiles(uuid: string): void {
        this.uploading = true;
        // Convert File[] to FileList-like or just use the array if the service allows
        // Our service expects FileList, but we can craft a DataTransfer or change service to accept File[]
        // Let's just pass them as individual uploads or update service to handle array
        const formData = new FormData();
        this.selectedFiles.forEach(f => formData.append('files[]', f, f.name));

        this.maintenanceService.uploadDocuments(uuid, this.selectedFiles as any).subscribe({
            next: () => {
                this.uploading = false;
                this.finalizeSave();
            },
            error: () => {
                this.uploading = false;
                this.toast("Intervention enregistrée, mais erreur lors de l'envoi des fichiers.", "Attention", "warning");
                this.finalizeSave();
            }
        });
    }

    finalizeSave(): void {
        this.isSubmitting = false;
        this.toast(
            this.isEditMode ? 'Intervention modifiée avec succès' : 'Intervention enregistrée avec succès',
            'Succès', 'success'
        );
        this.navigateBack();
    }

    // --- File UI Handlers ---

    onFilesSelected(event: any): void {
        const files: FileList = event.target.files;
        if (!files || files.length === 0) return;

        if (this.isEditMode && this.maintenanceId) {
            // In Edit mode, upload immediately
            this.uploading = true;
            this.maintenanceService.uploadDocuments(this.maintenanceId, files).subscribe({
                next: (res: any) => {
                    this.uploading = false;
                    this.loadMaintenanceData(this.maintenanceId!); // Refresh list
                },
                error: () => {
                    this.uploading = false;
                    this.toast("Erreur lors de l'upload.", "Erreur", "error");
                }
            });
        } else {
            // In Create mode, queue them
            for (let i = 0; i < files.length; i++) {
                this.selectedFiles.push(files.item(i)!);
            }
        }
        event.target.value = ''; // Reset
    }

    removeSelectedFile(index: number): void {
        this.selectedFiles.splice(index, 1);
    }

    deleteDoc(doc: any): void {
        if (!this.maintenanceId) return;
        if (!confirm(`Supprimer le document "${doc.originalName}" ?`)) return;

        this.maintenanceService.deleteDocument(this.maintenanceId, doc.uuid).subscribe({
            next: () => {
                this.existingDocs = this.existingDocs.filter(d => d.uuid !== doc.uuid);
                this.toast("Document supprimé", "Succès", "success");
            },
            error: () => this.toast("Impossible de supprimer le document.", "Erreur", "error")
        });
    }

    /** Download a document as a Blob (auth supported) */
    downloadDoc(doc: any): void {
        if (!this.maintenanceId) return;
        this.maintenanceService.downloadDocument(this.maintenanceId, doc.uuid).subscribe({
            next: (blob: Blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = doc.originalName;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        });
    }

    formatSize(size: number): string {
        if (!size) return '0 o';
        if (size < 1024) return size + ' o';
        if (size < 1048576) return (size / 1024).toFixed(1) + ' Ko';
        return (size / 1048576).toFixed(1) + ' Mo';
    }


    onCancel(): void {
        this.navigateBack();
    }

    navigateBack(): void {
        this.router.navigate(['/gbatcar/maintenance']);
    }

    isInvalid(field: string): boolean {
        const control = this.form.get(field);
        return !!(control && control.invalid && control.touched && this.submit);
    }

    toast(msg: string, title: string, type: string): void {
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
        });
        const iconType = (['error', 'success', 'warning', 'info', 'question'].includes(type)) ? type as any : 'info';
        Toast.fire({
            icon: iconType,
            title: title ? `${title} - ${msg}` : msg
        });
    }
}

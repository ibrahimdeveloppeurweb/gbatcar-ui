import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';
import Swal from 'sweetalert2';
import { GeneralSettingService } from '../../../../../core/services/general-setting.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-gbatcar-admin-settings',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FeatherIconDirective],
    templateUrl: './settings.component.html',
    styleUrl: './settings.component.scss'
})
export class GbatcarAdminSettingsComponent implements OnInit, OnDestroy {

    settingsForm: FormGroup;
    private unsubscribeAll$ = new Subject<void>();

    constructor(
        private formBuilder: FormBuilder,
        private generalSettingService: GeneralSettingService
    ) {
        this.settingsForm = this.formBuilder.group({
            fraisDossier: [null, [Validators.required, Validators.min(0)]],
            penaliteRetardJournaliere: [null, [Validators.required, Validators.min(0), Validators.max(100)]],
            delaiGracePenalite: [null, Validators.required],
            dureeContratDefautMois: [null, Validators.required],
            apportInitialPourcentage: [null, [Validators.required, Validators.min(0), Validators.max(100)]]
        });
    }

    ngOnInit(): void {
        this.generalSettingService.getSettings()
            .pipe(takeUntil(this.unsubscribeAll$))
            .subscribe({
                next: (res) => {
                    if (res && res.data) {
                        this.settingsForm.patchValue({
                            fraisDossier: res.data.fraisDossier || 50000,
                            penaliteRetardJournaliere: res.data.penaliteRetardJournaliere || 1.5,
                            delaiGracePenalite: res.data.delaiGracePenalite || 3,
                            dureeContratDefautMois: res.data.dureeContratDefautMois || 36,
                            apportInitialPourcentage: res.data.apportInitialPourcentage || 20
                        });
                    }
                },
                error: (err) => {
                    console.error('Erreur lors du chargement des paramètres généraux', err);
                }
            });
    }

    ngOnDestroy(): void {
        this.unsubscribeAll$.next();
        this.unsubscribeAll$.complete();
    }

    saveSettings() {
        if (this.settingsForm.invalid) {
            this.settingsForm.markAllAsTouched();
            Swal.fire({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                icon: 'error',
                title: 'Veuillez corriger les erreurs dans le formulaire.'
            });
            return;
        }

        const payload = this.settingsForm.value;

        this.generalSettingService.saveSettings(payload)
            .pipe(takeUntil(this.unsubscribeAll$))
            .subscribe({
                next: () => {
                    Swal.fire({
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false,
                        timer: 3000,
                        timerProgressBar: true,
                        icon: 'success',
                        title: 'Paramètres enregistrés avec succès.'
                    });
                },
                error: (err) => {
                    Swal.fire({
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false,
                        timer: 3000,
                        timerProgressBar: true,
                        icon: 'error',
                        title: err?.error?.message || 'Erreur serveur lors de la sauvegarde.'
                    });
                }
            });
    }
}

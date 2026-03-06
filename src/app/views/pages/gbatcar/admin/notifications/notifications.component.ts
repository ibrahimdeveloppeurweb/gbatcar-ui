import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';
import Swal from 'sweetalert2';
import { NotificationService } from '../../../../../core/services/notification.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FeatherIconDirective],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss'
})
export class NotificationsComponent implements OnInit, OnDestroy {

  notificationsForm: FormGroup;
  private unsubscribeAll$ = new Subject<void>();

  // Valeurs par défaut si la base de données est vide
  defaultTemplates = {
    smsTemplateWelcome: "Bienvenue chez GbatCar {{client_name}} ! Votre dossier a été validé.",
    smsTemplateLatePayment: "Cher(e) {{client_name}}, votre paiement de {{amount}} FCFA prévu le {{due_date}} est en retard. Merci de régulariser rapidement.",
    smsTemplateMaintenance: "Bonjour {{client_name}}. Notez que le véhicule {{vehicle_plate}} a un entretien prévu le {{date}}."
  };

  constructor(
    private formBuilder: FormBuilder,
    private notificationService: NotificationService
  ) {
    this.notificationsForm = this.formBuilder.group({
      autoSendSms: [false],
      autoSendEmail: [false],
      autoSendWhatsapp: [false],
      enablePushNotifications: [false],
      smsTemplateWelcome: ['', Validators.required],
      smsTemplateLatePayment: ['', Validators.required],
      smsTemplateMaintenance: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Récupérer les données depuis l'API
    this.notificationService.getSettings()
      .pipe(takeUntil(this.unsubscribeAll$))
      .subscribe({
        next: (response) => {
          if (response?.data) {
            // Si la base de données renvoie des champs vides, on injecte les templates par défaut
            const dataToPatch = {
              ...response.data,
              smsTemplateWelcome: response.data.smsTemplateWelcome || this.defaultTemplates.smsTemplateWelcome,
              smsTemplateLatePayment: response.data.smsTemplateLatePayment || this.defaultTemplates.smsTemplateLatePayment,
              smsTemplateMaintenance: response.data.smsTemplateMaintenance || this.defaultTemplates.smsTemplateMaintenance
            };
            this.notificationsForm.patchValue(dataToPatch);
          }
        },
        error: (err) => {
          console.error('Erreur lors du chargement des notifications :', err);
        }
      });
  }

  ngOnDestroy(): void {
    this.unsubscribeAll$.next();
    this.unsubscribeAll$.complete();
  }

  saveSettings() {
    if (this.notificationsForm.invalid) {
      this.notificationsForm.markAllAsTouched();
      Swal.fire({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        icon: 'error',
        title: 'Veuillez corriger les champs requis.'
      });
      return;
    }

    const payload = this.notificationsForm.value;

    this.notificationService.saveSettings(payload)
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
            title: 'Vos configurations ont été mises à jour.'
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
            title: err?.error?.message || 'Erreur lors de la sauvegarde.'
          });
        }
      });
  }
}


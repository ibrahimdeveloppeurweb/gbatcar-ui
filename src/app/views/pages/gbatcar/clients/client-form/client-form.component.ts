import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { MOCK_CLIENTS } from '../../../../../core/mock/gbatcar-admin.mock';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';

@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FeatherIconDirective],
  templateUrl: './client-form.component.html',
  styleUrl: './client-form.component.scss'
})
export class ClientFormComponent implements OnInit {

  clientForm: FormGroup;
  isEditMode = false;
  clientId: string | null = null;
  pageTitle = 'Nouveau Client';

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.clientForm = this.formBuilder.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      birthDate: [''],
      gender: [''],
      maritalStatus: [''],
      childrenCount: [0],
      educationLevel: [''],
      profession: [''],
      incomeBracket: [''],
      primaryBankAccount: [''],
      discoveryChannel: [''],
      drivingExperienceYears: [0],
      housingStatus: [''],
      previousCreditExperience: [''],
      repaymentSource: [''],
      nationality: ['Côte d\'Ivoire'],
      birthPlace: [''],
      phone: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      city: [''],
      neighborhood: [''],
      address: ['', Validators.required],
      idNumber: ['', Validators.required],
      idIssueDate: [''],
      licenseNumber: ['', Validators.required],
      status: ['En Attente Validation']
    });
  }

  ngOnInit(): void {
    this.clientId = this.route.snapshot.paramMap.get('id');
    if (this.clientId) {
      this.isEditMode = true;
      this.pageTitle = 'Modifier le Dossier';
      this.loadClientData(this.clientId);
    }
  }

  loadClientData(id: string) {
    // Simulate loading data
    const client = MOCK_CLIENTS.find((c: any) => c.id === id);
    if (client) {
      const names = client.name.split(' ');
      this.clientForm.patchValue({
        firstName: names[0] || '',
        lastName: names[1] || '',
        birthDate: client.birthDate || '',
        gender: client.gender || '',
        maritalStatus: client.maritalStatus || '',
        childrenCount: client.childrenCount || 0,
        educationLevel: client.educationLevel || '',
        profession: client.profession || '',
        incomeBracket: client.incomeBracket || '',
        primaryBankAccount: client.primaryBankAccount || '',
        discoveryChannel: client.discoveryChannel || '',
        drivingExperienceYears: client.drivingExperienceYears || 0,
        housingStatus: client.housingStatus || '',
        previousCreditExperience: client.previousCreditExperience || '',
        repaymentSource: client.repaymentSource || '',
        nationality: client.nationality || 'Côte d\'Ivoire',
        birthPlace: client.birthPlace || '',
        phone: client.phone,
        email: client.email,
        city: client.city || '',
        neighborhood: client.neighborhood || '',
        address: client.address || '',
        idNumber: client.idNumber || '',
        idIssueDate: client.idIssueDate || '',
        licenseNumber: client.licenseNumber || '',
        status: client.status
        // Mocks for missing fields
      });
    }
  }

  saveClient() {
    if (this.clientForm.invalid) {
      this.clientForm.markAllAsTouched();
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Veuillez remplir correctement tous les champs obligatoires.'
      });
      return;
    }

    // Simulate saving
    Swal.fire({
      icon: 'success',
      title: this.isEditMode ? 'Modifications enregistrées' : 'Client ajouté',
      text: 'Le dossier a été mis à jour avec succès.',
      showConfirmButton: false,
      timer: 1500
    }).then(() => {
      this.router.navigate(['/gbatcar/clients']);
    });
  }
}

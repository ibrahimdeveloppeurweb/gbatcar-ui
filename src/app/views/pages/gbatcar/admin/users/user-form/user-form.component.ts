import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MOCK_COLLABORATORS } from '../../../../../../core/mock/gbatcar-admin.mock';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.scss'
})
export class UserFormComponent implements OnInit {
  userForm: FormGroup;
  isEditMode = false;
  currentUserId: number | null = null;
  collaborators = MOCK_COLLABORATORS;

  availablePermissions = [
    { id: 'dashboard_view', label: 'Voir le Tableau de Bord' },
    { id: 'clients_manage', label: 'Gérer les Clients' },
    { id: 'vehicles_manage', label: 'Gérer les Véhicules' },
    { id: 'payments_manage', label: 'Gérer les Paiements' },
    { id: 'settings_manage', label: 'Gérer les Paramètres' }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.userForm = this.formBuilder.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['Service Client', Validators.required],
      password: [''],
      permissions: this.formBuilder.array([])
    });

    this.addCheckboxes();
  }

  get permissionsFormArray() {
    return this.userForm.controls['permissions'] as any;
  }

  private addCheckboxes() {
    this.availablePermissions.forEach(() => this.permissionsFormArray.push(this.formBuilder.control(false)));
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.currentUserId = +id;
        this.loadUserData(this.currentUserId);
      } else {
        this.isEditMode = false;
        this.userForm.get('password')?.setValidators(Validators.required);
        this.userForm.get('password')?.updateValueAndValidity();
      }
    });
  }

  loadUserData(id: number) {
    const user = this.collaborators.find(c => c.id === id);
    if (user) {
      this.userForm.patchValue({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        password: '' // Don't show password on edit
      });

      // Set permissions based on existing data
      this.permissionsFormArray.clear();
      this.availablePermissions.forEach((perm) => {
        const hasPerm = user.permissions ? user.permissions.includes(perm.id) : false;
        this.permissionsFormArray.push(this.formBuilder.control(hasPerm));
      });

      // Optionally remove password requirement on edit
      this.userForm.get('password')?.clearValidators();
      this.userForm.get('password')?.updateValueAndValidity();
    }
  }

  navigateBack() {
    this.router.navigate(['/gbatcar/admin/users']);
  }

  saveUser() {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const formData = this.userForm.value;
    const selectedPermissions = this.userForm.value.permissions
      .map((checked: boolean, i: number) => checked ? this.availablePermissions[i].id : null)
      .filter((v: any) => v !== null);

    if (this.isEditMode && this.currentUserId) {
      // Update fake data
      const index = this.collaborators.findIndex(c => c.id === this.currentUserId);
      if (index > -1) {
        this.collaborators[index] = {
          ...this.collaborators[index],
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          role: formData.role,
          permissions: selectedPermissions
        };
      }
      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: 'Collaborateur mis à jour avec succès.',
        timer: 2000,
        showConfirmButton: false
      }).then(() => this.navigateBack());
    } else {
      // Create new
      const newUser = {
        id: Math.floor(Math.random() * 1000) + 5,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        role: formData.role,
        status: 'Actif',
        lastLogin: 'Jamais',
        permissions: selectedPermissions
      };
      this.collaborators.unshift(newUser);
      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: 'Nouveau collaborateur ajouté avec succès.',
        timer: 2000,
        showConfirmButton: false
      }).then(() => this.navigateBack());
    }
  }
}

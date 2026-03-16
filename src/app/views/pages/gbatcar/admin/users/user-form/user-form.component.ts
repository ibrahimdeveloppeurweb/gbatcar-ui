import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PermissionService } from '../../../../../../core/services/permission/permission.service';
import { UserService } from '../../../../../../core/services/user/user.service';
import { Role } from '../../../../../../core/models/permission.model';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherIconDirective } from '../../../../../../core/feather-icon/feather-icon.directive';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgSelectModule, FeatherIconDirective],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.scss'
})
export class UserFormComponent implements OnInit {
  private formBuild = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private permissionService = inject(PermissionService);
  private userService = inject(UserService);

  form!: FormGroup;
  isEditMode = false;
  currentUserId: string | null = null;
  submit: boolean = false;
  loading: boolean = false;
  isPasswordVisible: boolean = false;

  availableRoles: Role[] = [];

  constructor() {
    this.newForm();
  }

  ngOnInit(): void {
    // Load available roles from the API
    this.permissionService.getList().subscribe({
      next: (res: any) => {
        this.availableRoles = res.data || res;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des rôles', err);
      }
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.currentUserId = id;
      this.loadUserData(this.currentUserId);
    } else {
      this.isEditMode = false;
      this.form.get('password')?.setValidators(Validators.required);
      this.form.get('password')?.updateValueAndValidity();
    }
  }

  newForm() {
    this.form = this.formBuild.group({
      uuid: [null],
      firstName: [null, Validators.required],
      lastName: [null, Validators.required],
      email: [null, [Validators.required, Validators.email]],
      contact: [null, Validators.required],
      roles: [[], Validators.required], // Tableau de rôles
      password: [null]
    });
  }

  editForm(userData: any) {
    if (this.isEditMode) {
      this.form.patchValue({
        uuid: userData.uuid,
        firstName: userData.prenom, // Mapping prenom backend -> firstName form
        lastName: userData.nom,     // Mapping nom backend -> lastName form
        email: userData.email,
        contact: userData.telephone, // Mapping telephone backend -> contact form
        username: userData.email,
        roles: userData.droits ? userData.droits.map((r: any) => r.uuid || r) : [], // Extraire les UUIDs
        password: null // Ne pas afficher ou requérir le mot de passe en édition
      });

      this.form.get('password')?.clearValidators();
      this.form.get('password')?.updateValueAndValidity();
    }
  }

  loadUserData(uuid: string) {
    this.loading = true;
    this.userService.getSingle(uuid).subscribe({
      next: (res: any) => {
        const user = res.data || res;
        this.editForm(user);
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Erreur lors du chargement de l\'utilisateur', err);
        this.toast('Erreur lors du chargement de l\'utilisateur', 'Erreur', 'error');
        this.loading = false;
        this.navigateBack();
      }
    });
  }

  navigateBack() {
    this.router.navigate(['/gbatcar/admin/users']);
  }

  onConfirme() {
    this.submit = true;
    if (this.form.invalid) {
      this.toast('Veuillez remplir correctement les champs obligatoires.', 'Erreur', 'warning');
      return;
    }

    Swal.fire({
      title: '',
      text: this.isEditMode ? "Confirmez-vous la modification de cet utilisateur ?" : "Confirmez-vous l'enregistrement de ce nouvel utilisateur ?",
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

  saveData() {
    const data = this.form.getRawValue();

    // Formatter le payload pour l'API Symfony (UserManager attend nom, prenom, email, password, roles)
    const payload = {
      uuid: data.uuid,
      nom: data.lastName,
      prenom: data.firstName,
      email: data.email,
      contact: data.contact,
      username: data.email,
      password: data.password,
      // Symfony attend un tableau d'objets avec uuid pour la relation
      roles: data.roles ? data.roles.map((uuid: string) => ({ uuid: uuid })) : []
    };

    console.log("Payload à envoyer : ", payload);

    this.userService.add(payload as any).subscribe({
      next: (res) => {
        this.loading = false;
        this.toast(this.isEditMode ? 'Utilisateur modifié avec succès' : 'Utilisateur créé avec succès', 'Succès', 'success');
        this.navigateBack();
      },
      error: (err) => {
        this.loading = false;
        console.error("Erreur création utilisateur", err);
        this.toast(err.error?.msg || "Une erreur est survenue lors de l'enregistrement.", 'Erreur', 'error');
      }
    });
  }

  toast(msg: string, title: string, type: string) {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });

    const iconType = (type === 'error' || type === 'success' || type === 'warning' || type === 'info' || type === 'question')
      ? type : 'info';

    Toast.fire({
      icon: iconType,
      title: title ? `${title} - ${msg}` : msg
    });
  }
}

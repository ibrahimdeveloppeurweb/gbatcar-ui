import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../../../../../core/services/user/user.service';
import { AuthService } from '../../../../../../core/services/auth/auth.service';
import { NgxPermissionsModule, NgxPermissionsService } from 'ngx-permissions';
import { FeatherIconDirective } from '../../../../../../core/feather-icon/feather-icon.directive';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-user-details',
  standalone: true,
  imports: [CommonModule, FeatherIconDirective, NgxPermissionsModule],
  templateUrl: './user-details.component.html',
  styleUrl: './user-details.component.scss'
})
export class UserDetailsComponent implements OnInit {
  user: any;

  loading: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private authService: AuthService,
    private ngxPermissionsService: NgxPermissionsService
  ) { }

  ngOnInit(): void {
    this.ngxPermissionsService.loadPermissions(this.authService.getPermissions());
    const uuid = this.route.snapshot.paramMap.get('id');
    if (uuid) {
      this.loadUser(uuid);
    }
  }

  loadUser(uuid: string): void {
    this.loading = true;
    this.userService.getSingle(uuid).subscribe({
      next: (res: any) => {
        this.user = res.data || res;
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Erreur chargement détails collaborateur', err);
        Swal.fire('Erreur', 'Impossible de charger les détails de l\'utilisateur.', 'error');
        this.loading = false;
        this.goBack();
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/gbatcar/admin/users']);
  }

  navigateToEdit(user: any) {
    this.router.navigate(['/gbatcar/admin/users/edit', user.uuid]);
  }

  toggleStatus(user: any) {
    const action = user.isEnabled ? 'désactiver' : 'activer';
    const actionLabel = user.isEnabled ? 'Désactiver' : 'Activer';
    const iconColor = user.isEnabled ? '#d33' : '#28a745';

    Swal.fire({
      title: `${actionLabel} ce compte ?`,
      text: `Vous êtes sur le point de ${action} le compte de ${user.prenom || ''} ${user.nom}.`,
      icon: user.isEnabled ? 'warning' : 'question',
      showCancelButton: true,
      reverseButtons: true,
      confirmButtonColor: iconColor,
      cancelButtonColor: '#6c757d',
      confirmButtonText: `<i class="fa fa-check"></i> Oui, ${action}`,
      cancelButtonText: '<i class="fa fa-times"></i> Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.userService.toggle(user.uuid).subscribe({
          next: (res: any) => {
            user.isEnabled = res.isEnabled;
            Swal.fire({
              toast: true,
              position: 'top-end',
              icon: 'success',
              title: res.message,
              showConfirmButton: false,
              timer: 3000,
              timerProgressBar: true
            });
          },
          error: () => {
            Swal.fire('Erreur', 'Impossible de changer le statut du compte.', 'error');
          }
        });
      }
    });
  }

  get allPermissions(): any[] {
    if (!this.user || !this.user.droits) return [];

    // Extraire et dédoublonner toutes les permissions (paths) des différents rôles (droits)
    const permsMap = new Map();
    this.user.droits.forEach((role: any) => {
      if (role.paths) {
        role.paths.forEach((path: any) => {
          permsMap.set(path.uuid, path);
        });
      }
    });

    return Array.from(permsMap.values());
  }

  getPermissionLabel(path: any): string {
    return path.libelle || path.description || path.nom;
  }


}

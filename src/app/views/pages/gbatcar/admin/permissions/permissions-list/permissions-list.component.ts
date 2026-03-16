import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FeatherIconDirective } from '../../../../../../core/feather-icon/feather-icon.directive';
import { Role } from '../../../../../../core/models/permission.model';
import { PermissionService } from '../../../../../../core/services/permission/permission.service';
import Swal from 'sweetalert2/dist/sweetalert2.js';

@Component({
  selector: 'app-permissions-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FeatherIconDirective],
  templateUrl: './permissions-list.component.html',
  styles: ``
})
export class PermissionsListComponent implements OnInit {
  private router = inject(Router);
  private permissionService = inject(PermissionService);

  roles: Role[] = [];
  loading: boolean = true;

  constructor() { }

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.loading = true;
    this.permissionService.getList().subscribe({
      next: (res: any) => {
        // L'API renvoie souvent le tableau de données dans res ou res.data, on s'assure de l'extraire
        this.roles = res.data || res;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur de chargement des rôles:', err);
        this.loading = false;
        // Optionnel : afficher un toast d'erreur
      }
    });
  }

  navigateToAdd(): void {
    this.router.navigate(['/gbatcar/admin/permissions/add']);
  }

  navigateToEdit(role: any): void {
    this.router.navigate(['/gbatcar/admin/permissions/edit', role.uuid]);
  }

  navigateToDetails(role: any): void {
    this.router.navigate(['/gbatcar/admin/permissions/details', role.uuid]);
  }

  onDelete(role: any): void {
    Swal.fire({
      title: 'Êtes-vous sûr ?',
      text: `Voulez-vous vraiment supprimer le rôle "${role.nom}" ? Cette action est irréversible.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, supprimer !',
      cancelButtonText: 'Annuler'
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.permissionService.getDelete(role.uuid).subscribe({
          next: () => {
            Swal.fire({
              toast: true,
              position: 'top-end',
              showConfirmButton: false,
              timer: 3000,
              icon: 'success',
              title: 'Rôle supprimé avec succès'
            });
            this.loadRoles();
          },
          error: (err: any) => {
            Swal.fire({
              toast: true,
              position: 'top-end',
              showConfirmButton: false,
              timer: 3000,
              icon: 'error',
              title: err?.error?.message || err?.message || 'Erreur lors de la suppression'
            });
          }
        });
      }
    });
  }
}

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FeatherIconDirective } from '../../../../../../core/feather-icon/feather-icon.directive';

@Component({
  selector: 'app-permissions-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FeatherIconDirective],
  templateUrl: './permissions-list.component.html',
  styles: ``
})
export class PermissionsListComponent implements OnInit {
  private router = inject(Router);

  roles = [
    { id: 1, name: 'Super-Admin', description: 'Accès total à tous les modules du système.', usersCount: 2, permissionsCount: 'Toutes les permissions', badgeClass: 'bg-danger' },
    { id: 2, name: 'Gérant', description: 'Gestion des locations, véhicules et paiements. Pas d\'accès aux paramètres globaux.', usersCount: 3, permissionsCount: '12 permissions', badgeClass: 'bg-success' },
    { id: 3, name: 'Comptable', description: 'Accès en lecture et écriture sur les paiements et factures uniquement.', usersCount: 1, permissionsCount: '5 permissions', badgeClass: 'bg-info' },
    { id: 4, name: 'Mécanicien', description: 'Accès au module d\'intervention technique et historique véhicules.', usersCount: 4, permissionsCount: '2 permissions', badgeClass: 'bg-secondary' },
    { id: 5, name: 'Service Client', description: 'Accès aux dossiers clients et suivi des contrats (lecture seule).', usersCount: 5, permissionsCount: '1 permission', badgeClass: 'bg-warning text-dark' }
  ];

  constructor() { }

  ngOnInit(): void {
  }

  navigateToAdd(): void {
    this.router.navigate(['/gbatcar/admin/permissions/add']);
  }

  navigateToEdit(role: any): void {
    this.router.navigate(['/gbatcar/admin/permissions/edit', role.id]);
  }

  navigateToDetails(role: any): void {
    this.router.navigate(['/gbatcar/admin/permissions/details', role.id]);
  }
}

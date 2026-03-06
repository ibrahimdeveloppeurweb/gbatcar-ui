import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MOCK_COLLABORATORS } from '../../../../../../core/mock/gbatcar-admin.mock';
import { FeatherIconDirective } from '../../../../../../core/feather-icon/feather-icon.directive';

@Component({
  selector: 'app-user-details',
  standalone: true,
  imports: [CommonModule, FeatherIconDirective],
  templateUrl: './user-details.component.html',
  styleUrl: './user-details.component.scss'
})
export class UserDetailsComponent implements OnInit {
  user: any;

  constructor(private route: ActivatedRoute, private router: Router) { }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = parseInt(idParam, 10);
      this.user = MOCK_COLLABORATORS.find(u => u.id === id);
    }
  }

  goBack(): void {
    this.router.navigate(['/gbatcar/admin/users']);
  }

  navigateToEdit(user: any) {
    this.router.navigate(['/gbatcar/admin/users/edit', user.id]);
  }

  toggleStatus(user: any) {
    if (user) {
      user.status = user.status === 'Actif' ? 'Inactif' : 'Actif';
    }
  }

  getPermissionLabel(code: string): string {
    const map: any = {
      'dashboard_view': 'Vue d\'ensemble (Tableau de bord)',
      'clients_manage': 'Gestion des Locataires',
      'vehicles_manage': 'Gestion de la Flotte (Véhicules)',
      'payments_manage': 'Gestion des Paiements & Trésorerie',
      'settings_manage': 'Administration & Paramètres'
    };
    return map[code] || code;
  }
}

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { FeatherIconDirective } from '../../../../../../core/feather-icon/feather-icon.directive';
import { PathService } from '../../../../../../core/services/path/path.service';

@Component({
  selector: 'app-permission-details',
  standalone: true,
  imports: [CommonModule, RouterLink, FeatherIconDirective],
  templateUrl: './permission-details.component.html',
  styles: ``
})
export class PermissionDetailsComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private pathService = inject(PathService);

  roleName: string = '';
  roleDescription: string = '';

  modules: any[] = [];

  constructor() { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    // Mocks for now until role API is connected
    if (id === '1') {
      this.roleName = 'Super-Admin';
      this.roleDescription = 'Accès total à tous les modules sans restriction.';
    } else {
      this.roleName = 'Gérant';
      this.roleDescription = 'Gestion des locations, véhicules et paiements. Pas d\'accès aux paramètres globaux.';
    }

    // this.loadAdminPaths(id);
  }

  // loadAdminPaths(roleId: string | null): void {
  //   this.pathService.getAdminPaths().subscribe({
  //     next: (paths: any[]) => {
  //       const menuPaths = paths.filter(p => p.nom && p.nom.startsWith('MENU_'));
  //       const actionPaths = paths.filter(p => !p.nom || !p.nom.startsWith('MENU_'));

  //       let isSuperAdmin = (roleId === '1');

  //       const allItems = menuPaths.map(path => {
  //         return {
  //           id: path.id,
  //           name: path.libelle,
  //           nomMachine: path.nom,
  //           chemin: path.chemin,
  //           actions: [] as any[],
  //           subItems: [] as any[]
  //         };
  //       });

  //       let groupedModules: any[] = [];

  //       // 1. Isoler les parents explicites
  //       const parents = allItems.filter(p => p.nomMachine && p.nomMachine.includes('PARENT_'));
  //       let remainingItems = allItems.filter(p => !p.nomMachine || !p.nomMachine.includes('PARENT_'));

  //       parents.forEach(parent => {
  //         let parentIdentifier = parent.nomMachine.replace('MENU_PARENT_', '');

  //         // Trouver les enfants menus
  //         parent.subItems = remainingItems.filter(child => child.nomMachine && child.nomMachine.includes(`MENU_${parentIdentifier}_`));

  //         // Retirer ces enfants de la liste des restants
  //         remainingItems = remainingItems.filter(child => !(child.nomMachine && child.nomMachine.includes(`MENU_${parentIdentifier}_`)));

  //         groupedModules.push(parent);
  //       });

  //       // 2. Ajouter les modules restants (sans parents explicites) à la racine
  //       remainingItems.forEach(item => {
  //         groupedModules.push(item);
  //       });

  //       // 3. Assigner les actions récupérées de l'API (actionPaths) aux menus correspondants
  //       actionPaths.forEach(action => {
  //         const act = {
  //           id: action.id,
  //           name: action.libelle || action.permission || action.nom,
  //           checked: isSuperAdmin
  //         };

  //         if (action.chemin) {
  //           const extractedPath = action.chemin.replace('/api/private', '').split('/')[1];
  //           let attached = false;

  //           for (let parent of groupedModules) {
  //             if (parent.subItems) {
  //               for (let child of parent.subItems) {
  //                 if (child.chemin && action.chemin.startsWith(child.chemin)) {
  //                   child.actions.push(act);
  //                   attached = true;
  //                   break;
  //                 }
  //               }
  //             }
  //             if (attached) break;
  //             if (parent.chemin && action.chemin.startsWith(parent.chemin)) {
  //               parent.actions.push(act);
  //               attached = true;
  //               break;
  //             }
  //           }
  //         }
  //       });

  //       this.modules = groupedModules;

  //       this.modules = groupedModules;
  //     },
  //     error: (err) => {
  //       console.error('Erreur lors du chargement des menus (Paths): ', err);
  //     }
  //   });
  // }

  editPermission(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.router.navigate(['/gbatcar/admin/permissions/edit', id]);
  }

  backToList(): void {
    this.router.navigate(['/gbatcar/admin/permissions']);
  }

  trackByActionId(index: number, action: any): number {
    return action.id;
  }
}

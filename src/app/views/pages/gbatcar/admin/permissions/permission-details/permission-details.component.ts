import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { FeatherIconDirective } from '../../../../../../core/feather-icon/feather-icon.directive';
import { Role } from '../../../../../../core/models/permission.model';
import { PathService } from '../../../../../../core/services/path/path.service';
import { PermissionService } from '../../../../../../core/services/permission/permission.service';
import { AuthService } from '../../../../../../core/services/auth/auth.service';
import { NgxPermissionsModule, NgxPermissionsService } from 'ngx-permissions';

@Component({
  selector: 'app-permission-details',
  standalone: true,
  imports: [CommonModule, RouterLink, FeatherIconDirective, NgxPermissionsModule],
  templateUrl: './permission-details.component.html',
  styles: ``
})
export class PermissionDetailsComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private pathService = inject(PathService);
  private permissionService = inject(PermissionService);
  private authService = inject(AuthService);
  private ngxPermissionsService = inject(NgxPermissionsService);

  roleName: string = '';
  roleDescription: string = '';

  modules: any[] = [];

  constructor() { }

  ngOnInit(): void {
    this.ngxPermissionsService.loadPermissions(this.authService.getPermissions());
    const uuid = this.route.snapshot.paramMap.get('id'); // this is actually a UUID now
    if (uuid) {
      this.loadRoleData(uuid);
    }
  }

  loadRoleData(uuid: string): void {
    this.permissionService.getSingle(uuid).subscribe({
      next: (res: any) => {
        const role: Role = res.data || res;
        this.roleName = role.nom || '';
        this.roleDescription = role.description || '';

        // Extract the paths currently assigned to this role (using id to match action.id later)
        const rolePathIds = role.paths ? role.paths.map((p: any) => p.id) : [];

        // Load all available paths and check the ones this role has
        this.loadAdminPaths(rolePathIds);
      },
      error: (err) => {
        console.error('Erreur lors du chargement du rôle:', err);
      }
    });
  }

  loadAdminPaths(rolePathIds: number[]): void {
    this.pathService.getList().subscribe({
      next: (res: any) => {
        const paths = res.data || res;
        const menuPaths = paths.filter((p: any) => p.nom && p.nom.startsWith('MENU_'));
        const actionPaths = paths.filter((p: any) => !p.nom || !p.nom.startsWith('MENU_'));

        const allItems = menuPaths.map((path: any) => {
          return {
            id: path.id,
            name: path.libelle,
            nomMachine: path.nom,
            chemin: path.chemin,
            actions: [] as any[],
            subItems: [] as any[]
          };
        });

        let groupedModules: any[] = [];

        // 1. Isoler les parents explicites
        const parents = allItems.filter((p: any) => p.nomMachine && p.nomMachine.includes('PARENT_'));
        let remainingItems = allItems.filter((p: any) => !p.nomMachine || !p.nomMachine.includes('PARENT_'));

        parents.forEach((parent: any) => {
          let parentIdentifier = parent.nomMachine.replace('MENU_PARENT_', '');

          // Trouver les enfants menus
          parent.subItems = remainingItems.filter((child: any) => child.nomMachine && child.nomMachine.includes(`MENU_${parentIdentifier}_`));

          // Retirer ces enfants de la liste des restants
          remainingItems = remainingItems.filter((child: any) => !(child.nomMachine && child.nomMachine.includes(`MENU_${parentIdentifier}_`)));

          groupedModules.push(parent);
        });

        // 2. Ajouter les modules restants (sans parents explicites) à la racine
        remainingItems.forEach((item: any) => {
          groupedModules.push(item);
        });

        // 3. Assigner les actions récupérées de l'API (actionPaths) aux menus correspondants
        actionPaths.forEach((action: any) => {
          // L'action est cochée uniquement si son ID figure dans la liste des permissions de ce rôle
          const isChecked = rolePathIds.includes(action.id);

          const act = {
            id: action.id,
            name: action.libelle || action.permission || action.nom,
            checked: isChecked
          };

          let moduleKeyword = '';
          let actionSubKeyword = '';

          if (action.permission) {
            const parts = action.permission.split(':');
            moduleKeyword = parts[0].toUpperCase();
            actionSubKeyword = parts.length > 1 ? parts[1].toUpperCase() : '';
          } else if (action.nom) {
            moduleKeyword = action.nom.split('_')[0].toUpperCase();
          }

          // Mapping manuel des mots-clés API vers l'identifiant des parents de menus
          let parentKeyword = moduleKeyword;

          // Exception pour les statistiques du tableau de bord de l'admin
          if (moduleKeyword === 'DASHBOARD' && actionSubKeyword === 'ADMIN') {
            parentKeyword = 'ADMIN';
            actionSubKeyword = 'DASHBOARD'; // Force la direction vers le sous-menu Dashboard de l'Admin
          }

          if (['ROLE', 'USER', 'SETTING', 'PATH', 'PERMISSION', 'NOTIFICATION'].includes(moduleKeyword)) {
            parentKeyword = 'ADMIN';
          } else if (['VEHICLE', 'RESERVATION', 'CAR', 'CATALOG', 'COMPLIANCE'].includes(moduleKeyword)) {
            parentKeyword = 'VEHICLES';
          } else if (['CLIENT', 'LOCATAIRE'].includes(moduleKeyword)) {
            parentKeyword = 'CLIENTS';
          } else if (['CONTRACT', 'LATE'].includes(moduleKeyword)) {
            parentKeyword = 'CONTRACTS';
          } else if (['PAYMENT', 'INVOICE', 'PENALTY'].includes(moduleKeyword)) {
            parentKeyword = 'PAYMENTS';
          } else if (['MAINTENANCE', 'INTERVENTION', 'ALERT', 'SINISTRE', 'MAINTENANCE_ALERT'].includes(moduleKeyword)) {
            parentKeyword = 'MAINTENANCE';
          }

          let bestMatch = null;

          // Trouver le bon parent
          let targetParent = groupedModules.find(p => p.nomMachine && p.nomMachine.includes(parentKeyword));

          if (!targetParent) {
            // Tentative de fallback sur un module qui contient le mot clé exact
            targetParent = groupedModules.find(p => p.nomMachine && p.nomMachine.includes(moduleKeyword));
          }

          if (targetParent) {
            if (targetParent.subItems && targetParent.subItems.length > 0) {
              // Par défaut, rediriger vers le sous-menu "Liste"
              let targetSuffix = 'LIST';

              if (actionSubKeyword === 'DASHBOARD' || actionSubKeyword === 'STATS' || actionSubKeyword === 'STATISTICS' || (act.name && act.name.toLowerCase().includes('statistique'))) {
                targetSuffix = 'DASHBOARD';
              } else if (moduleKeyword === 'ROLE' || moduleKeyword === 'PATH' || moduleKeyword === 'PERMISSION') {
                targetSuffix = 'PERMISSIONS';
              } else if (moduleKeyword === 'USER') {
                targetSuffix = 'USERS';
              } else if (moduleKeyword === 'SETTING') {
                targetSuffix = 'SETTINGS';
              } else if (moduleKeyword === 'NOTIFICATION') {
                targetSuffix = 'NOTIFICATIONS';
              } else if (['COMPLIANCE', 'LATE', 'PENALTIES', 'ALERTS'].includes(actionSubKeyword) || ['COMPLIANCE', 'LATE', 'PENALTY', 'ALERT', 'MAINTENANCE_ALERT'].includes(moduleKeyword)) {
                if (moduleKeyword === 'PENALTY' || actionSubKeyword === 'PENALTIES') targetSuffix = 'PENALTIES';
                else if (moduleKeyword === 'COMPLIANCE' || actionSubKeyword === 'COMPLIANCE') targetSuffix = 'COMPLIANCE';
                else if (moduleKeyword === 'LATE' || actionSubKeyword === 'LATE') targetSuffix = 'LATE';
                else if (moduleKeyword === 'ALERT' || moduleKeyword === 'MAINTENANCE_ALERT' || actionSubKeyword === 'ALERTS') targetSuffix = 'ALERTS';
              }

              if (moduleKeyword === 'CATALOG') {
                bestMatch = targetParent.subItems.find((s: any) => s.nomMachine === 'MENU_VEHICLES_CATALOG');
              } else {
                bestMatch = targetParent.subItems.find((s: any) => s.nomMachine && s.nomMachine.includes(targetSuffix));
              }

              if (!bestMatch) {
                bestMatch = targetParent.subItems.find((s: any) => s.nomMachine && !s.nomMachine.includes('DASHBOARD'));
              }
              if (!bestMatch) {
                bestMatch = targetParent.subItems[0];
              }
            } else {
              bestMatch = targetParent;
            }
          }

          if (bestMatch) {
            bestMatch.actions.push(act);
          }
        });

        // Filtrer uniquement les éléments cochés (appartenant à ce rôle)
        groupedModules.forEach(module => {
          if (module.subItems) {
            module.subItems.forEach((sub: any) => {
              if (sub.actions) {
                sub.actions = sub.actions.filter((act: any) => act.checked);
              }
            });
            // Garder les sous-menus qui ont au moins une action coché
            module.subItems = module.subItems.filter((sub: any) => sub.actions && sub.actions.length > 0);
          }
          if (module.actions) {
            module.actions = module.actions.filter((act: any) => act.checked);
          }
        });

        // Garder les modules qui ont des sous-menus (avec des actions) ou des actions directes
        groupedModules = groupedModules.filter(module =>
          (module.subItems && module.subItems.length > 0) ||
          (module.actions && module.actions.length > 0)
        );

        const MENU: any[] = [
          { nom: "MENU_DASHBOARD_MAIN" },
          { nom: "MENU_PARENT_CLIENTS", subItems: [{ nom: "MENU_CLIENTS_DASHBOARD" }, { nom: "MENU_CLIENTS_LIST" }] },
          { nom: "MENU_PARENT_VEHICLES", subItems: [{ nom: "MENU_VEHICLES_DASHBOARD" }, { nom: "MENU_VEHICLES_LIST" }, { nom: "MENU_VEHICLES_CATALOG" }, { nom: "MENU_VEHICLES_COMPLIANCE" }] },
          { nom: "MENU_PARENT_MAINTENANCE", subItems: [{ nom: "MENU_MAINTENANCE_DASHBOARD" }, { nom: "MENU_MAINTENANCE_INTERVENTIONS" }, { nom: "MENU_MAINTENANCE_ALERTS" }] },
          { nom: "MENU_PARENT_CONTRACTS", subItems: [{ nom: "MENU_CONTRACTS_DASHBOARD" }, { nom: "MENU_CONTRACTS_LIST" }, { nom: "MENU_CONTRACTS_LATE" }] },
          { nom: "MENU_PARENT_PAYMENTS", subItems: [{ nom: "MENU_PAYMENTS_INVOICES" }, { nom: "MENU_PAYMENTS_LIST" }, { nom: "MENU_PAYMENTS_PENALTIES" }] },
          { nom: "MENU_PARENT_APPS", subItems: [{ nom: "MENU_APPS_CALENDAR" }, { nom: "MENU_APPS_CHAT" }] },
          { nom: "MENU_PARENT_ADMIN", subItems: [{ nom: "MENU_ADMIN_DASHBOARD" }, { nom: "MENU_ADMIN_USERS" }, { nom: "MENU_ADMIN_PERMISSIONS" }, { nom: "MENU_ADMIN_SETTINGS" }, { nom: "MENU_ADMIN_NOTIFICATIONS" }] }
        ];

        const flattenMenu = (items: any[]): any[] => {
          let result: any[] = [];
          items.forEach(item => {
            if (item.nom) result.push(item);
            if (item.subItems) result = result.concat(flattenMenu(item.subItems));
          });
          return result;
        };
        const flatMenu = flattenMenu(MENU);

        groupedModules.sort((a, b) => {
          const indexA = flatMenu.findIndex(m => m.nom === a.nomMachine);
          const indexB = flatMenu.findIndex(m => m.nom === b.nomMachine);
          const posA = indexA === -1 ? 999 : indexA;
          const posB = indexB === -1 ? 999 : indexB;
          return posA - posB;
        });

        groupedModules.forEach(module => {
          if (module.subItems) {
            module.subItems.sort((a: any, b: any) => {
              const indexA = flatMenu.findIndex(m => m.nom === a.nomMachine);
              const indexB = flatMenu.findIndex(m => m.nom === b.nomMachine);
              const posA = indexA === -1 ? 999 : indexA;
              const posB = indexB === -1 ? 999 : indexB;
              return posA - posB;
            });
          }
        });

        this.modules = groupedModules;
      },
      error: (err: any) => {
        console.error('Erreur lors du chargement des menus (Paths): ', err);
      }
    });
  }

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

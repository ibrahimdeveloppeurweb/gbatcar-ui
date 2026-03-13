import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FeatherIconDirective } from '../../../../../../core/feather-icon/feather-icon.directive';
import { PathService } from '../../../../../../core/services/path/path.service';

@Component({
  selector: 'app-permission-form',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, FeatherIconDirective],
  templateUrl: './permission-form.component.html',
  styles: ``
})
export class PermissionFormComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private pathService = inject(PathService);

  roleName: string = '';
  roleDescription: string = '';
  isEditMode: boolean = false;

  modules: any[] = [];

  constructor() { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.roleName = 'Gérant'; // Simuler un chargement
      this.roleDescription = 'Gestion des locations, véhicules et paiements. Pas d\'accès aux paramètres globaux.';
    }

    this.loadAdminPaths();
  }

  loadAdminPaths(): void {
    this.pathService.getList().subscribe({
      next: (paths: any[]) => {

        const menuPaths = paths.filter(p => p.nom && p.nom.startsWith('MENU_'));
        const actionPaths = paths.filter(p => !p.nom || !p.nom.startsWith('MENU_'));


        // Convertir tous les paths en base
        const allItems = menuPaths.map(path => ({
          id: path.id,
          name: path.libelle,
          nomMachine: path.nom,
          chemin: path.chemin,
          actions: [] as any[], // Stocke dynamiquement les actions/droits d'accès liés à ce menu
          subItems: [] as any[] // Propriété pour stocker les enfants
        }));

        let groupedModules: any[] = [];

        // 1. Isoler les parents explicites
        const parents = allItems.filter(p => p.nomMachine && p.nomMachine.includes('PARENT_'));
        let remainingItems = allItems.filter(p => !p.nomMachine || !p.nomMachine.includes('PARENT_'));
        parents.forEach(parent => {
          let parentIdentifier = parent.nomMachine.replace('MENU_PARENT_', ''); // ex: CLIENTS

          // Trouver les enfants menus
          parent.subItems = remainingItems.filter(child => child.nomMachine && child.nomMachine.includes(`MENU_${parentIdentifier}_`));

          remainingItems = remainingItems.filter(child => !(child.nomMachine && child.nomMachine.includes(`MENU_${parentIdentifier}_`)));

          groupedModules.push(parent);
        });

        // 2. Ajouter les modules restants à la racine
        remainingItems.forEach(item => {
          groupedModules.push(item);
        });

        // 3. Assigner les actions récupérées de l'API (actionPaths) aux menus correspondants
        // On se base sur le champ 'permission' ex: "PATH:NEW" -> on va essayer de le lier grossièrement
        // Ou plus simple : on s'attend à ce que le backend retourne des descriptions pertinentes "Lecture (Voir)", "Création" 
        // L'idéal est de les regrouper par préfixe d'URL (chemin) ex: "/api/private/admin/users" -> MENU_ADMIN_USERS
        console.log(actionPaths);
        actionPaths.forEach(action => {
          const act = {
            id: action.id,
            name: action.libelle || action.permission || action.nom,
            checked: false
          };

          // Chercher le meilleur menu de rattachement basé sur le début de l'URL
          // On ignore "/api/private" pour extraire l'entité
          if (action.chemin) {
            const extractedPath = action.chemin.replace('/api/private', '').split('/')[1]; // ex: "admin", "client"

            // Attribution simplifiée : on attache d'abord aux enfants correspondants, ou sinon au parent.
            // Le but ici est de démontrer un affichage par regroupement dynamique strict depuis API
            let attached = false;

            // On parcourt recursivement nos menus
            for (let parent of groupedModules) {
              if (parent.subItems) {
                for (let child of parent.subItems) {
                  if (child.chemin && action.chemin.startsWith(child.chemin)) {
                    child.actions.push(act);
                    attached = true;
                    break;
                  }
                }
              }
              if (attached) break;
              if (parent.chemin && action.chemin.startsWith(parent.chemin)) {
                parent.actions.push(act);
                attached = true;
                break;
              }
            }

            // Si on n'a pas pu l'attacher à un menu spécifique, on le met sur le premier parent trouvé par défaut
            if (!attached && groupedModules.length > 0) {
              // groupedModules[0].actions.push(act); // Optionnel: Eviter de polluer le dashboard
            }
          }
        });

        this.modules = groupedModules;
        console.log(this.modules);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des menus (Paths): ', err);
      }
    });
  }

  savePermission(): void {
    // Logique de validation et sauvegarde
    this.router.navigate(['/gbatcar/admin/permissions']);
  }

  cancel(): void {
    this.router.navigate(['/gbatcar/admin/permissions']);
  }

  toggleAll(module: any, event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    if (module.actions) {
      module.actions.forEach((action: any) => action.checked = isChecked);
    }
    if (module.subItems) {
      module.subItems.forEach((sub: any) => {
        if (sub.actions) {
          sub.actions.forEach((action: any) => action.checked = isChecked);
        }
      });
    }
  }

  trackByActionId(index: number, action: any): number {
    return action.id;
  }
}

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FeatherIconDirective } from '../../../../../../core/feather-icon/feather-icon.directive';
import { Role } from '../../../../../../core/models/permission.model';
import { PathService } from '../../../../../../core/services/path/path.service';
import { PermissionService } from '../../../../../../core/services/permission/permission.service';
import { MENU } from '../../../../../layout/sidebar/menu';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-permission-form',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule, FeatherIconDirective],
  templateUrl: './permission-form.component.html',
  styles: ``
})
export class PermissionFormComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private pathService = inject(PathService);
  private permissionService = inject(PermissionService);
  private formBuild = inject(FormBuilder);

  form!: FormGroup;
  isEditMode: boolean = false;
  roleUuid: string | null = null;
  loading: boolean = false;
  submit: boolean = false;

  modules: any[] = [];

  constructor() {
    this.newForm();
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.roleUuid = id;
      this.loadRoleData(id);
    } else {
      this.loadAdminPaths();
    }
  }

  newForm() {
    this.form = this.formBuild.group({
      uuid: [null],
      id: [null],
      nom: [null, [Validators.required]],
      description: [null]
    });
  }

  editForm(role: Role) {
    if (this.isEditMode) {
      this.form.patchValue({
        uuid: role.uuid,
        id: role.id,
        nom: role.nom,
        description: role.description
      });
    }
  }

  loadRoleData(uuid: string): void {
    this.loading = true;
    this.permissionService.getSingle(uuid).subscribe({
      next: (res: any) => {
        const role: Role = res.data || res;
        this.editForm(role);
        // Collecter les UUIDs des paths déjà assignés
        const rolePathUuids = role.paths ? role.paths.map((p: any) => p.uuid) : [];
        this.loadAdminPaths(rolePathUuids);
      },
      error: (err: any) => {
        console.error('Erreur lors du chargement du rôle', err);
        this.loading = false;
        this.loadAdminPaths();
      }
    });
  }

  loadAdminPaths(rolePathUuids: string[] = []): void {
    this.pathService.getList().subscribe({
      next: (res: any) => {
        this.loading = false;
        const paths = res.data || res;
        const menuPaths = paths.filter((p: any) => p.nom && p.nom.startsWith('MENU_'));
        const actionPaths = paths.filter((p: any) => !p.nom || !p.nom.startsWith('MENU_'));


        // Convertir tous les paths en base
        const allItems = menuPaths.map((path: any) => ({
          id: path.id,
          uuid: path.uuid,
          name: path.libelle,
          nomMachine: path.nom,
          chemin: path.chemin,
          checked: rolePathUuids.includes(path.uuid), // Ajout de la case à cocher pour le menu lui-même
          actions: [] as any[], // Stocke dynamiquement les actions/droits d'accès liés à ce menu
          subItems: [] as any[] // Propriété pour stocker les enfants
        }));

        let groupedModules: any[] = [];

        // 1. Isoler les parents explicites
        const parents = allItems.filter((p: any) => p.nomMachine && p.nomMachine.includes('PARENT_'));
        let remainingItems = allItems.filter((p: any) => !p.nomMachine || !p.nomMachine.includes('PARENT_'));
        parents.forEach((parent: any) => {
          let parentIdentifier = parent.nomMachine.replace('MENU_PARENT_', ''); // ex: CLIENTS

          // Trouver les enfants menus
          parent.subItems = remainingItems.filter((child: any) => child.nomMachine && child.nomMachine.includes(`MENU_${parentIdentifier}_`));

          remainingItems = remainingItems.filter((child: any) => !(child.nomMachine && child.nomMachine.includes(`MENU_${parentIdentifier}_`)));

          groupedModules.push(parent);
        });

        // 2. Ajouter les modules restants à la racine
        remainingItems.forEach((item: any) => {
          groupedModules.push(item);
        });

        // 3. Assigner les actions récupérées de l'API aux menus correspondants
        actionPaths.forEach((action: any) => {
          const act = {
            id: action.id,
            uuid: action.uuid,
            name: action.libelle || action.permission || action.nom,
            checked: rolePathUuids.includes(action.uuid)
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
          console.log(parentKeyword);


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

          // Specific handling for APP modules like Chat, Calendar (which act as both parent and leaf)
          if (parentKeyword === 'CHAT') {
            targetParent = groupedModules.find(p => p.nomMachine === 'MENU_APPS_CHAT');
            bestMatch = targetParent;
          } else if (parentKeyword === 'CALENDAR') {
            targetParent = groupedModules.find(p => p.nomMachine === 'MENU_APPS_CALENDAR');
            bestMatch = targetParent;
          }


          if (targetParent) {
            if (targetParent.subItems && targetParent.subItems.length > 0) {
              // Par défaut, rediriger vers le sous-menu "Liste"
              let targetSuffix = 'LIST';

              // Redirection vers Dashboard si c'est des statistiques ou dashboard
              // Redirection vers Dashboard si c'est des statistiques ou dashboard
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

              // Fallback: Si on n'a pas trouvé (ex: pas de menu LIST), on prend un autre sous-menu (idéalement pas le dashboard si possible)
              if (!bestMatch) {
                bestMatch = targetParent.subItems.find((s: any) => s.nomMachine && !s.nomMachine.includes('DASHBOARD'));
              }
              // Dernier recours: on prend le premier élément
              if (!bestMatch) {
                bestMatch = targetParent.subItems[0];
              }
            } else {
              // Pas d'enfants (ex: App Chat), on met sur le parent
              bestMatch = targetParent;
            }
          }

          if (bestMatch) {
            bestMatch.actions.push(act);
          } else {
            // Orphelins: les lier au premier module par défaut ou les ignorer
            if (groupedModules.length > 0) {
              // Non-affiché pour le moment
              // groupedModules[0].actions.push(act);
            }
          }
        });

        // 4. Trier les modules parents pour respecter l'ordre d'affichage de la Sidebar (MENU)
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
          // Si non trouvé (-1), le mettre à la fin
          const posA = indexA === -1 ? 999 : indexA;
          const posB = indexB === -1 ? 999 : indexB;
          return posA - posB;
        });

        // Trier aussi les sous-menus à l'intérieur de chaque module
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
        console.log(this.modules);
      },
      error: (err: any) => {
        console.error('Erreur lors du chargement des menus (Paths): ', err);
        this.loading = false;
      }
    });
  }

  get f() { return this.form.controls; }

  onConfirme() {
    this.submit = true;
    if (this.form.invalid) {
      this.toast('Veuillez remplir correctement les champs obligatoires.', 'Erreur', 'warning');
      return;
    }

    Swal.fire({
      title: '',
      text: 'Confirmez-vous l\'enregistrement de ce rôle ?',
      icon: 'warning',
      showCancelButton: true,
      showCloseButton: true,
      confirmButtonText: 'Confirmer <i class="fas fa-check"></i>',
      cancelButtonText: 'Annuler <i class="feather icon-x-circle"></i>',
      confirmButtonColor: '#1bc943',
      reverseButtons: true
    }).then((willDelete: any) => {
      if (!willDelete.dismiss) {
        this.savePermission();
      }
    });
  }

  savePermission(): void {
    const selectedUuids: string[] = [];
    this.loading = true;

    // Collecter tous les UUIDs cochés
    this.modules.forEach(mod => {
      if (mod.checked && mod.uuid) selectedUuids.push(mod.uuid);

      if (mod.actions) {
        mod.actions.forEach((act: any) => { if (act.checked && act.uuid) selectedUuids.push(act.uuid); });
      }

      if (mod.subItems) {
        mod.subItems.forEach((sub: any) => {
          if (sub.checked && sub.uuid) selectedUuids.push(sub.uuid);
          if (sub.actions) {
            sub.actions.forEach((act: any) => { if (act.checked && act.uuid) selectedUuids.push(act.uuid); });
          }
        });
      }
    });

    // Construire le payload sous forme de tableau de {uuid: "..."}
    const payloadPaths = selectedUuids.map(uuid => ({ uuid: uuid }));

    let payload: any = {
      ...this.form.getRawValue(),
      paths: payloadPaths
    };

    this.permissionService.add(payload).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.toast('Le rôle a été enregistré avec succès.', 'Succès', 'success');
        this.router.navigate(['/gbatcar/admin/permissions']);
      },
      error: (err: any) => {
        console.error("Erreur lors de la sauvegarde:", err);
        this.toast('Une erreur est survenue lors de l\'enregistrement.', 'Erreur', 'error');
        this.loading = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/gbatcar/admin/permissions']);
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

  toggleAll(module: any, event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    module.checked = isChecked;
    if (module.actions) {
      module.actions.forEach((action: any) => action.checked = isChecked);
    }
    if (module.subItems) {
      module.subItems.forEach((sub: any) => {
        sub.checked = isChecked;
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

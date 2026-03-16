import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../../../../../core/services/user/user.service';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-gbatcar-admin-users',
    standalone: true,
    imports: [CommonModule, RouterModule, FeatherIconDirective],
    templateUrl: './users.component.html',
    styleUrl: './users.component.scss'
})
export class GbatcarAdminUsersComponent implements OnInit {

    collaborators: any[] = [];
    loading: boolean = false;
    
    private router = inject(Router);
    private userService = inject(UserService);

    constructor() { }

    formatPermissions(permissions: string[] | undefined): string {
        if (!permissions || permissions.length === 0) return 'Aucune permission';
        return permissions.length + ' permission' + (permissions.length > 1 ? 's' : '');
    }

    ngOnInit(): void { 
        this.loadUsers();
    }

    loadUsers(): void {
        this.loading = true;
        this.userService.getList().subscribe({
            next: (res: any) => {
                this.collaborators = res.data || res;
                this.loading = false;
            },
            error: (err: any) => {
                console.error('Erreur de chargement des utilisateurs', err);
                this.loading = false;
                Swal.fire('Erreur', 'Impossible de charger les utilisateurs.', 'error');
            }
        });
    }

    navigateToAdd() {
        this.router.navigate(['/gbatcar/admin/users/add']);
    }

    navigateToDetails(user: any) {
        this.router.navigate(['/gbatcar/admin/users/details', user.uuid]);
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
}

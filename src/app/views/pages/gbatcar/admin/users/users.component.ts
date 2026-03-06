import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MOCK_COLLABORATORS } from '../../../../../core/mock/gbatcar-admin.mock';
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

    collaborators = [...MOCK_COLLABORATORS];

    constructor(private router: Router) { }

    formatPermissions(permissions: string[] | undefined): string {
        if (!permissions || permissions.length === 0) return 'Aucune permission';
        return permissions.length + ' permission' + (permissions.length > 1 ? 's' : '');
    }

    ngOnInit(): void { }

    navigateToAdd() {
        this.router.navigate(['/gbatcar/admin/users/add']);
    }

    navigateToEdit(user: any) {
        this.router.navigate(['/gbatcar/admin/users/edit', user.id]);
    }

    toggleStatus(user: any) {
        user.status = user.status === 'Actif' ? 'Inactif' : 'Actif';
    }
}

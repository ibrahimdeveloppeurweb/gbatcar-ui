import { Path } from "./path.model";

export interface Permission {
    uuid?: string;
    id?: string;
    nom?: string;
    paths?: Path[];
    description?: string;
    createdAt?: string;
    updatedAt?: string;
    create?: string;
    update?: string;
}

export interface Role {
    uuid?: string;
    id?: string;
    name?: string; // e.g., 'Super-Admin', 'Gérant'
    description?: string;

    // UI Metadata
    usersCount?: number;
    permissionsCount?: string; // e.g., 'Toutes les permissions', '12 permissions'
    badgeClass?: string;

    permissions?: Permission[];

    createdAt?: string;
    updatedAt?: string;
}

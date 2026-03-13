import { Permission, Role } from "./permission.model";

export interface User {
    uuid?: string;
    id?: string;

    civilite?: string;
    sexe?: string;
    libelle?: string;

    username?: string;
    nom?: string;
    prenom?: string;
    telephone?: string;
    email?: string;
    password?: string;

    // Job & Access
    fonction?: string;
    role?: Role[] | any[]; // Array of roles
    droits?: Permission[];

    // Presentation
    photo?: string;
    photoSrc?: string;
    avatar?: string;
    status?: string; // 'Actif', 'Inactif'

    // Session
    isFirstUser?: boolean;
    lastLogin?: string | null;
    token?: string;
    refreshToken?: string;

    // Timestamps
    createdAt?: string;
    updatedAt?: string;
    create?: string;
    update?: string;
}

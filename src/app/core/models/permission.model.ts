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
    id?: number;
    uuid?: string;

    nom?: string;
    description?: string;
    isAdmin?: boolean;

    paths?: Path[];
    users?: any[]; // We can keep any[] here to avoid circular dependency with user.model.ts
    usersCount?: number;

    createdAt?: string;
    updatedAt?: string;
    create?: string;
    update?: string;
}

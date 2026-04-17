export interface AuditLog {
    id: number;
    userFullName: string;
    userInitials: string;
    module: string;
    action: string;
    details: string;
    createdAt: string;
}

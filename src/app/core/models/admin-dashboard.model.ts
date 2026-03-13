// ====================== TABLEAU DE BORD : ADMINISTRATION ======================
// KPIs de suivi d'audit, de traçabilité et de gouvernance interne
// Distinct du tableau de bord principal (GbatcarDashboardData)

export interface AdminDashboardStats {
    totalAuditActions: number;   // Total d'actions tracées
    pendingApprovals: number;    // Validations requises en attente
    criticalAnomalies: number;   // Ex: suppressions suspectes, annulations
    activeCollaborators: number; // Utilisateurs ayant effectué une action aujourd'hui
}

export interface AdminPendingTask {
    id: string;
    type: string;          // Ex: 'Validation Contrat', 'Annulation Paiement'
    description: string;
    requester: string;
    date: string;
    priority: 'high' | 'critical' | 'medium' | 'low' | string;
}

export interface AuditLogEntry {
    user: string;
    avatar: string;        // Initiales ou URL avatar
    module: string;        // Ex: 'Contrat', 'Paiement', 'Véhicule'
    action: string;        // Ex: 'Création', 'Modification', 'Suppression'
    details: string;
    time: string;
    status: 'Succès' | 'Alerte' | string;
}

export interface AuditActionChartData {
    series: number[];
    labels: string[];      // ['Création', 'Encaissement', 'Modification', ...]
    colors: string[];
}

export interface ApprovalTrendChartData {
    requested: number[];
    processed: number[];
    totalActions: number[];
    months: string[];      // ['Oct', 'Nov', 'Déc', ...]
}

export interface AdminDashboardData {
    stats: AdminDashboardStats;
    pendingTasks: AdminPendingTask[];
    auditLogs: AuditLogEntry[];
    auditActionChart: AuditActionChartData;
    approvalTrendChart: ApprovalTrendChartData;
}

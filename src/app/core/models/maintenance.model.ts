import { Vehicle } from './vehicle.model';
import { Client } from './client.model';
import { Contract } from './contract.model';

export interface Maintenance {
    uuid?: string;
    id?: string;              // e.g., 'MNT-2024-001'
    reference?: string;

    // ===================== RELATIONS =====================
    // Une Intervention concerne UN Véhicule
    vehicle?: Vehicle;
    vehicleId?: string;
    vehicleName?: string;     // e.g., 'Toyota Yaris (1234 AB 01)'

    // Une Intervention est facturée sur UN Contrat
    contract?: Contract;
    contractId?: string;

    // Le Client concerné
    client?: Client;
    clientId?: string;
    clientName?: string;

    // ===================== DÉTAILS INTERVENTION =====================
    type?: string;            // 'Vidange & Filtres', 'Plaquettes de frein', 'Révision Générale'
    description?: string;
    date?: string;            // alias dateIntervention
    dateIntervention?: string;
    dateRetour?: string;

    // ===================== PRESTATAIRE & COÛT =====================
    provider?: string;        // Garage / Prestataire
    prestataire?: string;     // alias
    technician?: string;      // Technicien responsable
    cost?: number;            // Coût Total (FCFA)
    cout?: number;            // alias

    // ===================== STATUT & PLANNING =====================
    status?: string;          // 'Terminé', 'En cours', 'Planifié', 'En attente'
    statut?: string;          // alias
    kilometrage?: number;     // Kilométrage lors de l'intervention
    daysInShop?: number;
    nextMaintenanceDate?: string;
    nextMaintenanceMileage?: number;

    observation?: string;

    // Timestamps
    createdAt?: string;
    updatedAt?: string;
    create?: string;
    update?: string;
}

// ====================== DASHBOARD & AGGREGATES ======================

export interface MaintenanceDashboardStats {
    totalInterventions: number;
    interventionsThisMonth: number;
    pendingInterventions: number;
    completedInterventions: number;
    avgRepairDays: number;
    totalCostYTD: number;
    monthlyCost: number;
    budgetMonthly: number;
    activeAlerts: number;
    criticalAlerts: number;
    avgCostPerIntervention: number;
    vehiclesInShop: number;
}

export interface RecentIntervention {
    id: string;
    vehicle: string;
    client: string;
    type: string;
    technician: string;
    cost: number;
    status: string;
    days: number;
}

export interface RecentAlert {
    id: string;
    vehicle: string;
    date: string;
    type: string;
    severity: string;
    status: string;
    repairCost: number;
}

export interface InterventionTypeChartData {
    labels: string[];
    series: number[];
}

export interface CostTrendChartData {
    months: string[];
    realCost: number[];
    budget: number[];
}

export interface MaintenanceDashboardData {
    stats: MaintenanceDashboardStats;
    recentInterventions: RecentIntervention[];
    recentAlerts: RecentAlert[];
    interventionTypesChart: InterventionTypeChartData;
    costTrendChart: CostTrendChartData;
}

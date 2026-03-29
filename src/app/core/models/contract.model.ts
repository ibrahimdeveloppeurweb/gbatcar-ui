import { Client } from './client.model';
import { Vehicle } from './vehicle.model';
import { Payment } from './payment.model';
import { Penalty } from './penalty.model';

export interface ContractPunctualityItem {
    month: string;
    status: string; // 'À jour', 'En retard', etc.
}

export interface ContractVehicleDemand {
    id?: number;
    brand?: any;
    vehicleModel?: any;
    quantity?: number;
    assignedVehicles?: Vehicle[];
}

export interface RiskAnalysis {
    level: string;
    code: string;
    reason: string;
    dpd: number;
    class: string;
}

export interface Contract {
    uuid?: string;
    id?: string;
    reference?: string;
    vehicleSummary?: string; // Summary of all assigned vehicles

    // ===================== RELATIONS =====================
    // Un Contrat appartient à UN Client
    client?: Client;
    clientId?: string;
    clientName?: string;     // Dénomination affichage rapide

    // Un Contrat porte sur UN Véhicule (historique)
    vehicle?: Vehicle;
    vehicleId?: string;
    vehicleName?: string;    // e.g. "Toyota Yaris (1234 AB 01)"

    // Un Contrat "Flotte" peut porter sur plusieurs demandes de modèles
    vehicleDemands?: ContractVehicleDemand[];

    // Un Contrat a plusieurs Paiements
    payments?: Payment[];

    // Un Contrat a plusieurs Pénalités (amendes)
    penalties?: Penalty[];

    // Un Contrat a plusieurs Documents (avenants, reçus de signature, etc.)
    documents?: any[];

    // Historique de ponctualité
    punctualityHistory?: ContractPunctualityItem[];

    // Promesses de paiement
    promises?: any[];

    // ===================== FINANCIER =====================
    totalAmount?: number;
    paidAmount?: number;
    caution?: number;             // Dépôt de garantie
    fraisDossier?: number;        // Frais de dossier
    nextPaymentAmount?: number;
    unpaidAmount?: number;
    projectedMargin?: number;     // Simulation financière / Marge brute projetée

    // ===================== DATES =====================
    startDate?: string;
    endDate?: string;

    // ===================== STATUTS & RISQUES =====================
    status?: string;              // 'En cours', 'Soldé', 'Résilié', 'En Attente'
    paymentStatus?: string;       // 'À jour', 'En retard', 'Impayé définitif', 'En attente'
    riskLevel?: 'Bas' | 'Moyen' | 'Élevé' | 'Critique';
    hasSchedules?: boolean;
    riskAnalysis?: RiskAnalysis;

    // ===================== PROGRESSION =====================
    progressPercentage?: number;
    daysLate?: number;

    // ===================== PARAMÈTRES DU CONTRAT =====================
    usageType?: string;           // 'VTC (Yango/Heetch)', 'Taxi Compteur', 'Personnel / Privé'
    paymentFrequency?: string;    // 'Hebdomadaire', 'Mensuelle'
    dailyRate?: number;           // Redevance journalière
    durationInMonths?: number;
    initialDeposit?: number;      // Apport initial / Garantie
    prixDeVente?: number;         // Prix de vente du véhicule au moment du contrat
    maintenanceAndInsurance?: string;

    // ===================== GESTION DES RISQUES =====================
    gracePeriodDays?: number;
    penaltyRate?: number;         // % par jour de retard

    // ===================== CHECKLIST DOSSIER =====================
    hasValidID?: boolean;
    hasDriverLicense?: boolean;
    hasProofOfAddress?: boolean;
    hasCriminalRecord?: boolean;

    lieu?: string;
    observation?: string;

    // Timestamps
    createdAt?: string;
    updatedAt?: string;
    create?: string;
    update?: string;
}

// ====================== DASHBOARD & AGGREGATES ======================

export interface ContractDashboardStats {
    totalContracts: number;
    totalContractsGrowth?: number;
    activeContracts: number;
    defectRate: number;
    defectRateTrend?: 'up' | 'down' | 'stable';
    mrr: number;
    mrrGrowth?: number;
    lateContractsCount?: number;
    closedContractsCount?: number;
    maturingSoonCount?: number;
    incompleteDossiersCount?: number;
}

export interface ContractImminentRisk {
    id: string;
    client: string;
    issue: string;
    severity: 'danger' | 'warning' | 'info';
    value?: number;
}

export interface CashflowChartData {
    months: string[];
    expectedCashflow: number[];
    actualCashflow: number[];
}

export interface RecoveryStats {
    totalArrears: number;
    criticalCasesCount: number;
    promiseToPayCount: number;
}

export interface ContractDashboardData {
    stats: ContractDashboardStats;
    imminentRisks: ContractImminentRisk[];
    cashflowData: CashflowChartData;
    recoveryStats?: RecoveryStats;
}

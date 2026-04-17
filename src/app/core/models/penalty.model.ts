import { Contract } from './contract.model';
import { Client } from './client.model';
import { Vehicle } from './vehicle.model';

export interface Penalty {
    uuid?: string;
    id?: string;
    reference?: string;

    // ===================== RELATIONS =====================
    // Une Pénalité appartient à UN Contrat
    contract?: Contract;
    contractId?: string;

    // Une Pénalité est liée à UN Client (le contrevenant)
    client?: Client;
    clientId?: string;
    clientName?: string;          // Chauffeur / Locataire fautif
    driverName?: string;          // alias

    // Une Pénalité concerne UN Véhicule
    vehicle?: Vehicle;
    vehicleId?: string;
    vehicleName?: string;         // e.g. "Toyota Yaris (1234 AB 01)"

    // ===================== DÉTAILS PÉNALITÉ =====================
    reason?: string;              // Motif de la pénalité
    amount?: number;              // Montant (FCFA)
    date?: string;                // Date d'émission / constat
    dueDate?: string;             // Échéance de régularisation
    status?: string;              // 'Payé', 'Non payé', 'En attente', 'Impayé'
    severity?: string;
    observation?: string;
    paidAt?: string;
    proofUrl?: string;
    paidAmount?: number;

    createdAt?: string;
    updatedAt?: string;
    create?: string;
    update?: string;
}

// ====================== DASHBOARD & AGGREGATES ======================

export interface PenaltyDashboardStats {
    totalPenaltiesCount: number;
    unrecoveredAmount: number;
    criticalUnpaidCount: number;
    recoveredCount: number;
}

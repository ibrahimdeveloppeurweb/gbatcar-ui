import { Contract } from './contract.model';
import { Client } from './client.model';
import { Vehicle } from './vehicle.model';

export interface Payment {
    uuid?: string;
    id?: string;
    reference?: string;

    // ===================== RELATIONS =====================
    // Un Paiement appartient à UN Contrat
    contract?: Contract;
    contractId?: string;         // e.g. "CTR-2024-001"

    // Accès rapide aux entités liées (via le contrat)
    client?: Client;
    clientId?: string;
    clientName?: string;

    vehicle?: Vehicle;
    vehicleId?: string;
    vehicleName?: string;        // e.g. "Toyota Yaris (1234 AB 01)"

    // ===================== DÉTAILS PAIEMENT =====================
    amount?: number;
    date?: string;
    period?: string;             // Période concernée (Traite)
    method?: string;             // 'Mobile Money', 'Espèces', 'Virement bancaire', 'Chèque'
    status?: string;             // 'Validé', 'En attente', 'Rejeté', 'Annulé'
    type?: string;               // 'Mensualité', 'Pénalité', 'Caution', 'Acompte'

    recordedBy?: string;         // Nom de l'opérateur
    observation?: string;
    receiptUrl?: string;         // URL du reçu PDF généré

    createdAt?: string;
    updatedAt?: string;
    create?: string;
    update?: string;
}

// ====================== DASHBOARD & AGGREGATES ======================

export interface PaymentDashboardStats {
    mrr: number;
    mrrCollected: number;
    collectionRate: number;
    totalOverdue: number;
    overdueCount: number;
    avgPaymentDelay: number;
    activePenalties: number;
    penaltiesAmount: number;
    cashBalance: number;
    nextMonthForecast: number;
    totalValidated?: number;
    pendingPaymentsTotal?: number;
    pendingPaymentsCount?: number;
    dominantMethod?: string;
    dominantMethodPercent?: number;
}

export interface PaymentMethodChartData {
    labels: string[];
    series: number[];
}

export interface PaymentCashflowChartData {
    months: string[];
    realizedCashflow: number[];
    forecastCashflow: number[];
}

export interface RecentPayment {
    id: string;
    client: string;
    contractId: string;
    amount: number;
    date: string;
    method: string;
    status: string;
}

export interface PaymentDashboardData {
    stats: PaymentDashboardStats;
    cashflowData: PaymentCashflowChartData;
    paymentMethodsData: PaymentMethodChartData;
    recentPayments: RecentPayment[];
}

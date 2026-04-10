import { Contract } from './contract.model';
import { Vehicle } from './vehicle.model';

export interface FineItem {
    date: string;
    reason: string;
    amount: number;
    status: string;
}

export interface PaymentScheduleItem {
    date: string;
    amount: number;
    type: string;
    status: string;
}

export interface Client {
    uuid?: string;
    id?: string;

    // Identification
    nom?: string;               // alias for lastName
    prenom?: string;            // alias for firstName
    name?: string;
    firstName?: string;
    lastName?: string;
    libelle?: string;
    civilite?: string;
    gender?: string;
    birthDate?: string;
    birthPlace?: string;
    nationality?: string;
    maritalStatus?: string;
    childrenCount?: number;

    // Contact
    phone?: string;
    email?: string;
    city?: string;
    pays?: string;
    neighborhood?: string;
    address?: string;

    // Documents Identité
    idNumber?: string;          // Numéro CNI
    idIssueDate?: string;       // Date d'émission CNI
    licenseNumber?: string;     // Numéro Permis de conduire
    hasValidID?: boolean;       // CNI Validée
    hasDriverLicense?: boolean; // Permis Validé

    // Profil socio-économique
    educationLevel?: string;
    profession?: string;
    incomeBracket?: string;
    housingStatus?: string;
    primaryBankAccount?: string;
    discoveryChannel?: string;
    drivingExperienceYears?: number;
    previousCreditExperience?: string | boolean;
    repaymentSource?: string;

    // Media & Documents Numériques
    photo?: string;
    photoSrc?: string;
    idScanUrl?: string;         // Scan de la CNI / Passeport
    licenseScanUrl?: string;    // Scan du Permis de Conduire
    type?: string;              // 'Particulier', 'Professionnel'

    // ===================== RELATIONS =====================
    // Un Client peut avoir un Véhicule assigné (via le contrat actif)
    vehicle?: Vehicle;          // Objet Vehicle complet (pour affichage)
    vehicleId?: string;         // Clé étrangère courante
    vehicleName?: string;       // e.g. "Toyota Yaris (1234 AB 01)"

    // Un Client a plusieurs Contrats
    contracts?: Contract[];     // Liste des contrats du client
    activeContractId?: string;  // Clé du contrat actif

    // Un Client a des pénalités et un historique de paiements
    finesList?: FineItem[];
    paymentSchedule?: PaymentScheduleItem[];

    // ===================== AGRÉGATS FINANCIERS =====================
    status?: string;            // 'Actif', 'Inactif', 'En attente'
    paymentStatus?: string;     // 'À jour', 'En retard', 'Critique'
    amountPaid?: number;
    totalAmount?: number;
    cautionAmount?: number;
    nextPaymentAmount?: number;
    unpaidAmount?: number;
    walletBalance?: number;
    fines?: number;             // Total amendes (FCFA)

    // Timestamps
    createdAt?: string;
    updatedAt?: string;
    create?: string;
    update?: string;
}

// ====================== DASHBOARD & AGGREGATES ======================

export interface ClientDashboardStats {
    totalClients: number;
    activeClients: number;
    lateClients: number;
    pendingValidation: number;
    inactiveClients: number;
    newThisMonth: number;
    churnRate: number;
    avgContractDuration: number;
    totalPortfolioValue: number;
    avgClientValue: number;
}

export interface RiskClient {
    id: string;
    name: string;
    vehicle: string;
    contractId: string;
    delay: number;
    amount: number;
    risk: 'Modéré' | 'Élevé' | 'Critique' | string;
}

export interface RecentClient {
    id: string;
    name: string;
    phone: string;
    vehicle: string;
    status: string;
    paymentStatus: string;
    date: string;
}

export interface ClientGrowthData {
    months: string[];
    newClients: number[];
    lostClients: number[];
}

export interface ClientDashboardData {
    stats: ClientDashboardStats;
    riskClients: RiskClient[];
    recentClients: RecentClient[];
    growthData?: ClientGrowthData;
}

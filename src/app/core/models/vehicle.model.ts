import { Client } from './client.model';
import { Contract } from './contract.model';
import { VehicleCompliance } from './vehicle-compliance.model';
export interface VehicleDocumentStatus {
    status?: string;           // 'Valid', 'Expiring Soon', 'Expired'
    expiryDate?: string;
    daysRemaining?: number;
    dueMileage?: number;       // Spécifique à la maintenance préventive
    currentMileage?: number;
}

export interface Vehicle {
    uuid?: string;
    id?: string;
    reliabilityScore?: number;

    // ===================== IDENTIFICATION =====================
    immatriculation?: string;
    licensePlate?: string;     // alias
    marque?: string;
    brand?: string;            // alias
    modele?: string;
    model?: string;            // alias
    annee?: number;
    year?: number;             // alias
    couleur?: string;
    color?: string;            // alias
    couleur_vehicule?: string; // alias
    finition?: string;         // e.g., 'LE', 'GLS'
    trim?: string;             // alias for finition
    numeroChassis?: string;    // VIN
    numero_chassis?: string;   // alias
    vin?: string;              // alias
    annee_fabrication?: number; // alias
    nombrePlaces?: number;
    carburant?: string;
    transmission?: string;
    categorie?: string;

    // ===================== ÉTAT TECHNIQUE =====================
    kilometrage?: number;
    mileage?: number;          // alias
    prochainEntretien?: number; // Prochain entretien (km)
    dateDerniereMaintenance?: string;
    maintenanceAlert?: boolean;
    gpsStatus?: string;        // 'Connecté', 'Déconnecté', 'Non installé'
    notesInternes?: string;

    // ===================== RELATIONS =====================
    // Un Véhicule est assigné à UN Client (via le contrat actif)
    client?: Client;
    clientId?: string;
    assignedClient?: string;   // Nom affiché du client

    // Un Véhicule a UN Contrat actif
    contract?: Contract;
    activeContractId?: string;
    vehicleDemands?: any[];   // Fleet demands this vehicle is assigned to

    // ===================== STATUT & PAIEMENT =====================
    statut?: string;           // 'Disponible', 'Assigné', 'En Maintenance'
    status?: string;           // alias
    paymentStatus?: string;    // 'À jour', 'En retard', 'Critique'
    reimbursementProgress?: number; // % de remboursement
    daysLate?: number;
    totalContractAmount?: number;
    contractProgress?: number;
    paidAmount?: number;

    // ===================== CONFORMITÉ LÉGALE =====================
    insurance?: VehicleDocumentStatus;
    technicalInspection?: VehicleDocumentStatus;
    roadTax?: VehicleDocumentStatus;
    transportLicense?: VehicleDocumentStatus;
    fireExtinguisher?: VehicleDocumentStatus;
    preventiveMaintenance?: VehicleDocumentStatus;
    compliance?: VehicleCompliance;

    // ===================== COMMERCIAL (Catalogue & TCO) =====================
    commercialOffer?: {
        totalPrice: number;
        deposit?: number;
        monthlyPayment?: number;
    };
    tco?: {
        purchasePrice?: number;
        customs?: number;      // Frais de douane
        transport?: number;
        preparation?: number;
        gpsInstallation?: number;
    };
    pipelineStatus?: string;   // 'Prêt', 'En Préparation', 'En cours d'immatriculation'
    preReservedBy?: string;

    // Financial/Calculation props (Catalog)
    depositPercentage?: number;
    durationInMonths?: number;
    includingInsurance?: boolean;
    includingGPS?: boolean;

    // TCO direct access (sometimes used in templates)
    purchasePrice?: number;
    customsFees?: number;
    transitFees?: number;
    preparationCost?: number;
    gpsInstallationCost?: number;

    // ===================== RENTABILITÉ (Form UI) =====================
    prixDeVente?: number;
    tcoEstime?: number;
    margeBrutePrevisionnelle?: number;

    // ===================== DOCUMENTS NUMÉRIQUES =====================
    carteGriseUrl?: string;
    assuranceUrl?: string;
    visiteTechniqueUrl?: string;

    // ===================== PRÉSENTATION =====================
    photo?: string;
    photoSrc?: string;
    photos?: string[];
    _carouselIdx?: number;
    description?: string;
    prixParJour?: number;

    // Timestamps
    createdAt?: string;
    updatedAt?: string;
    create?: string;
    update?: string;
}

// ====================== DASHBOARDS & AGGREGATES ======================

export interface VehicleDashboardStats {
    totalVehicles: number;
    activeVehicles: number;
    availableVehicles: number;
    maintenanceVehicles: number;
    utilizationRate: number;
    avgAgeMonths: number;
    totalFleetValue: number;
    monthlyMaintenanceCost: number;
    costPerKm: number;
    maintenanceRateTarget: number;
    co2Compliance: number;
    insuranceCoverage: number;
}

export interface VehicleStatusBreakdown {
    label: string;
    count: number;
    color: string;
    icon: string;
}

export interface VehicleAlert {
    plate: string;
    model: string;
    client: string;
    issue: string;
    severity: 'danger' | 'warning' | 'info' | string;
    daysOverdue: number;
    cost: number;
}

export interface MaintenanceCostChartData {
    months: string[];
    maintenanceCost: number[];
    budgetAllocated: number[];
}

export interface VehicleDashboardData {
    stats: VehicleDashboardStats;
    statusBreakdown: VehicleStatusBreakdown[];
    criticalAlerts: VehicleAlert[];
    maintenanceCostChart: MaintenanceCostChartData;
}

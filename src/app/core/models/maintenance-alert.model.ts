import { Vehicle } from './vehicle.model';
import { Client } from './client.model';
import { Contract } from './contract.model';

export interface MaintenanceAlert {
    uuid?: string;
    id?: string;              // e.g., 'SIN-2024-005'

    // ===================== RELATIONS =====================
    // Un Sinistre concerne UN Véhicule
    vehicle?: Vehicle;
    vehicleId?: string;
    vehicleName?: string;     // e.g., 'Toyota Corolla (7890 IJ 01)'

    // Le Locataire au volant (Client)
    client?: Client;
    clientId?: string;
    clientName?: string;      // Locataire au volant

    // Le Contrat en cours lors de l'incident
    contract?: Contract;
    contractId?: string;

    // ===================== DÉTAILS INCIDENT =====================
    type?: string;            // 'Accident Matériel', 'Panne Moteur', 'Rayure Profonde'
    date?: string;            // Date & Heure de l'incident
    datePrevue?: string;      // alias
    description?: string;     // Circonstances détaillées de l'incident

    driverInfo?: string;      // Informations sur l'autre chauffeur / Tiers
    severity?: string;        // 'Faible', 'Moyenne', 'Critique' ou 'danger', 'warning'
    niveau?: string;          // alias

    status?: string;          // 'En traitement', 'Clôturé', 'Résolu', 'Immobilisé'
    statut?: string;          // alias

    repairCost?: number;      // Estimation coût réparation (FCFA)
    kilometragePrevue?: number;

    // ===================== DOCUMENTS =====================
    policeReportUrl?: string; // Constat de police / Rapport officiel (PDF)
    photosUrls?: string[];    // Photos du sinistre (max 5)

    observation?: string;

    // Timestamps
    createdAt?: string;
    updatedAt?: string;
    create?: string;
    update?: string;
}

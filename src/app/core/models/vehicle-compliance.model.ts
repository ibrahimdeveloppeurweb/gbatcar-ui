export interface VehicleStatus {
    label: string;
    class: string;
}

export interface VehicleComplianceDocument {
    id?: number;
    uuid?: string;
    type: string;
    deliveryDate?: string | Date;
    startDate?: string | Date;
    endDate?: string | Date;
    renewalCost?: number;
    affectation?: string;
    status: string;
    fileUrl?: string;
    observation?: string;
    createdAt?: string | Date;
}

export interface Penalty {
    id?: number;
    uuid?: string;
    reference?: string;
    reason?: string;
    amount?: number;
    date?: string | Date;
    dueDate?: string | Date;
    status?: string;
    severity?: string;
    observation?: string;
}

export interface VehicleCompliance {
    id?: number;
    uuid?: string;

    // Assurance
    assuranceProvider?: string;
    assurancePolicyNumber?: string;
    assuranceExpiryDate?: string | Date;
    assuranceDeliveryDate?: string | Date;
    assuranceUrl?: string;
    assuranceObservation?: string;

    // Visite Technique
    technicalInspectionCenter?: string;
    technicalInspectionExpiryDate?: string | Date;
    technicalInspectionDeliveryDate?: string | Date;
    technicalInspectionUrl?: string;
    technicalInspectionObservation?: string;

    // Vignette / Taxe
    roadTaxExpiryDate?: string | Date;
    roadTaxDeliveryDate?: string | Date;
    roadTaxUrl?: string;
    roadTaxObservation?: string;

    // Licence de transport
    transportLicenseType?: string;
    transportLicenseExpiryDate?: string | Date;
    transportLicenseDeliveryDate?: string | Date;
    transportLicenseUrl?: string;
    transportLicenseObservation?: string;

    // Extincteur
    fireExtinguisherExpiryDate?: string | Date;
    fireExtinguisherDeliveryDate?: string | Date;
    fireExtinguisherUrl?: string;
    fireExtinguisherObservation?: string;

    // Carte Grise
    carteGriseExpiryDate?: string | Date;
    carteGriseDeliveryDate?: string | Date;
    carteGriseUrl?: string;
    carteGriseObservation?: string;

    // Contrat Location-Vente
    leaseContractType?: string;
    leaseContractExpiryDate?: string | Date;
    leaseContractDeliveryDate?: string | Date;
    leaseContractUrl?: string;
    leaseContractObservation?: string;

    createdAt?: string | Date;
    updatedAt?: string | Date;
}

// Forced rebuild: 10:43
// ─── Documents ───────────────────────────────────────────────────────────────

export interface SubscriptionDocuments {
    // Particulier
    permis?: File | null;
    cni?: File | null;
    casier?: File | null;
    photos?: File[] | null;
    certif?: File | null;
    bulletin?: File | null;

    // Entreprise
    rc?: File | null;
    dfe?: File | null;
    cniGerant?: File | null;
    casierGerant?: File | null;
    statut?: File | null;
    releve?: File | null;
}

// ─── Subscription principale ─────────────────────────────────────────────────

export interface Subscription {
    uuid?: string;
    id?: number;

    // Identification du client
    clientType: 'Particulier' | 'Entreprise';

    // Champs Particulier
    fullName?: string;
    phoneParticulier?: string;
    emailParticulier?: string;
    locationParticulier?: string;
    profession?: string;
    monthlyIncome?: string;

    // Champs Entreprise
    companyName?: string;
    managerName?: string;
    phoneEntreprise?: string;
    emailEntreprise?: string;
    locationEntreprise?: string;
    taxAccountNb?: string;

    // Choix véhicule
    vehicleType?: string;
    vehicleCount?: number;

    // Conditions de leasing
    contractType?: string;
    paymentMethod?: string;

    // Backend merged fields
    email?: string;
    phone?: string;
    location?: string;

    // Documents (fichiers – sérialisés côté backend)
    documents?: SubscriptionDocuments;

    // Fichiers backend (noms de fichiers retournés par l'API)
    permis?: string | null;
    cni?: string | null;
    casier?: string | null;
    photos?: string | null;
    certif?: string | null;
    bulletin?: string | null;
    rc?: string | null;
    dfe?: string | null;
    cniGerant?: string | null;
    casierGerant?: string | null;
    statut?: string | null;
    releve?: string | null;

    // Statut back-office (typed as any to bypass compiler overlap errors)
    status?: any;
    statutBo?: any;
    rejectionReason?: string;

    // Timestamps
    createdAt?: string;
    updatedAt?: string;
}

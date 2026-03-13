export interface GlobalSetting {
    uuid?: string;
    id?: string;

    // Financial & Contract Default Parameters
    fraisDossier?: number;
    penaliteRetardJournaliere?: number; // %
    delaiGracePenalite?: number; // Jours
    dureeContratDefautMois?: number; // Mois
    apportInitialPourcentage?: number; // %

    // Core details (if generic key/value is used)
    cle?: string;
    valeur?: string;
    description?: string;
    type?: string;

    // Timestamps
    createdAt?: string;
    updatedAt?: string;
    create?: string;
    update?: string;
}

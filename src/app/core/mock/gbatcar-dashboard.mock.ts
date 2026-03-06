export const MOCK_DASHBOARD_STATS = {
    activeClients: 124,
    activeClientsGrowth: 5.2, // percentage
    totalVehicles: 150,
    availableVehicles: 26,
    monthlyRevenue: 15400000, // in FCFA
    monthlyRevenueGrowth: 12.5,
    pendingPaymentsCount: 8,
    pendingPaymentsAmount: 640000
};

export const MOCK_REVENUE_CHART_DATA = [
    { date: '2024-02-18', amount: 450000 },
    { date: '2024-02-19', amount: 520000 },
    { date: '2024-02-20', amount: 480000 },
    { date: '2024-02-21', amount: 610000 },
    { date: '2024-02-22', amount: 590000 },
    { date: '2024-02-23', amount: 680000 },
    { date: '2024-02-24', amount: 720000 },
];

export const MOCK_RECENT_ONBOARDING = [
    {
        id: 'D001',
        name: 'Kouassi Jean',
        phone: '+225 07 12 34 56 78',
        type: ' Particulier',
        date: '2024-02-24',
        status: 'pending' // pending, approved, rejected
    },
    {
        id: 'D002',
        name: 'Kone Amadou',
        phone: '+225 05 98 76 54 32',
        type: 'Chauffeur VTC',
        date: '2024-02-24',
        status: 'pending'
    },
    {
        id: 'D003',
        name: 'Logistics Pro SARL',
        phone: '+225 01 11 22 33 44',
        type: 'Entreprise',
        date: '2024-02-23',
        status: 'approved'
    },
    {
        id: 'D004',
        name: 'Touré Mariam',
        phone: '+225 07 55 44 33 22',
        type: 'Commerçante',
        date: '2024-02-22',
        status: 'rejected'
    },
    {
        id: 'D005',
        name: 'Bamba Souleymane',
        phone: '+225 05 66 77 88 99',
        type: 'Fonctionnaire',
        date: '2024-02-21',
        status: 'pending'
    }
];

export const MOCK_MONTHLY_SALES_DATA = [
    { month: '01/01/2024', sales: 152 },
    { month: '02/01/2024', sales: 109 },
    { month: '03/01/2024', sales: 93 },
    { month: '04/01/2024', sales: 113 },
    { month: '05/01/2024', sales: 126 },
    { month: '06/01/2024', sales: 161 },
    { month: '07/01/2024', sales: 188 },
    { month: '08/01/2024', sales: 143 },
    { month: '09/01/2024', sales: 102 },
    { month: '10/01/2024', sales: 113 },
    { month: '11/01/2024', sales: 116 },
    { month: '12/01/2024', sales: 124 }
];

export const MOCK_FLEET_STATUS = [
    { label: 'En Location', value: 105, color: '#D80010' }, // Primary
    { label: 'Au Parking (Dispo)', value: 26, color: '#05a34a' }, // Success
    { label: 'En Panne/Maintenance', value: 19, color: '#ff3366' }, // Danger
];

export const MOCK_MAINTENANCE_ALERTS = [
    { vehicle: 'Toyota Corolla - 1234 AB 01', type: 'Visite Technique', dueDate: 'Expire dans 2 jours', severity: 'danger' },
    { vehicle: 'Hyundai Elantra - 5678 CD 01', type: 'Assurance', dueDate: 'Expire demain', severity: 'danger' },
    { vehicle: 'Peugeot 308 - 9012 EF 01', type: 'Vidange', dueDate: 'Prévue la semaine pro.', severity: 'warning' },
];

export const MOCK_EXPIRING_CONTRACTS = [
    { client: 'Logistics Pro SARL', vehicle: 'Renault Kangoo', expiryDate: '28-02-2024', status: 'Imminent' },
    { client: 'Kone Amadou', vehicle: 'Toyota Yaris', expiryDate: '05-03-2024', status: 'Bientôt' },
    { client: 'Touré Mariam', vehicle: 'Hyunda Accent', expiryDate: '12-03-2024', status: 'Bientôt' },
];

export const MOCK_RECENT_ACTIVITY = [
    { time: '10:30', description: 'Contrat #102 signé par M. Yéo', user: 'Admin' },
    { time: '09:15', description: 'Paiement de 50 000 FCFA reçu', user: 'Système' },
    { time: 'Hier', description: 'Hyundai Elantra ajoutée au parc', user: 'Logistique' },
    { time: 'Hier', description: 'Relance SMS envoyée à 8 clients', user: 'Système' },
];

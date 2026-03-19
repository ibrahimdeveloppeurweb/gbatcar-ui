export const MOCK_COMPLIANCE = [
    {
        id: 1,
        uuid: 'COMP-1001',
        vehicle: 'Toyota Corolla 2021 (LE)',
        licensePlate: '1234 AB 01',
        assignedClient: 'Jean KOUASSI',
        insurance: { provider: 'NSIA', policyNumber: 'POL-100293', expiryDate: '2025-10-15', status: 'Valid', daysLeft: 145 },
        technicalInspection: { center: 'SITAB', expiryDate: '2024-05-10', status: 'Expired', daysLeft: -5 },
        roadTax: { expiryDate: '2025-03-31', status: 'Valid', daysLeft: 300 },
        transportLicense: { type: 'VTC', expiryDate: '2024-06-01', status: 'Expiring Soon', daysLeft: 16 },
        fireExtinguisher: { expiryDate: '2026-01-01', status: 'Valid', daysLeft: 400 },
        preventiveMaintenance: { nextKm: 50000, currentKm: 45000, status: 'Valid' }
    },
    {
        id: 2,
        uuid: 'COMP-1002',
        vehicle: 'Hyundai Elantra 2020 (GLS)',
        licensePlate: '5678 CD 01',
        assignedClient: 'Marie BAMBA',
        insurance: { provider: 'SUNU', policyNumber: 'SUN-98712', expiryDate: '2024-06-05', status: 'Expiring Soon', daysLeft: 18 },
        technicalInspection: { center: 'SITAB', expiryDate: '2024-12-20', status: 'Valid', daysLeft: 200 },
        roadTax: { expiryDate: '2024-03-31', status: 'Expired', daysLeft: -45 },
        transportLicense: { type: 'Location', expiryDate: '2025-01-01', status: 'Valid', daysLeft: 220 },
        fireExtinguisher: { expiryDate: '2024-05-30', status: 'Expiring Soon', daysLeft: 14 },
        preventiveMaintenance: { nextKm: 65000, currentKm: 62000, status: 'Valid' }
    },
    {
        id: 3,
        uuid: 'COMP-1003',
        vehicle: 'Kia Rio 2022 (EX)',
        licensePlate: 'En Attente',
        assignedClient: 'Stock GbatCar',
        insurance: { provider: 'N/A', policyNumber: 'N/A', expiryDate: '2025-01-01', status: 'Valid', daysLeft: 300 },
        technicalInspection: { center: 'N/A', expiryDate: '2025-01-01', status: 'Valid', daysLeft: 300 },
        roadTax: { expiryDate: '2025-03-31', status: 'Valid', daysLeft: 300 },
        transportLicense: { type: 'N/A', expiryDate: '2025-01-01', status: 'Valid', daysLeft: 300 },
        fireExtinguisher: { expiryDate: '2025-01-01', status: 'Valid', daysLeft: 300 },
        preventiveMaintenance: { nextKm: 35000, currentKm: 30000, status: 'Valid' }
    },
    {
        id: 4,
        uuid: 'COMP-1004',
        vehicle: 'Suzuki Vitara 2019 (GLX)',
        licensePlate: '9012 EF 01',
        assignedClient: 'Paul KONE',
        insurance: { provider: 'Allianz', policyNumber: 'ALZ-55443', expiryDate: '2024-05-20', status: 'Expiring Soon', daysLeft: 5 },
        technicalInspection: { center: 'SITAB', expiryDate: '2024-05-25', status: 'Expiring Soon', daysLeft: 10 },
        roadTax: { expiryDate: '2025-03-31', status: 'Valid', daysLeft: 300 },
        transportLicense: { type: 'VTC', expiryDate: '2024-05-18', status: 'Expired', daysLeft: -2 },
        fireExtinguisher: { expiryDate: '2024-05-15', status: 'Expired', daysLeft: -5 },
        preventiveMaintenance: { nextKm: 120000, currentKm: 119800, status: 'Expiring Soon' }
    }
];

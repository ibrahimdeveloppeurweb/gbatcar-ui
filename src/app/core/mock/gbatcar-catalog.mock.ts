export const MOCK_CATALOG = [
    {
        id: 'VHC-1005',
        brand: 'Toyota',
        model: 'Corolla',
        trim: 'LE',
        year: 2021,
        fuelType: 'Essence',
        transmission: 'Automatique',
        seats: 5,
        mileageAtPurchase: 45000,
        images: ['https://placehold.co/400x250/e0e0e0/636363?text=Toyota+Corolla'],
        status: 'Disponible',
        arrivalStatus: 'Prêt pour affectation', // pipeline step
        reservedBy: null,
        tco: {
            purchasePrice: 5500000,
            customsFees: 350000,
            transportFees: 150000,
            preparationCost: 120000,
            gpsInstallation: 80000,
            get total() { return this.purchasePrice + this.customsFees + this.transportFees + this.preparationCost + this.gpsInstallation; }
        },
        commercialOffer: {
            totalPrice: 6500000,
            depositPercentage: 25,
            durationInMonths: 24,
            includingInsurance: true,
            includingGPS: true
        }
    },
    {
        id: 'VHC-1002',
        brand: 'Hyundai',
        model: 'Elantra',
        trim: 'GLS',
        year: 2020,
        fuelType: 'Essence',
        transmission: 'Automatique',
        seats: 5,
        mileageAtPurchase: 62000,
        images: ['https://placehold.co/400x250/e0e0e0/636363?text=Hyundai+Elantra'],
        status: 'En Préparation',
        arrivalStatus: 'En atelier (préparation esthétique)',
        reservedBy: null,
        tco: {
            purchasePrice: 4800000,
            customsFees: 280000,
            transportFees: 120000,
            preparationCost: 200000,
            gpsInstallation: 80000,
            get total() { return this.purchasePrice + this.customsFees + this.transportFees + this.preparationCost + this.gpsInstallation; }
        },
        commercialOffer: {
            totalPrice: 5800000,
            depositPercentage: 20,
            durationInMonths: 24,
            includingInsurance: true,
            includingGPS: true
        }
    },
    {
        id: 'VHC-1004',
        brand: 'Kia',
        model: 'Rio',
        trim: 'EX',
        year: 2022,
        fuelType: 'Essence',
        transmission: 'Automatique',
        seats: 5,
        mileageAtPurchase: 30000,
        images: ['https://placehold.co/400x250/e0e0e0/636363?text=Kia+Rio'],
        status: 'En Attente Apport',
        arrivalStatus: 'En cours d\'immatriculation',
        reservedBy: 'Kouadio Serge (Pré-réservation)',
        tco: {
            purchasePrice: 4100000,
            customsFees: 310000,
            transportFees: 100000,
            preparationCost: 90000,
            gpsInstallation: 80000,
            get total() { return this.purchasePrice + this.customsFees + this.transportFees + this.preparationCost + this.gpsInstallation; }
        },
        commercialOffer: {
            totalPrice: 5000000,
            depositPercentage: 30,
            durationInMonths: 18,
            includingInsurance: false,
            includingGPS: true
        }
    },
    {
        id: 'VHC-1003',
        brand: 'Suzuki',
        model: 'Vitara',
        trim: 'GLX',
        year: 2019,
        fuelType: 'Essence',
        transmission: 'Automatique',
        seats: 5,
        mileageAtPurchase: 85000,
        images: ['https://placehold.co/400x250/e0e0e0/636363?text=Suzuki+Vitara'],
        status: 'Disponible',
        arrivalStatus: 'Tracker GPS à installer',
        reservedBy: null,
        tco: {
            purchasePrice: 6000000,
            customsFees: 420000,
            transportFees: 180000,
            preparationCost: 150000,
            gpsInstallation: 80000,
            get total() { return this.purchasePrice + this.customsFees + this.transportFees + this.preparationCost + this.gpsInstallation; }
        },
        commercialOffer: {
            totalPrice: 7200000,
            depositPercentage: 20,
            durationInMonths: 36,
            includingInsurance: true,
            includingGPS: true
        }
    }
];


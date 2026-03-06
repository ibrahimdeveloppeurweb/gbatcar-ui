export const MOCK_CATALOG = [
    {
        id: 'VHC-1005', // Mapped to Toyota Corolla in MOCK_VEHICLES
        brand: 'Toyota',
        model: 'Corolla',
        trim: 'LE',
        year: 2021,
        fuelType: 'Essence',
        transmission: 'Automatique',
        seats: 5,
        mileageAtPurchase: 45000,
        images: ['https://placehold.co/400x250/e0e0e0/636363?text=Toyota+Corolla'],
        commercialOffer: {
            totalPrice: 6500000,
            depositPercentage: 25,
            durationInMonths: 24,
            includingInsurance: true,
            includingGPS: true
        },
        status: 'Disponible'
    },
    {
        id: 'VHC-1002', // Mapped to Hyundai Accent/Elantra
        brand: 'Hyundai',
        model: 'Elantra',
        trim: 'GLS',
        year: 2020,
        fuelType: 'Essence',
        transmission: 'Automatique',
        seats: 5,
        mileageAtPurchase: 62000,
        images: ['https://placehold.co/400x250/e0e0e0/636363?text=Hyundai+Elantra'],
        commercialOffer: {
            totalPrice: 5800000,
            depositPercentage: 20,
            durationInMonths: 24,
            includingInsurance: true,
            includingGPS: true
        },
        status: 'En Préparation'
    },
    {
        id: 'VHC-1004', // Mapped to Kia Rio
        brand: 'Kia',
        model: 'Rio',
        trim: 'EX',
        year: 2022,
        fuelType: 'Essence',
        transmission: 'Automatique',
        seats: 5,
        mileageAtPurchase: 30000,
        images: ['https://placehold.co/400x250/e0e0e0/636363?text=Kia+Rio'],
        commercialOffer: {
            totalPrice: 5000000,
            depositPercentage: 30,
            durationInMonths: 18,
            includingInsurance: false,
            includingGPS: true
        },
        status: 'En Attente Apport'
    },
    {
        id: 'VHC-1003', // Mapped to Suzuki Dzire/Vitara
        brand: 'Suzuki',
        model: 'Vitara',
        trim: 'GLX',
        year: 2019,
        fuelType: 'Essence',
        transmission: 'Automatique',
        seats: 5,
        mileageAtPurchase: 85000,
        images: ['https://placehold.co/400x250/e0e0e0/636363?text=Suzuki+Vitara'],
        commercialOffer: {
            totalPrice: 7200000,
            depositPercentage: 20,
            durationInMonths: 36,
            includingInsurance: true,
            includingGPS: true
        },
        status: 'Disponible'
    }
];

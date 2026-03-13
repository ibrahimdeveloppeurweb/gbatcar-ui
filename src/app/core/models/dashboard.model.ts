export interface DashboardStats {
    activeClients: number;
    activeClientsGrowth: number;
    totalVehicles: number;
    availableVehicles: number;
    monthlyRevenue: number;
    monthlyRevenueGrowth: number;
    pendingPaymentsCount: number;
    pendingPaymentsAmount: number;
    portfolioValue: number;
    portfolioValueGrowth: number;
    collectionRate: number;
    collectionRateTarget: number;
    idleRate: number;
    idleRateTrend: 'up' | 'down';
}

export interface RevenueChartData {
    date: string;
    amount: number;
}

export interface RecentOnboarding {
    id: string;
    name: string;
    phone: string;
    type: string;
    date: string;
    status: 'pending' | 'approved' | 'rejected';
}

export interface MonthlySalesData {
    month: string;
    sales: number;
}

export interface RiskDistribution {
    label: string;
    value: number;
    color: string;
}

export interface UrgentAction {
    client: string;
    vehicle: string;
    delay: number;
    amount: number;
    action: string;
}

export interface DashboardMaintenanceAlert {
    vehicle: string;
    type: string;
    dueDate: string;
    severity: 'warning' | 'danger';
}

export interface ExpiringContract {
    client: string;
    vehicle: string;
    expiryDate: string;
    status: string;
}

export interface RecentActivity {
    time: string;
    description: string;
    user: string;
}

export interface GbatcarDashboardData {
    stats: DashboardStats;
    revenueChartData: RevenueChartData[];
    recentOnboardings: RecentOnboarding[];
    monthlySalesData: MonthlySalesData[];
    riskDistribution: RiskDistribution[];
    urgentActions: UrgentAction[];
    maintenanceAlerts: DashboardMaintenanceAlert[];
    expiringContracts: ExpiringContract[];
    recentActivity: RecentActivity[];
}


import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';
import { FeatherIconDirective } from '../../../../core/feather-icon/feather-icon.directive';
import { ThemeCssVariableService, ThemeCssVariablesType } from '../../../../core/services/theme-css-variable.service';
import { DashboardService } from '../../../../core/services';
import { ContractDurationService } from '../../../../core/services/contract/contract-duration.service';
import {
    DashboardStats, RecentOnboarding, DashboardMaintenanceAlert,
    ExpiringContract, RecentActivity, RiskDistribution,
    UrgentAction, MonthlySalesData, RevenueChartData
} from '../../../../core/models';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-gbatcar-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        NgApexchartsModule,
        FeatherIconDirective,
        NgbDropdownModule,
        NgSelectModule
    ],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss'
})
export class GbatcarDashboardComponent implements OnInit {

    private dashboardService = inject(DashboardService);
    private durationService = inject(ContractDurationService);

    stats: DashboardStats = {
        activeClients: 0, activeClientsGrowth: 0, totalVehicles: 0, availableVehicles: 0,
        monthlyRevenue: 0, monthlyRevenueGrowth: 0, pendingPaymentsCount: 0, pendingPaymentsAmount: 0,
        portfolioValue: 0, portfolioValueGrowth: 0, collectionRate: 0, collectionRateTarget: 0,
        idleRate: 0, idleRateTrend: 'up'
    };
    recentOnboardings: RecentOnboarding[] = [];
    maintenanceAlerts: DashboardMaintenanceAlert[] = [];
    expiringContracts: ExpiringContract[] = [];
    recentActivity: RecentActivity[] = [];
    riskDistribution: RiskDistribution[] = [];
    urgentActions: UrgentAction[] = [];
    monthlySalesData: MonthlySalesData[] = [];
    revenueChartData: RevenueChartData[] = [];
    fleetTotal: number = 0;

    // Month selector
    monthsList: any[] = [];
    selectedMonth: any = null;
    loadingDurations = false;

    addDurationTag = (name: string) => {
        return new Promise((resolve) => {
            const formattedName = name.toLowerCase().includes('mois') ? name : `${name} mois`;
            this.loadingDurations = true;
            this.durationService.create(formattedName).subscribe({
                next: (res: any) => {
                    const newDuration = res?.data || res;
                    this.monthsList = [...this.monthsList, newDuration];
                    this.loadingDurations = false;
                    resolve(newDuration);
                },
                error: () => {
                    this.loadingDurations = false;
                    resolve(null);
                }
            });
        });
    };

    onMonthChange(item: any) {
        if (item && item.monthsCount) {
            this.selectedMonth = item;
        }
        this.fetchDashboardData();
    }

    // Advanced Filters
    showAdvancedFilters: boolean = false;

    advPeriod: string = 'Ce Mois';
    advDateMin: string = '';
    advDateMax: string = '';
    advVehicleCategory: string = '';
    advContractType: string = '';
    advClientStatus: string = '';

    toggleAdvancedFilters() {
        this.showAdvancedFilters = !this.showAdvancedFilters;
    }

    applyAdvancedFilters() {
        this.fetchDashboardData();
        Swal.fire({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            icon: 'info',
            title: 'Actualisation des données...'
        });
    }

    resetFilters() {
        this.advPeriod = 'Ce Mois';
        this.advDateMin = '';
        this.advDateMax = '';
        this.advVehicleCategory = '';
        this.advContractType = '';
        this.advClientStatus = '';

        this.applyAdvancedFilters();
    }

    public clientsChartOptions: ApexOptions | any;
    public vehiclesChartOptions: ApexOptions | any;
    public revenueMiniChartOptions: ApexOptions | any;
    public revenueChartOptions: ApexOptions | any;
    public vehicleSalesChartOptions: ApexOptions | any;
    public fleetStatusChartOptions: ApexOptions | any;

    themeCssVariables = inject(ThemeCssVariableService).getThemeCssVariables();

    constructor() { }

    ngOnInit(): void {
        this.updateCharts();
        this.loadDurations();
    }

    loadDurations() {
        this.durationService.getAll().subscribe({
            next: (data: any) => {
                this.monthsList = data;
                if (data && data.length > 0) {
                    this.selectedMonth = data.find((d: any) => d.monthsCount === 6) || data[0];
                }
                this.fetchDashboardData();
            },
            error: () => {
                this.fetchDashboardData();
            }
        });
    }

    fetchDashboardData() {
        const monthFilter = this.selectedMonth ? this.selectedMonth.monthsCount : 6;
        const filters = {
            month: monthFilter
        };

        this.dashboardService.getDashboardData(filters).subscribe({
            next: (res) => {
                if (res) {
                    this.stats = res.stats || this.stats;
                    this.recentOnboardings = res.recentOnboardings || [];
                    this.maintenanceAlerts = res.maintenanceAlerts || [];
                    this.expiringContracts = res.expiringContracts || [];
                    this.recentActivity = res.recentActivity || [];
                    this.riskDistribution = res.riskDistribution || [];
                    this.urgentActions = res.urgentActions || [];
                    this.monthlySalesData = res.monthlySalesData || [];
                    this.revenueChartData = res.revenueChartData || [];
                    this.fleetTotal = (res as any).totalVehiclesFleet || this.stats.totalVehicles || 0;

                    this.updateCharts();
                }
            },
            error: (err) => {
                console.error('Erreur chargement dashboard', err);
            }
        });
    }

    updateCharts() {
        this.clientsChartOptions = this.getClientsChartOptions(this.themeCssVariables);
        this.vehiclesChartOptions = this.getVehiclesChartOptions(this.themeCssVariables);
        this.revenueMiniChartOptions = this.getRevenueMiniChartOptions(this.themeCssVariables);
        this.revenueChartOptions = this.getRevenueChartOptions(this.themeCssVariables);
        this.vehicleSalesChartOptions = this.getVehicleSalesChartOptions(this.themeCssVariables);
        this.fleetStatusChartOptions = this.getRiskDistributionChartOptions(this.themeCssVariables);
    }

    exportData() {
        Swal.fire({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            icon: 'success',
            title: 'Exportation en cours...'
        });
    }

    updatePeriod(period: string) {
        Swal.fire({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            icon: 'info',
            title: `Période mise à jour : ${period}`
        });
    }

    getClientsChartOptions(themeVariables: ThemeCssVariablesType) {
        return {
            series: [{ name: '', data: [110, 115, 112, 118, 120, 122, 124] }],
            chart: { type: "line", height: 60, sparkline: { enabled: !0 } },
            colors: [themeVariables.primary],
            stroke: { width: 2, curve: "smooth" },
            markers: { size: 0 },
        };
    }

    getVehiclesChartOptions(themeVariables: ThemeCssVariablesType) {
        return {
            series: [{ name: '', data: [140, 142, 145, 148, 149, 150, 150] }],
            chart: { type: "bar", height: 60, sparkline: { enabled: !0 } },
            colors: [themeVariables.primary],
            plotOptions: { bar: { borderRadius: 2, columnWidth: "60%" } }
        };
    }

    getRevenueMiniChartOptions(themeVariables: ThemeCssVariablesType) {
        return {
            series: [{ name: '', data: [12, 14, 13, 15, 14, 15, 15.4] }],
            chart: { type: "line", height: 60, sparkline: { enabled: !0 } },
            colors: [themeVariables.primary],
            stroke: { width: 2, curve: "smooth" },
            markers: { size: 0 },
        };
    }

    getRevenueChartOptions(themeVariables: ThemeCssVariablesType) {
        const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
        const months = this.selectedMonth?.monthsCount ?? 6;
        const groupByYear = months > 36;

        const categories: string[] = [];
        const paidData: number[] = [];

        if (groupByYear) {
            // Regroupement annuel
            const startYear = new Date().getFullYear() - Math.ceil(months / 12) + 1;
            const endYear = new Date().getFullYear();
            for (let year = startYear; year <= endYear; year++) {
                categories.push(year.toString());
                const key = year.toString();
                const item = this.revenueChartData.find(x => x.month === key);
                paidData.push(item ? parseFloat(item.paid as any) : 0);
            }
        } else {
            // Regroupement mensuel
            for (let i = months - 1; i >= 0; i--) {
                const d = new Date();
                d.setDate(1);
                d.setMonth(d.getMonth() - i);
                let label = monthNames[d.getMonth()];
                if (months > 12) label += ' ' + d.getFullYear().toString().substring(2);
                categories.push(label);

                const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
                const item = this.revenueChartData.find(x => x.month === key);
                paidData.push(item ? parseFloat(item.paid as any) : 0);
            }
        }

        return {
            series: [{ name: 'Encaissements', data: paidData }],
            chart: {
                type: 'line',
                height: 350,
                parentHeightOffset: 0,
                foreColor: themeVariables.secondary,
                toolbar: { show: false },
                zoom: { enabled: false }
            },
            colors: ['#e74c3c'],
            stroke: { width: 2, curve: 'straight' },
            grid: {
                padding: { bottom: -4 },
                borderColor: themeVariables.gridBorder,
                xaxis: { lines: { show: false } }
            },
            xaxis: {
                type: 'category',
                categories: categories,
                axisBorder: { color: themeVariables.gridBorder },
                axisTicks: { color: themeVariables.gridBorder },
                crosshairs: { stroke: { color: '#e74c3c' } },
            },
            yaxis: {
                title: {
                    text: 'Montant (FCFA)',
                    style: { fontSize: '10px', color: themeVariables.secondary }
                },
                labels: {
                    formatter: (val: number) => {
                        if (val >= 1_000_000) return (val / 1_000_000).toFixed(1) + 'M';
                        if (val >= 1_000) return (val / 1_000).toFixed(0) + 'K';
                        return new Intl.NumberFormat('fr-FR').format(val);
                    }
                },
                crosshairs: { stroke: { color: themeVariables.secondary } }
            },
            dataLabels: { enabled: false },
            markers: { size: 0 },
            legend: { show: false },
            tooltip: {
                y: {
                    formatter: (val: number) =>
                        new Intl.NumberFormat('fr-FR').format(val) + ' FCFA'
                }
            }
        };
    }

    formatCurrency(amount: number): string {
        return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
    }

    getVehicleSalesChartOptions(themeVariables: ThemeCssVariablesType) {
        const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
        const months = this.selectedMonth?.monthsCount ?? 6;
        const groupByYear = months > 36;

        const categories: string[] = [];
        const data: number[] = [];

        if (groupByYear) {
            const startYear = new Date().getFullYear() - Math.ceil(months / 12) + 1;
            const endYear = new Date().getFullYear();
            for (let year = startYear; year <= endYear; year++) {
                categories.push(year.toString());
                const key = year.toString();
                const item = this.monthlySalesData.find(x => x.month === key);
                data.push(item ? item.sales : 0);
            }
        } else {
            for (let i = months - 1; i >= 0; i--) {
                const d = new Date();
                d.setDate(1);
                d.setMonth(d.getMonth() - i);
                let label = monthNames[d.getMonth()];
                if (months > 12) label += " '" + d.getFullYear().toString().substring(2);
                categories.push(label);

                const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
                const item = this.monthlySalesData.find(x => x.month === key);
                data.push(item ? item.sales : 0);
            }
        }

        return {
            series: [{ name: 'Véhicules', data: data }],
            chart: {
                type: 'bar', height: 330, parentHeightOffset: 0,
                foreColor: themeVariables.secondary,
                toolbar: { show: false }, zoom: { enabled: false }
            },
            colors: ['#e74c3c'],
            fill: { opacity: 1 },
            grid: {
                borderColor: themeVariables.gridBorder,
                xaxis: { lines: { show: false } }
            },
            xaxis: {
                type: 'category',
                categories: categories,
                axisBorder: { color: themeVariables.gridBorder },
                axisTicks: { color: themeVariables.gridBorder },
            },
            yaxis: {
                title: { text: 'Nombre de Ventes', style: { color: themeVariables.secondary } },
                labels: { offsetX: 0 },
            },
            legend: { show: false },
            stroke: { width: 0 },
            dataLabels: {
                enabled: true,
                style: { fontSize: '10px', colors: ['#fff'], fontWeight: 'bold' },
                offsetY: 5
            },
            plotOptions: {
                bar: {
                    columnWidth: '55%', borderRadius: 4,
                    dataLabels: { position: 'center' }
                }
            },
            tooltip: {
                y: { formatter: (val: number) => val + ' véhicule(s)' }
            }
        };
    }

    statusBreakdown: any[] = [];

    getRiskDistributionChartOptions(themeVariables: ThemeCssVariablesType) {
        const enLocation = this.riskDistribution.find(s => s.label === 'En Location')?.value || 0;
        const dispo = this.riskDistribution.find(s => s.label === 'Au Parking (Dispo)')?.value || 0;
        const maint = this.riskDistribution.find(s => s.label === 'En Panne/Maintenance')?.value || 0;
        const sold = this.riskDistribution.find(s => s.label === 'Vendu')?.value || 0;

        this.statusBreakdown = [
            { label: 'En Location-Vente', count: enLocation, color: '#2ecc71', icon: 'truck' },
            { label: 'Disponible', count: dispo, color: '#3498db', icon: 'check-circle' },
            { label: 'En Maintenance', count: maint, color: '#f39c12', icon: 'tool' },
            { label: 'Vendu', count: sold, color: '#9b59b6', icon: 'shopping-cart' },
        ];

        return {
            series: this.statusBreakdown.map(s => s.count),
            chart: { height: 280, type: 'donut' },
            labels: this.statusBreakdown.map(s => s.label),
            colors: this.statusBreakdown.map(s => s.color),
            stroke: { colors: ['#fff'] },
            legend: {
                show: true, position: 'bottom',
                fontFamily: themeVariables.fontFamily,
                labels: { colors: themeVariables.secondary }
            },
            dataLabels: { enabled: false },
            plotOptions: {
                pie: {
                    donut: {
                        size: '70%',
                        labels: {
                            show: true,
                            total: {
                                show: true, showAlways: true,
                                label: 'Véhicules',
                                color: themeVariables.secondary,
                                fontSize: '13px',
                                formatter: (w: any) => this.fleetTotal
                            }
                        }
                    }
                }
            }
        };
    }
}


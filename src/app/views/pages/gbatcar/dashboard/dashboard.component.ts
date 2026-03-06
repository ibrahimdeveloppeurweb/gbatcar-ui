import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';
import { FeatherIconDirective } from '../../../../core/feather-icon/feather-icon.directive';
import { ThemeCssVariableService, ThemeCssVariablesType } from '../../../../core/services/theme-css-variable.service';
import {
    MOCK_DASHBOARD_STATS,
    MOCK_REVENUE_CHART_DATA,
    MOCK_RECENT_ONBOARDING,
    MOCK_MONTHLY_SALES_DATA,
    MOCK_FLEET_STATUS,
    MOCK_MAINTENANCE_ALERTS,
    MOCK_EXPIRING_CONTRACTS,
    MOCK_RECENT_ACTIVITY
} from '../../../../core/mock/gbatcar-dashboard.mock';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
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
        NgbDropdownModule
    ],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss'
})
export class GbatcarDashboardComponent implements OnInit {

    stats = { ...MOCK_DASHBOARD_STATS }; // Clone to allow modification
    recentOnboardings = MOCK_RECENT_ONBOARDING;
    maintenanceAlerts = MOCK_MAINTENANCE_ALERTS;
    expiringContracts = MOCK_EXPIRING_CONTRACTS;
    recentActivity = MOCK_RECENT_ACTIVITY;
    fleetStatus = [...MOCK_FLEET_STATUS]; // Clone to allow modification

    // Advanced Filters 
    showAdvancedFilters: boolean = true;

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
        // Simulate data update logic based on filters
        // In a real app, this would trigger API calls with the filter criteria

        // Randomly adjust stats just to show the UI reacting
        const variance = Math.random() * 0.2 + 0.9; // random multiplier between 0.9 and 1.1

        this.stats.activeClients = Math.round(MOCK_DASHBOARD_STATS.activeClients * variance);
        this.stats.totalVehicles = Math.round(MOCK_DASHBOARD_STATS.totalVehicles * variance);
        this.stats.availableVehicles = Math.round(MOCK_DASHBOARD_STATS.availableVehicles * variance);
        this.stats.monthlyRevenue = Math.round(MOCK_DASHBOARD_STATS.monthlyRevenue * variance);
        this.stats.pendingPaymentsCount = Math.round(MOCK_DASHBOARD_STATS.pendingPaymentsCount * variance);

        // Slightly modify chart data to show refresh
        this.clientsChartOptions.series[0].data = this.clientsChartOptions.series[0].data.map((v: number) => Math.round(v * variance));
        this.vehiclesChartOptions.series[0].data = this.vehiclesChartOptions.series[0].data.map((v: number) => Math.round(v * variance));

        Swal.fire({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            icon: 'success',
            title: 'Données du tableau de bord actualisées'
        });
    }

    resetFilters() {
        this.advPeriod = 'Ce Mois';
        this.advDateMin = '';
        this.advDateMax = '';
        this.advVehicleCategory = '';
        this.advContractType = '';
        this.advClientStatus = '';

        // Reset to original mock data
        this.stats = { ...MOCK_DASHBOARD_STATS };
        this.clientsChartOptions.series[0].data = [110, 115, 112, 118, 120, 122, 124];
        this.vehiclesChartOptions.series[0].data = [140, 142, 145, 148, 149, 150, 150];

        this.applyAdvancedFilters(); // Recalculate with default empty filters (simulated)
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
        this.clientsChartOptions = this.getClientsChartOptions(this.themeCssVariables);
        this.vehiclesChartOptions = this.getVehiclesChartOptions(this.themeCssVariables);
        this.revenueMiniChartOptions = this.getRevenueMiniChartOptions(this.themeCssVariables);
        this.revenueChartOptions = this.getRevenueChartOptions(this.themeCssVariables);
        this.vehicleSalesChartOptions = this.getVehicleSalesChartOptions(this.themeCssVariables);
        this.fleetStatusChartOptions = this.getFleetStatusChartOptions(this.themeCssVariables);
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
        const dates = MOCK_REVENUE_CHART_DATA.map(d => d.date);
        const amounts = MOCK_REVENUE_CHART_DATA.map(d => d.amount);

        return {
            series: [{
                name: 'Encaissements',
                data: amounts
            }],
            chart: {
                type: "line",
                height: 350,
                parentHeightOffset: 0,
                foreColor: themeVariables.secondary,
                toolbar: { show: false },
                zoom: { enabled: false }
            },
            colors: [themeVariables.primary],
            grid: {
                padding: { bottom: -4 },
                borderColor: themeVariables.gridBorder,
                xaxis: { lines: { show: true } }
            },
            xaxis: {
                type: 'datetime',
                categories: dates,
                axisBorder: { color: themeVariables.gridBorder },
                axisTicks: { color: themeVariables.gridBorder },
                crosshairs: {
                    stroke: { color: themeVariables.secondary }
                },
            },
            yaxis: {
                title: {
                    text: 'Montant (FCFA)',
                    style: { size: 10, color: themeVariables.secondary }
                },
                labels: {
                    formatter: function (val: number) {
                        return new Intl.NumberFormat('fr-FR').format(val);
                    }
                },
                crosshairs: {
                    stroke: { color: themeVariables.secondary }
                },
            },
            stroke: {
                width: 2,
                curve: "straight"
            },
            dataLabels: { enabled: false },
            markers: { size: 0 },
            tooltip: {
                y: {
                    formatter: function (val: number) {
                        return new Intl.NumberFormat('fr-FR').format(val) + ' FCFA';
                    }
                }
            }
        };
    }

    formatCurrency(amount: number): string {
        return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
    }

    getVehicleSalesChartOptions(themeVariables: ThemeCssVariablesType) {
        const categories = MOCK_MONTHLY_SALES_DATA.map(d => d.month);
        const data = MOCK_MONTHLY_SALES_DATA.map(d => d.sales);

        return {
            series: [{
                name: 'Ventes',
                data: data
            }],
            chart: {
                type: 'bar',
                height: '330',
                parentHeightOffset: 0,
                foreColor: themeVariables.secondary,
                toolbar: { show: false },
                zoom: { enabled: false }
            },
            colors: [themeVariables.primary],
            fill: {
                opacity: .9
            },
            grid: {
                padding: { bottom: -4 },
                borderColor: themeVariables.gridBorder,
                xaxis: { lines: { show: true } }
            },
            xaxis: {
                type: 'datetime',
                categories: categories,
                axisBorder: { color: themeVariables.gridBorder },
                axisTicks: { color: themeVariables.gridBorder },
            },
            yaxis: {
                title: {
                    text: 'Nombre de Ventes',
                    style: { size: 9, color: themeVariables.secondary }
                },
                labels: { offsetX: 0 },
            },
            legend: {
                show: true,
                position: "top",
                horizontalAlign: 'center',
                fontFamily: themeVariables.fontFamily,
                itemMargin: { horizontal: 8, vertical: 0 },
            },
            stroke: { width: 0 },
            dataLabels: {
                enabled: true,
                style: {
                    fontSize: '10px',
                    fontFamily: themeVariables.fontFamily,
                },
                offsetY: -27
            },
            plotOptions: {
                bar: {
                    columnWidth: "50%",
                    borderRadius: 4,
                    dataLabels: {
                        position: 'top',
                        orientation: 'vertical',
                    }
                },
            }
        }
    }

    getFleetStatusChartOptions(themeVariables: ThemeCssVariablesType) {
        return {
            series: MOCK_FLEET_STATUS.map(s => s.value),
            chart: {
                height: 300,
                type: 'donut',
            },
            labels: MOCK_FLEET_STATUS.map(s => s.label),
            colors: [themeVariables.primary, themeVariables.success, themeVariables.danger],
            stroke: {
                colors: ['#fff']
            },
            legend: {
                show: true,
                position: 'bottom',
                fontFamily: themeVariables.fontFamily,
                labels: { colors: themeVariables.secondary }
            },
            dataLabels: {
                enabled: false
            },
            plotOptions: {
                pie: {
                    donut: {
                        size: '75%',
                        labels: {
                            show: true,
                            name: {
                                fontSize: '14px',
                                fontFamily: themeVariables.fontFamily,
                                color: themeVariables.secondary
                            },
                            value: {
                                fontSize: '24px',
                                fontFamily: themeVariables.fontFamily,
                                color: themeVariables.dark,
                                formatter: function (val: string) {
                                    return val + ' Vhls';
                                }
                            },
                            total: {
                                show: true,
                                showAlways: true,
                                label: 'Total',
                                color: themeVariables.secondary,
                                fontSize: '14px',
                                fontFamily: themeVariables.fontFamily,
                                formatter: function (w: any) {
                                    return w.globals.seriesTotals.reduce((a: any, b: any) => {
                                        return a + b;
                                    }, 0) + ' Vhls'
                                }
                            }
                        }
                    }
                }
            }
        };
    }
}

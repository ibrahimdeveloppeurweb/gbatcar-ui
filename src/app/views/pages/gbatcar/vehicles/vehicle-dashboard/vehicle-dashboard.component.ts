import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';
import { ThemeCssVariableService } from '../../../../../core/services/theme-css-variable.service';
import { VehicleService } from '../../../../../core/services/vehicle/vehicle.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-vehicle-dashboard',
    standalone: true,
    imports: [CommonModule, NgApexchartsModule, NgbDropdownModule, FeatherIconDirective],
    templateUrl: './vehicle-dashboard.component.html',
    styleUrl: './vehicle-dashboard.component.scss'
})
export class VehicleDashboardComponent implements OnInit {

    themeCssVariables = inject(ThemeCssVariableService).getThemeCssVariables();
    private vehicleService = inject(VehicleService);
    private router = inject(Router);
    loading = false;

    // ===================== KPI DATA =====================
    stats: any = {
        totalVehicles: 0,
        activeVehicles: 0,
        availableVehicles: 0,
        maintenanceVehicles: 0,
        utilizationRate: 0,
        avgAgeMonths: 0,
        totalFleetValue: 0,
        monthlyMaintenanceCost: 0,
        costPerKm: 0,
        maintenanceRateTarget: 10,
        co2Compliance: 0,
        insuranceCoverage: 0,
    };

    distribution: any = {};
    trends: any = { maintenance: [], budget: [] };

    // ===================== VEHICLES BY STATUS =====================
    statusBreakdown: any[] = [];

    // ===================== ALERTS TABLE =====================
    criticalAlerts: any[] = [];

    // ===================== CHARTS =====================
    public fleetStatusChartOptions: ApexOptions | any;
    public maintenanceCostChartOptions: ApexOptions | any;

    ngOnInit(): void {
        this.loadDashboardData();
    }

    loadDashboardData() {
        this.loading = true;
        this.vehicleService.getDashboardData().subscribe({
            next: (data: any) => {
                const kpis = data.kpis || {};
                this.stats.totalVehicles = kpis.total_fleet || 0;
                this.stats.totalFleetValue = kpis.total_value || 0;
                this.stats.activeVehicles = kpis.active_count || 0;
                this.stats.maintenanceVehicles = kpis.maintenance_count || 0;
                this.stats.utilizationRate = this.stats.totalVehicles ?
                    ((this.stats.activeVehicles / this.stats.totalVehicles) * 100).toFixed(1) : 0;
                this.stats.insuranceCoverage = data.complianceRate || 0;

                this.distribution = data.distribution || {};
                this.trends = data.trends || { maintenance: [], budget: [] };
                this.criticalAlerts = data.alerts || [];

                // Calculate current month's maintenance cost
                const currentMonth = new Date().getMonth() + 1;
                const currentYear = new Date().getFullYear();
                const currentMain = this.trends.maintenance?.find(
                    (x: any) => parseInt(x.month) === currentMonth && parseInt(x.year) === currentYear
                );
                this.stats.monthlyMaintenanceCost = currentMain ? parseInt(currentMain.cost) : 0;

                this.refreshCharts();
                this.loading = false;
            },
            error: (err) => {
                console.error('Error fetching vehicle dashboard stats', err);
                this.loading = false;
                this.refreshCharts();
            }
        });
    }

    refreshCharts() {
        this.fleetStatusChartOptions = this.buildFleetStatusChart();
        this.maintenanceCostChartOptions = this.buildMaintenanceCostChart();
    }

    buildFleetStatusChart() {
        const dist = this.distribution;
        this.statusBreakdown = [
            { label: 'En Location-Vente', count: dist['En Location-Vente'] || 0, color: '#2ecc71', icon: 'truck' },
            { label: 'Disponible', count: dist['Disponible'] || 0, color: '#3498db', icon: 'check-circle' },
            { label: 'En Maintenance', count: dist['En Maintenance'] || 0, color: '#f39c12', icon: 'tool' },
        ];

        return {
            series: this.statusBreakdown.map(s => s.count),
            chart: { type: 'donut', height: 280 },
            labels: this.statusBreakdown.map(s => s.label),
            colors: this.statusBreakdown.map(s => s.color),
            stroke: { colors: ['#fff'] },
            legend: {
                show: true,
                position: 'bottom',
                fontFamily: this.themeCssVariables.fontFamily,
                labels: { colors: this.themeCssVariables.secondary }
            },
            dataLabels: { enabled: false },
            plotOptions: {
                pie: {
                    donut: {
                        size: '70%',
                        labels: {
                            show: true,
                            total: {
                                show: true,
                                showAlways: true,
                                label: 'Véhicules',
                                color: this.themeCssVariables.secondary,
                                fontSize: '13px',
                                formatter: (w: any) => w.globals.seriesTotals.reduce((a: any, b: any) => a + b, 0)
                            }
                        }
                    }
                }
            }
        };
    }

    buildMaintenanceCostChart() {
        const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
        const categories = [];
        const maintenanceData = [0, 0, 0, 0, 0, 0];
        const budgetData = [0, 0, 0, 0, 0, 0]; // Strictly from backend, no mocks

        // Generate the last 6 months globally
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            categories.push(monthNames[d.getMonth()]);

            // match maintenance from trends DB
            const main = this.trends.maintenance?.find((x: any) => parseInt(x.month) === d.getMonth() + 1 && parseInt(x.year) === d.getFullYear());
            if (main) maintenanceData[5 - i] = parseInt(main.cost);

            // match budget from trends DB
            const bud = this.trends.budget?.find((x: any) => parseInt(x.month) === d.getMonth() + 1 && parseInt(x.year) === d.getFullYear());
            if (bud) budgetData[5 - i] = parseInt(bud.amount);
        }

        return {
            series: [
                { name: 'Coût Maintenance (FCFA)', data: maintenanceData },
                { name: 'Budget Alloué (FCFA)', data: budgetData },
            ],
            chart: { type: 'bar', height: 280, toolbar: { show: false } },
            colors: [this.themeCssVariables.warning, this.themeCssVariables.secondary],
            plotOptions: { bar: { columnWidth: '50%', borderRadius: 3 } },
            xaxis: {
                categories: categories,
                axisBorder: { color: this.themeCssVariables.gridBorder },
            },
            yaxis: {
                labels: {
                    formatter: (val: number) => (val / 1_000_000).toFixed(1) + 'M'
                }
            },
            grid: { borderColor: this.themeCssVariables.gridBorder },
            legend: {
                show: true,
                position: 'top',
                fontFamily: this.themeCssVariables.fontFamily,
            },
            dataLabels: { enabled: false },
            tooltip: {
                y: { formatter: (val: number) => new Intl.NumberFormat('fr-FR').format(val) + ' FCFA' }
            }
        };
    }

    formatCurrency(amount: number): string {
        return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
    }

    getSeverityLabel(severity: string): string {
        if (!severity) return 'Information';
        const s = severity.toLowerCase();
        return (s === 'critique' || s === 'danger') ? 'Critique' : 'Attention';
    }

    // ===================== ACTIONS =====================
    viewVehicle(uuid: string) {
        if (uuid) {
            this.router.navigate(['/gbatcar/vehicles/details', uuid]);
        }
    }

    resolveAlert(uuid: string, problem: string) {
        if (uuid) {
            // Remove locally instantly for UI feedback
            this.criticalAlerts = this.criticalAlerts.filter(a => !(a.uuid === uuid && a.problem === problem));
        }
    }

    scheduleAction(uuid: string, problem: string) {
        if (uuid) {
            this.router.navigate(['/gbatcar/maintenance/new'], {
                queryParams: { vehicleUuid: uuid, reason: problem }
            });
        }
    }
}

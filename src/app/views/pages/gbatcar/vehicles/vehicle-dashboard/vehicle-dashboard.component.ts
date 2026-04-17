import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';
import { ThemeCssVariableService } from '../../../../../core/services/theme-css-variable.service';
import { VehicleService } from '../../../../../core/services/vehicle/vehicle.service';
import { ContractDurationService } from '../../../../../core/services/contract/contract-duration.service';
import { Router, RouterLink } from '@angular/router';
import { NgxPermissionsModule, NgxPermissionsService } from 'ngx-permissions';
import { AuthService } from '../../../../../core/services/auth/auth.service';

@Component({
    selector: 'app-vehicle-dashboard',
    standalone: true,
    imports: [CommonModule, NgApexchartsModule, NgbDropdownModule, FeatherIconDirective, FormsModule, NgSelectModule, NgxPermissionsModule, RouterLink],
    templateUrl: './vehicle-dashboard.component.html',
    styleUrl: './vehicle-dashboard.component.scss'
})
export class VehicleDashboardComponent implements OnInit {

    themeCssVariables = inject(ThemeCssVariableService).getThemeCssVariables();
    private vehicleService = inject(VehicleService);
    private durationService = inject(ContractDurationService);
    private router = inject(Router);
    private authService = inject(AuthService);
    private permissionsService = inject(NgxPermissionsService);
    loading = false;
    loadingDurations = false;

    selectedMonth: number = 6;
    monthsList: any[] = [];

    addDurationTag = (name: string) => {
        return new Promise((resolve) => {
            const formattedName = name.toLowerCase().includes('mois') ? name : `${name} mois`;
            this.loadingDurations = true;
            this.durationService.create(formattedName).subscribe({
                next: (res: any) => {
                    const newDuration = res.data || res;
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
        validDocs: 0,
        totalExpectedDocs: 0
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
        const permissions = this.authService.getPermissions();
        this.permissionsService.loadPermissions(permissions);
        this.loadDurations();
        this.loadDashboardData();
    }

    loadDurations() {
        this.durationService.getAll().subscribe({
            next: (data) => {
                this.monthsList = data;
            }
        });
    }

    loadDashboardData() {
        this.loading = true;
        this.vehicleService.getDashboardData({ months: this.selectedMonth }).subscribe({
            next: (data: any) => {
                const kpis = data.kpis || {};
                this.stats.totalVehicles = kpis.total_fleet || 0;
                this.stats.totalFleetValue = kpis.total_value || 0;
                this.stats.activeVehicles = kpis.active_count || 0;
                this.stats.maintenanceVehicles = kpis.maintenance_count || 0;
                this.stats.utilizationRate = this.stats.totalVehicles ?
                    ((this.stats.activeVehicles / this.stats.totalVehicles) * 100).toFixed(1) : 0;
                this.stats.insuranceCoverage = data.complianceRate || 0;
                this.stats.validDocs = data.validDocs || 0;
                this.stats.totalExpectedDocs = data.totalExpectedDocs || 0;

                this.distribution = {};
                if (Array.isArray(data.distribution)) {
                    data.distribution.forEach((item: any) => {
                        this.distribution[item.statut] = item.count;
                    });
                }

                this.trends = data.trends || { maintenance: [], budget: [] };
                this.criticalAlerts = data.alerts || [];

                this.stats.monthlyMaintenanceCost = kpis.active_maintenance_cost || 0;
                this.stats.budgetMonthly = kpis.budgetMonthly || 200000;

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
            { label: 'Vendu', count: dist['Vendu'] || 0, color: '#9b59b6', icon: 'shopping-cart' },
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
                                formatter: (w: any) => this.stats.totalVehicles
                            }
                        }
                    }
                }
            }
        };
    }

    buildMaintenanceCostChart() {
        const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
        const categories: string[] = [];
        const maintenanceData: number[] = [];
        const budgetData: number[] = [];

        const trendsValues = this.trends.maintenance || [];
        const budgetValues = this.trends.budget || [];
        const isYearly = this.selectedMonth > 36;

        trendsValues.forEach((item: any, index: number) => {
            if (isYearly) {
                categories.push(item.year.toString());
            } else {
                const monthIdx = parseInt(item.month) - 1;
                const shortYear = item.year.toString().slice(-2);
                categories.push(`${monthNames[monthIdx]} ${shortYear}`);
            }
            maintenanceData.push(item.cost || 0);

            // Match budget if exists
            const bud = budgetValues[index];
            budgetData.push(bud ? (bud.amount || 0) : 0);
        });

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

    onMonthChange(item: any) {
        if (item && typeof item === 'object') {
            this.selectedMonth = item.monthsCount;
        } else if (typeof item === 'number') {
            this.selectedMonth = item;
        }
        this.loadDashboardData();
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

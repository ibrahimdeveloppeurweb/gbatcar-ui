import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';
import { ThemeCssVariableService } from '../../../../../core/services/theme-css-variable.service';

@Component({
    selector: 'app-vehicle-dashboard',
    standalone: true,
    imports: [CommonModule, NgApexchartsModule, NgbDropdownModule, FeatherIconDirective],
    templateUrl: './vehicle-dashboard.component.html',
    styleUrl: './vehicle-dashboard.component.scss'
})
export class VehicleDashboardComponent implements OnInit {

    themeCssVariables = inject(ThemeCssVariableService).getThemeCssVariables();

    // ===================== KPI DATA =====================
    stats = {
        totalVehicles: 48,
        activeVehicles: 38,
        availableVehicles: 5,
        maintenanceVehicles: 5,
        utilizationRate: 79.2,    // % of fleet generating revenue
        avgAgeMonths: 28,          // average fleet age
        totalFleetValue: 1_450_000_000, // FCFA
        monthlyMaintenanceCost: 4_800_000, // FCFA
        costPerKm: 185,            // FCFA
        maintenanceRateTarget: 10, // % of fleet under maintenance (alert threshold)
        co2Compliance: 91,         // % compliant vehicles
        insuranceCoverage: 85,     // % with valid insurance
    };

    // ===================== VEHICLES BY STATUS =====================
    statusBreakdown = [
        { label: 'En Location-Vente', count: 38, color: '#2ecc71', icon: 'truck' },
        { label: 'Disponible', count: 5, color: '#3498db', icon: 'check-circle' },
        { label: 'En Maintenance', count: 5, color: '#f39c12', icon: 'tool' },
    ];

    // ===================== ALERTS TABLE =====================
    criticalAlerts = [
        { plate: '1234 AB 01', model: 'Toyota Yaris', client: 'Jean Dubois', issue: 'Vidange dépassée de 3 000 km', severity: 'danger', daysOverdue: 18, cost: 45000 },
        { plate: '9012 EF 01', model: 'Suzuki Swift', client: 'Fatou Sylla', issue: 'Assurance expire dans 8 jours', severity: 'warning', daysOverdue: 0, cost: 180000 },
        { plate: '7890 IJ 01', model: 'Toyota Corolla', client: 'Amadou Coulibaly', issue: 'Contrôle technique expiré', severity: 'danger', daysOverdue: 32, cost: 75000 },
        { plate: '4567 CD 02', model: 'Kia Rio', client: 'Marième Ba', issue: 'Tracker GPS hors ligne', severity: 'warning', daysOverdue: 0, cost: 0 },
    ];

    // ===================== CHARTS =====================
    public fleetStatusChartOptions: ApexOptions | any;
    public maintenanceCostChartOptions: ApexOptions | any;

    ngOnInit(): void {
        this.fleetStatusChartOptions = this.buildFleetStatusChart();
        this.maintenanceCostChartOptions = this.buildMaintenanceCostChart();
    }

    buildFleetStatusChart() {
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
        return {
            series: [
                { name: 'Coût Maintenance (FCFA)', data: [3200000, 4100000, 3800000, 4800000, 5200000, 4800000] },
                { name: 'Budget Alloué (FCFA)', data: [4500000, 4500000, 4500000, 4500000, 4500000, 4500000] },
            ],
            chart: { type: 'bar', height: 280, toolbar: { show: false } },
            colors: [this.themeCssVariables.warning, this.themeCssVariables.secondary],
            plotOptions: { bar: { columnWidth: '50%', borderRadius: 3 } },
            xaxis: {
                categories: ['Oct', 'Nov', 'Déc', 'Jan', 'Fév', 'Mar'],
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
        return severity === 'danger' ? 'Critique' : 'Attention';
    }
}

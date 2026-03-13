import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { RouterLink } from '@angular/router';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';
import { ThemeCssVariableService } from '../../../../../core/services/theme-css-variable.service';

@Component({
    selector: 'app-maintenance-dashboard',
    standalone: true,
    imports: [CommonModule, NgApexchartsModule, NgbDropdownModule, RouterLink, FeatherIconDirective],
    templateUrl: './maintenance-dashboard.component.html',
    styleUrl: './maintenance-dashboard.component.scss'
})
export class MaintenanceDashboardComponent implements OnInit {

    themeCssVariables = inject(ThemeCssVariableService).getThemeCssVariables();

    // ===================== KPI DATA =====================
    stats = {
        totalInterventions: 27,
        interventionsThisMonth: 8,
        pendingInterventions: 4,
        completedInterventions: 23,
        avgRepairDays: 3.2,
        totalCostYTD: 18_750_000,    // FCFA – Coût total YTD
        monthlyCost: 4_800_000,      // FCFA – Ce mois
        budgetMonthly: 5_000_000,    // FCFA – Budget alloué
        activeAlerts: 5,             // Alertes sinistres actives
        criticalAlerts: 2,           // Alertes critiques
        avgCostPerIntervention: 694_444, // FCFA
        vehiclesInShop: 5,
    };

    // ===================== INTERVENTIONS RÉCENTES =====================
    recentInterventions = [
        { id: 'INT-2024-027', vehicle: 'Toyota Yaris - 1234 AB 01', client: 'Jean Dubois', type: 'Vidange + Filtres', technician: 'Koné Moussa', cost: 45000, status: 'Terminé', days: 1 },
        { id: 'INT-2024-026', vehicle: 'Suzuki Swift - 9012 EF 01', client: 'Fatou Sylla', type: 'Révision pneumatiques', technician: 'Diallo Seydou', cost: 120000, status: 'En cours', days: 2 },
        { id: 'INT-2024-025', vehicle: 'Toyota Corolla - 7890 IJ 01', client: 'Amadou Coulibaly', type: 'Contrôle technique', technician: 'Traoré Adama', cost: 75000, status: 'En cours', days: 3 },
        { id: 'INT-2024-024', vehicle: 'Kia Rio - 3456 GH 01', client: 'Marie Koné', type: 'Freins + Disques', technician: 'Koné Moussa', cost: 190000, status: 'Terminé', days: 2 },
        { id: 'INT-2024-023', vehicle: 'Hyundai Accent - 5678 CD 01', client: 'Paul Yao', type: "Remplacement batterie", technician: 'Diallo Seydou', cost: 85000, status: 'En attente', days: 0 },
    ];

    // ===================== ALERTS =====================
    accidents = [
        { id: 'SIN-2024-005', vehicle: '9012 EF 01 – Suzuki Swift', date: '2024-03-02', type: 'Accrochage léger', severity: 'warning', status: 'En traitement', repairCost: 180000 },
        { id: 'SIN-2024-004', vehicle: '7890 IJ 01 – Toyota Corolla', date: '2024-02-18', type: 'Bris de glace', severity: 'secondary', status: 'Clôturé', repairCost: 65000 },
        { id: 'SIN-2024-003', vehicle: '1234 AB 01 – Toyota Yaris', date: '2024-02-05', type: 'Collision frontale', severity: 'danger', status: 'En traitement', repairCost: 850000 },
    ];

    // ===================== CHARTS =====================
    public interventionTypeChartOptions: ApexOptions | any;
    public costTrendChartOptions: ApexOptions | any;

    ngOnInit(): void {
        this.interventionTypeChartOptions = this.buildInterventionTypeChart();
        this.costTrendChartOptions = this.buildCostTrendChart();
    }

    buildInterventionTypeChart() {
        return {
            series: [9, 6, 5, 4, 3],
            chart: { type: 'donut', height: 270 },
            labels: ['Vidange/Filtres', 'Pneumatiques', 'Freinage', 'Électrique', 'Carrosserie'],
            colors: [this.themeCssVariables.primary, '#2ecc71', '#f39c12', '#3498db', '#e74c3c'],
            stroke: { colors: ['#fff'] },
            legend: { show: true, position: 'bottom', fontFamily: this.themeCssVariables.fontFamily },
            dataLabels: { enabled: false },
            plotOptions: {
                pie: {
                    donut: {
                        size: '65%',
                        labels: {
                            show: true,
                            total: {
                                show: true, showAlways: true,
                                label: 'Interventions',
                                color: this.themeCssVariables.secondary,
                                fontSize: '12px',
                                formatter: (w: any) => w.globals.seriesTotals.reduce((a: any, b: any) => a + b, 0)
                            }
                        }
                    }
                }
            }
        };
    }

    buildCostTrendChart() {
        return {
            series: [
                { name: 'Coût Réel (FCFA)', data: [3200000, 4100000, 3800000, 5200000, 3500000, 4800000] },
                { name: 'Budget (FCFA)', data: [5000000, 5000000, 5000000, 5000000, 5000000, 5000000] },
            ],
            chart: { type: 'line', height: 270, toolbar: { show: false } },
            colors: [this.themeCssVariables.warning, this.themeCssVariables.secondary],
            stroke: { curve: 'smooth', width: [3, 2], dashArray: [0, 5] },
            xaxis: {
                categories: ['Oct', 'Nov', 'Déc', 'Jan', 'Fév', 'Mar'],
                axisBorder: { color: this.themeCssVariables.gridBorder },
            },
            yaxis: {
                labels: { formatter: (val: number) => (val / 1_000_000).toFixed(1) + 'M' }
            },
            grid: { borderColor: this.themeCssVariables.gridBorder },
            legend: { show: true, position: 'top', fontFamily: this.themeCssVariables.fontFamily },
            dataLabels: { enabled: false },
            markers: { size: 4 },
            tooltip: {
                y: { formatter: (val: number) => new Intl.NumberFormat('fr-FR').format(val) + ' FCFA' }
            }
        };
    }

    formatCurrency(amount: number): string {
        return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
    }

    getStatusClass(status: string): string {
        const map: Record<string, string> = {
            'Terminé': 'bg-success',
            'En cours': 'bg-primary',
            'En attente': 'bg-warning text-dark',
            'En traitement': 'bg-warning text-dark',
            'Clôturé': 'bg-secondary',
        };
        return map[status] || 'bg-secondary';
    }
}

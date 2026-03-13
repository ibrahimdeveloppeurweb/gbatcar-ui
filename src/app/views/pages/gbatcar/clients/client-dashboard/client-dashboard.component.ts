import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { RouterLink } from '@angular/router';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';
import { ThemeCssVariableService } from '../../../../../core/services/theme-css-variable.service';

@Component({
    selector: 'app-client-dashboard',
    standalone: true,
    imports: [CommonModule, NgApexchartsModule, NgbDropdownModule, RouterLink, FeatherIconDirective],
    templateUrl: './client-dashboard.component.html',
    styleUrl: './client-dashboard.component.scss'
})
export class ClientDashboardComponent implements OnInit {

    themeCssVariables = inject(ThemeCssVariableService).getThemeCssVariables();

    // ===================== KPI DATA =====================
    stats = {
        totalClients: 42,
        activeClients: 35,
        lateClients: 6,
        pendingValidation: 3,
        inactiveClients: 4,
        newThisMonth: 5,
        churnRate: 2.4,             // % de clients perdus
        avgContractDuration: 24,    // mois
        totalPortfolioValue: 1_820_000_000, // FCFA
        avgClientValue: 43_333_333, // FCFA par client
    };

    // ===================== TOP CLIENTS AT RISK =====================
    riskClients = [
        { id: 'CLI-004', name: 'Fatou Sylla', vehicle: 'Suzuki Swift', contractId: 'CTR-2024-002', delay: 5, amount: 4_850_000, risk: 'Élevé' },
        { id: 'CLI-005', name: 'Amadou Coulibaly', vehicle: 'Toyota Corolla', contractId: 'CTR-2022-045', delay: 45, amount: 4_500_000, risk: 'Critique' },
        { id: 'CLI-001', name: 'Jean Dubois', vehicle: 'Toyota Yaris', contractId: 'CTR-2024-001', delay: 12, amount: 2_200_000, risk: 'Modéré' },
    ];

    // ===================== RECENT CLIENTS =====================
    recentClients = [
        { id: 'CLI-006', name: 'Marième Ba', phone: '+225 07 00 00 06', vehicle: 'Kia Rio', status: 'En Attente Validation', paymentStatus: '-', date: '2024-03-08' },
        { id: 'CLI-007', name: 'Oumar Traoré', phone: '+225 07 00 00 07', vehicle: 'Hyundai Accent', status: 'Actif', paymentStatus: 'À jour', date: '2024-03-05' },
        { id: 'CLI-008', name: 'Aïssata Konaté', phone: '+225 07 00 00 08', vehicle: 'Toyota Yaris', status: 'Actif', paymentStatus: 'À jour', date: '2024-03-01' },
    ];

    // ===================== CHARTS =====================
    public clientStatusChartOptions: ApexOptions | any;
    public clientGrowthChartOptions: ApexOptions | any;

    ngOnInit(): void {
        this.clientStatusChartOptions = this.buildClientStatusChart();
        this.clientGrowthChartOptions = this.buildClientGrowthChart();
    }

    buildClientStatusChart() {
        return {
            series: [this.stats.activeClients, this.stats.lateClients, this.stats.pendingValidation, this.stats.inactiveClients],
            chart: { type: 'donut', height: 270 },
            labels: ['Actifs', 'En Retard', 'En Attente', 'Inactifs'],
            colors: ['#2ecc71', '#e74c3c', '#f39c12', '#6c757d'],
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
                                label: 'Total Clients',
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

    buildClientGrowthChart() {
        return {
            series: [
                { name: 'Nouveaux Clients', data: [3, 5, 2, 6, 4, 5] },
                { name: 'Clients Perdus', data: [1, 0, 1, 2, 0, 1] },
            ],
            chart: { type: 'bar', height: 270, toolbar: { show: false }, stacked: false },
            colors: ['#2ecc71', '#e74c3c'],
            plotOptions: { bar: { columnWidth: '50%', borderRadius: 3 } },
            xaxis: {
                categories: ['Oct', 'Nov', 'Déc', 'Jan', 'Fév', 'Mar'],
                axisBorder: { color: this.themeCssVariables.gridBorder },
            },
            grid: { borderColor: this.themeCssVariables.gridBorder },
            legend: { show: true, position: 'top', fontFamily: this.themeCssVariables.fontFamily },
            dataLabels: { enabled: false },
            tooltip: { y: { formatter: (val: number) => val + ' clients' } }
        };
    }

    formatCurrency(amount: number): string {
        return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
    }

    getStatusClass(status: string): string {
        const map: Record<string, string> = {
            'Actif': 'bg-success',
            'En Attente Validation': 'bg-warning text-dark',
            'Actif (Retard)': 'bg-danger',
            'Inactif': 'bg-secondary',
        };
        return map[status] || 'bg-secondary';
    }

    getRiskClass(risk: string): string {
        const map: Record<string, string> = {
            'Critique': 'bg-danger',
            'Élevé': 'bg-warning text-dark',
            'Modéré': 'bg-primary',
        };
        return map[risk] || 'bg-secondary';
    }
}

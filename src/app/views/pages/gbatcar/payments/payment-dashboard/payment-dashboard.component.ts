import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';
import { ThemeCssVariableService } from '../../../../../core/services/theme-css-variable.service';

@Component({
    selector: 'app-payment-dashboard',
    standalone: true,
    imports: [CommonModule, NgApexchartsModule, NgbDropdownModule, FeatherIconDirective],
    templateUrl: './payment-dashboard.component.html',
    styleUrl: './payment-dashboard.component.scss'
})
export class PaymentDashboardComponent implements OnInit {

    themeCssVariables = inject(ThemeCssVariableService).getThemeCssVariables();

    // ===================== KPI DATA =====================
    stats = {
        mrr: 28_500_000,          // Recettes mensuelles attendues (FCFA)
        mrrCollected: 23_800_000, // Recettes encaissées ce mois
        collectionRate: 83.5,     // % de recouvrement
        totalOverdue: 9_350_000,  // Total impayés
        overdueCount: 6,          // Nombre de dossiers en retard
        avgPaymentDelay: 12,      // Jours de retard moyen
        activePenalties: 3,       // Pénalités actives
        penaltiesAmount: 540_000, // Total pénalités (FCFA)
        cashBalance: 14_200_000,  // Trésorerie disponible (FCFA)
        nextMonthForecast: 30_100_000, // Prévision du mois prochain
    };

    // ===================== RECENT PAYMENTS =====================
    recentPayments = [
        { id: 'PAY-2024-089', client: 'Jean Dubois', contractId: 'CTR-2024-001', amount: 185000, date: '2024-03-08', method: 'Mobile Money', status: 'Validé' },
        { id: 'PAY-2024-090', client: 'Fatou Sylla', contractId: 'CTR-2024-002', amount: 210000, date: '2024-03-07', method: 'Virement', status: 'En attente' },
        { id: 'PAY-2024-091', client: 'Marie Koné', contractId: 'CTR-2024-005', amount: 195000, date: '2024-03-06', method: 'Espèces', status: 'Validé' },
        { id: 'PAY-2024-092', client: 'Amadou Coulibaly', contractId: 'CTR-2022-045', amount: 160000, date: '2024-03-05', method: 'Mobile Money', status: 'Rejeté' },
        { id: 'PAY-2024-093', client: 'Paul Yao', contractId: 'CTR-2023-089', amount: 220000, date: '2024-03-04', method: 'Chèque', status: 'Validé' },
    ];

    // ===================== CHARTS =====================
    public cashflowChartOptions: ApexOptions | any;
    public paymentMethodChartOptions: ApexOptions | any;

    ngOnInit(): void {
        this.cashflowChartOptions = this.buildCashflowChart();
        this.paymentMethodChartOptions = this.buildPaymentMethodChart();
    }

    buildCashflowChart() {
        return {
            series: [
                { name: 'Encaissements Réalisés', data: [21500000, 24200000, 22800000, 26100000, 23800000, 28500000] },
                { name: 'Prévision MRR', data: [25000000, 25000000, 26000000, 27000000, 28000000, 28500000] },
            ],
            chart: { type: 'area', height: 260, toolbar: { show: false }, sparkline: { enabled: false } },
            colors: [this.themeCssVariables.primary, this.themeCssVariables.secondary],
            stroke: { curve: 'smooth', width: 2 },
            fill: {
                type: 'gradient',
                gradient: { opacityFrom: 0.3, opacityTo: 0.05 }
            },
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
                show: true, position: 'top',
                fontFamily: this.themeCssVariables.fontFamily,
            },
            dataLabels: { enabled: false },
            tooltip: {
                y: { formatter: (val: number) => new Intl.NumberFormat('fr-FR').format(val) + ' FCFA' }
            }
        };
    }

    buildPaymentMethodChart() {
        return {
            series: [45, 30, 18, 7],
            chart: { type: 'donut', height: 260 },
            labels: ['Mobile Money', 'Virement', 'Espèces', 'Chèque'],
            colors: [this.themeCssVariables.primary, '#2ecc71', '#f39c12', '#6c757d'],
            stroke: { colors: ['#fff'] },
            legend: {
                show: true, position: 'bottom',
                fontFamily: this.themeCssVariables.fontFamily,
            },
            dataLabels: { enabled: true, formatter: (val: number) => val.toFixed(0) + '%' },
            plotOptions: {
                pie: {
                    donut: {
                        size: '60%',
                        labels: {
                            show: true,
                            total: {
                                show: true, showAlways: true,
                                label: 'Transactions',
                                color: this.themeCssVariables.secondary,
                                fontSize: '12px',
                                formatter: () => '100%'
                            }
                        }
                    }
                }
            }
        };
    }

    formatCurrency(amount: number): string {
        return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
    }

    getStatusClass(status: string): string {
        const map: Record<string, string> = {
            'Validé': 'bg-success',
            'En attente': 'bg-warning text-dark',
            'Rejeté': 'bg-danger',
        };
        return map[status] || 'bg-secondary';
    }

    getMethodIcon(method: string): string {
        const map: Record<string, string> = {
            'Mobile Money': 'smartphone',
            'Virement': 'arrow-right-circle',
            'Espèces': 'dollar-sign',
            'Chèque': 'file-text',
        };
        return map[method] || 'credit-card';
    }
}

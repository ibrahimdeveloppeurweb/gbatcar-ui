import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { RouterModule } from '@angular/router';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';
import { ThemeCssVariableService } from '../../../../../core/services/theme-css-variable.service';

import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';
import { PaymentService } from '../../../../../core/services/payment/payment.service';
import { ContractDurationService } from '../../../../../core/services/contract/contract-duration.service';
import { NgxPermissionsModule, NgxPermissionsService } from 'ngx-permissions';
import { AuthService } from '../../../../../core/services/auth/auth.service';

@Component({
    selector: 'app-payment-dashboard',
    standalone: true,
    imports: [CommonModule, NgApexchartsModule, NgbDropdownModule, FeatherIconDirective, NgSelectModule, FormsModule, RouterModule, NgxPermissionsModule],
    templateUrl: './payment-dashboard.component.html',
    styleUrl: './payment-dashboard.component.scss'
})
export class PaymentDashboardComponent implements OnInit {

    themeCssVariables = inject(ThemeCssVariableService).getThemeCssVariables();
    private paymentService = inject(PaymentService);
    private durationService = inject(ContractDurationService);
    private authService = inject(AuthService);
    private permissionsService = inject(NgxPermissionsService);

    loading = false;
    loadingDurations = false;
    selectedMonth = 6;
    monthsList: any[] = [];

    addDurationTag = (name: string) => {
        return new Promise((resolve) => {
            // Append " mois" if not present
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
    stats = {
        mrr: 28_500_000,          // Recettes mensuelles attendues (FCFA)
        mrrCollected: 23_800_000, // Recettes encaissées ce mois
        collectionRate: 83.5,     // % de recouvrement
        totalOverdue: 9_350_000,  // Total impayés
        overdueCount: 6,          // Nombre de dossiers en retard
        avgPaymentDelay: 0,
        activePenalties: 0,
        penaltiesAmount: 0,
        cashBalance: 0,
        nextMonthForecast: 0,
        totalPaymentsCount: 0
    };

    // ===================== DATA =====================
    recentPayments: any[] = [];
    trends: any = { cashflow: [] };
    methods: any[] = [];

    // ===================== CHARTS =====================
    public cashflowChartOptions: ApexOptions | any;
    public paymentMethodChartOptions: ApexOptions | any;

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
        // For now, we still build charts with hardcoded data until backend is ready
        // but we prepare the subscription structure
        this.paymentService.getDashboardData({ months: this.selectedMonth }).subscribe({
            next: (data: any) => {
                this.stats = data.kpis;
                this.stats.totalPaymentsCount = data.totalPaymentsCount;
                this.trends = data.trends || { cashflow: [] };
                this.recentPayments = data.recentPayments || [];
                this.methods = data.methods || [];
                this.refreshCharts();
                this.loading = false;
            },
            error: (err) => {
                console.error('Error fetching payment dashboard data', err);
                this.refreshCharts();
                this.loading = false;
            }
        });
    }

    onMonthChange(item: any) {
        if (item && typeof item === 'object') {
            this.selectedMonth = item.monthsCount;
        } else if (typeof item === 'number') {
            this.selectedMonth = item;
        }
        this.loadDashboardData();
    }

    refreshCharts() {
        this.cashflowChartOptions = this.buildCashflowChart();
        this.paymentMethodChartOptions = this.buildPaymentMethodChart();
    }

    buildCashflowChart() {
        const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
        const categories: string[] = [];
        let expectedData: number[] = [];
        let paidData: number[] = [];

        const groupByYear = this.selectedMonth > 36;

        if (groupByYear) {
            // Logic for yearly grouping
            const startYear = new Date().getFullYear() - Math.ceil(this.selectedMonth / 12) + 1;
            const endYear = new Date().getFullYear();

            for (let year = startYear; year <= endYear; year++) {
                categories.push(year.toString());
                const key = year.toString();
                const item = this.trends.cashflow?.find((x: any) => x.month === key);

                expectedData.push(item ? parseFloat(item.expected) : 0);
                paidData.push(item ? parseFloat(item.paid) : 0);
            }
        } else {
            // Existing monthly logic
            expectedData = new Array(this.selectedMonth).fill(0);
            paidData = new Array(this.selectedMonth).fill(0);

            for (let i = this.selectedMonth - 1; i >= 0; i--) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);

                let catName = monthNames[d.getMonth()];
                if (this.selectedMonth > 12) {
                    catName += ' ' + d.getFullYear().toString().substring(2);
                }
                categories.push(catName);

                const yearStr = d.getFullYear();
                const monthStr = (d.getMonth() + 1).toString().padStart(2, '0');
                const key = `${yearStr}-${monthStr}`;

                const item = this.trends.cashflow?.find((x: any) => x.month === key);
                if (item) {
                    expectedData[(this.selectedMonth - 1) - i] = parseFloat(item.expected);
                    paidData[(this.selectedMonth - 1) - i] = parseFloat(item.paid);
                }
            }
        }

        return {
            series: [
                { name: 'Montant Attendu', data: expectedData },
                { name: 'Montant Encaissé', data: paidData },
            ],
            chart: { type: 'area', height: 260, toolbar: { show: false }, sparkline: { enabled: false } },
            colors: ['#6c757d', '#2ecc71'], // Gris pour Attendu, Vert pour Encaissé
            stroke: { curve: 'smooth', width: 2 },
            fill: {
                type: 'gradient',
                gradient: { opacityFrom: 0.3, opacityTo: 0.05 }
            },
            xaxis: {
                categories: categories,
                axisBorder: { color: this.themeCssVariables.gridBorder },
            },
            yaxis: {
                labels: {
                    formatter: (val: number) => (val >= 1_000_000) ? (val / 1_000_000).toFixed(1) + 'M' : (val / 1_000).toFixed(0) + 'k'
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
        const labels = this.methods.map(m => m.name) || [];
        const series = this.methods.map(m => parseInt(m.value)) || [];

        return {
            series: series.length > 0 ? series : [0],
            chart: { type: 'donut', height: 260 },
            labels: labels.length > 0 ? labels : ['Aucun'],
            colors: [this.themeCssVariables.primary, '#2ecc71', '#f39c12', '#6c757d', '#e74c3c'],
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

    getStatusClass(status: string): string {
        switch (status?.toUpperCase()) {
            case 'VALIDÉ': return 'bg-success text-white';
            case 'EN ATTENTE': return 'bg-warning text-dark';
            case 'REJETÉ': return 'bg-danger text-white';
            case 'INVALIDE': return 'bg-dark text-white';
            default: return 'bg-secondary text-white';
        }
    }

    getMethodIcon(method: string): string {
        const m = method?.toLowerCase() || '';
        if (m.includes('mobile') || m.includes('orange') || m.includes('wave')) return 'smartphone';
        if (m.includes('espèces') || m.includes('cash')) return 'dollar-sign';
        if (m.includes('virement') || m.includes('banque')) return 'briefcase';
        if (m.includes('chèque')) return 'layers';
        return 'credit-card';
    }

    getMethodColor(method: string): string {
        const m = method?.toLowerCase() || '';
        if (m.includes('mobile')) return '#e74c3c';
        if (m.includes('espèces')) return '#2ecc71';
        return '#6c757d';
    }

    formatCurrency(amount: number): string {
        return new Intl.NumberFormat('fr-FR').format(amount || 0) + ' FCFA';
    }
}

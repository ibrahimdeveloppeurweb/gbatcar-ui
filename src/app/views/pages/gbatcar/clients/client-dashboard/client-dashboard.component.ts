import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { RouterLink } from '@angular/router';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';
import { ThemeCssVariableService } from '../../../../../core/services/theme-css-variable.service';
import { ClientService } from '../../../../../core/services/client/client.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-client-dashboard',
    standalone: true,
    imports: [CommonModule, NgApexchartsModule, NgbDropdownModule, RouterLink, FeatherIconDirective, NgSelectModule, FormsModule],
    templateUrl: './client-dashboard.component.html',
    styleUrl: './client-dashboard.component.scss'
})
export class ClientDashboardComponent implements OnInit {

    themeCssVariables = inject(ThemeCssVariableService).getThemeCssVariables();
    private clientService = inject(ClientService);

    loading = false;

    // ===================== KPI DATA =====================
    stats: any = {
        totalClients: 0,
        activeClients: 0,
        lateClients: 0,
        newThisMonth: 0,
        portfolioValue: 0
    };

    distribution: any = {};
    trends: any = { new: [], lost: [] };

    // ===================== TOP CLIENTS AT RISK =====================
    riskClients: any[] = [];

    // ===================== RECENT CLIENTS =====================
    recentClients: any[] = [];

    // ===================== CHARTS =====================
    public clientStatusChartOptions: ApexOptions | any;
    public clientGrowthChartOptions: ApexOptions | any;

    monthsList: number[] = Array.from({ length: 36 }, (_, i) => i + 1);
    selectedMonth: number = 6;

    ngOnInit(): void {
        this.loadDashboardData();
    }

    loadDashboardData() {
        this.loading = true;
        this.clientService.getDashboardData(this.selectedMonth).subscribe({
            next: (data: any) => {
                this.stats = data.kpis || this.stats;
                this.distribution = data.distribution || {};
                this.trends = data.trends || { new: [], lost: [] };
                this.riskClients = data.riskyClients || [];
                this.recentClients = data.newClients || [];

                this.refreshCharts();
                this.loading = false;
            },
            error: (err) => {
                console.error('Error fetching dashboard stats', err);
                this.loading = false;
                this.refreshCharts(); // Load empty charts at least
            }
        });
    }

    onMonthChange() {
        this.loadDashboardData();
    }

    refreshCharts() {
        this.clientStatusChartOptions = this.buildClientStatusChart();
        this.clientGrowthChartOptions = this.buildClientGrowthChart();
    }

    buildClientStatusChart() {
        const dist = this.distribution;
        const seriesData = [
            dist['Actifs'] || 0,
            dist['En Retard'] || 0,
            dist['En Attente'] || 0,
            dist['Inactifs'] || 0
        ];

        return {
            series: seriesData,
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
        const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
        const categories = [];
        const vertData = new Array(this.selectedMonth).fill(0);
        const grisData = new Array(this.selectedMonth).fill(0);
        const rougeData = new Array(this.selectedMonth).fill(0);

        // Generate the last X months globally
        for (let i = this.selectedMonth - 1; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);

            let catName = monthNames[d.getMonth()];
            if (this.selectedMonth > 12) {
                catName += ' ' + d.getFullYear().toString().substring(2); // ex: Jan 24
            }
            categories.push(catName);

            const arrIndex = (this.selectedMonth - 1) - i;

            // match vert, gris, rouge from trends DB
            const vM = this.trends.vert?.find((x: any) => parseInt(x.month) === d.getMonth() + 1 && parseInt(x.year) === d.getFullYear());
            if (vM) vertData[arrIndex] = parseInt(vM.count);

            const gM = this.trends.gris?.find((x: any) => parseInt(x.month) === d.getMonth() + 1 && parseInt(x.year) === d.getFullYear());
            if (gM) grisData[arrIndex] = parseInt(gM.count);

            const rM = this.trends.rouge?.find((x: any) => parseInt(x.month) === d.getMonth() + 1 && parseInt(x.year) === d.getFullYear());
            if (rM) rougeData[arrIndex] = parseInt(rM.count);
        }

        return {
            series: [
                { name: 'Sains', data: vertData },
                { name: 'Terminés/Vendus', data: grisData },
                { name: 'Rompus', data: rougeData },
            ],
            chart: { type: 'bar', height: 270, toolbar: { show: false }, stacked: false },
            colors: ['#2ecc71', '#6c757d', '#e74c3c'],
            plotOptions: { bar: { columnWidth: '50%', borderRadius: 3 } },
            xaxis: {
                categories: categories,
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
            'En Cours de Contrat': 'bg-success',
            'Dossier Approuvé': 'bg-success',
            'En attente de Validation': 'bg-warning text-dark',
            'Litige / Bloqué': 'bg-danger',
            'Inactif': 'bg-secondary',
            'Prospect': 'bg-primary-subtle text-primary border border-primary-subtle',
        };
        return map[status] || 'bg-secondary';
    }

    getCalculatedRiskLevel(c: any): string {
        const delay = parseInt(c.delayDays || 0);
        const amount = parseFloat(c.totalDue || 0);

        if (delay > 30 || amount > 1000000) return 'Critique';
        if (delay > 15 || amount > 500000) return 'Élevé';
        return 'Modéré';
    }

    getCalculatedRiskClass(c: any): string {
        const risk = this.getCalculatedRiskLevel(c);
        const map: Record<string, string> = {
            'Critique': 'bg-danger',
            'Élevé': 'bg-warning text-dark',
            'Modéré': 'bg-danger-subtle text-danger',
        };
        return map[risk] || 'bg-secondary';
    }
}

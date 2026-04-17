import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';
import { NgbDropdownModule, NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { RouterLink } from '@angular/router';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';
import { ThemeCssVariableService } from '../../../../../core/services/theme-css-variable.service';
import { MaintenanceService } from '../../../../../core/services/maintenance/maintenance.service';
import { ContractDurationService } from '../../../../../core/services/contract/contract-duration.service';
import { NgxPermissionsModule, NgxPermissionsService } from 'ngx-permissions';
import { AuthService } from '../../../../../core/services/auth/auth.service';

@Component({
    selector: 'app-maintenance-dashboard',
    standalone: true,
    imports: [CommonModule, NgApexchartsModule, NgbDropdownModule, NgbModalModule, RouterLink, FeatherIconDirective, FormsModule, NgSelectModule, NgxPermissionsModule],
    templateUrl: './maintenance-dashboard.component.html',
    styleUrl: './maintenance-dashboard.component.scss'
})
export class MaintenanceDashboardComponent implements OnInit {

    themeCssVariables = inject(ThemeCssVariableService).getThemeCssVariables();
    private maintenanceService = inject(MaintenanceService);
    private durationService = inject(ContractDurationService);
    private cdr = inject(ChangeDetectorRef);
    private modalService = inject(NgbModal);
    private permissionsService = inject(NgxPermissionsService);
    private authService = inject(AuthService);

    loading = false;
    isSavingBudget = false;
    budgetForm = {
        period: new Date().toISOString().substring(0, 7), // "YYYY-MM"
        amount: 200000
    };
    selectedMonth: number = 6;
    monthsList: any[] = [];
    loadingDurations = false;

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
        totalInterventions: 0,
        interventionsThisMonth: 0,
        pendingInterventions: 0,
        completedInterventions: 0,
        avgRepairDays: 0,
        totalCostYTD: 0,
        monthlyCost: 0,
        budgetMonthly: 0,
        activeAlerts: 0,
        criticalAlerts: 0,
        avgCostPerIntervention: 0,
        vehiclesInShop: 0,
    };

    // ===================== INTERVENTIONS RÉCENTES =====================
    recentInterventions: any[] = [];

    // ===================== ALERTS =====================
    accidents: any[] = [];

    // ===================== CHARTS =====================
    public interventionTypeChartOptions: ApexOptions | any;
    public costTrendChartOptions: ApexOptions | any;

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

    onMonthChange(item: any) {
        if (item && typeof item === 'object') {
            this.selectedMonth = item.monthsCount;
        } else if (typeof item === 'number') {
            this.selectedMonth = item;
        }
        this.loadDashboardData();
    }

    loadDashboardData() {
        this.loading = true;
        this.maintenanceService.getDashboardData({ months: this.selectedMonth }).subscribe({
            next: (data: any) => {
                this.stats = data.stats;
                this.recentInterventions = data.recentInterventions || [];
                this.accidents = data.accidents || [];
                this.interventionTypeChartOptions = this.buildInterventionTypeChart(data.distribution || []);
                this.costTrendChartOptions = this.buildCostTrendChart(data.trends || []);
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error fetching dashboard metrics', err);
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }

    openBudgetModal(content: any) {
        this.modalService.open(content, { centered: true, size: 'sm' });
    }

    saveBudget(modal: any) {
        if (!this.budgetForm.period || !this.budgetForm.amount) return;

        this.isSavingBudget = true;
        this.maintenanceService.saveBudget(this.budgetForm).subscribe({
            next: () => {
                this.isSavingBudget = false;
                modal.close();
                this.loadDashboardData(); // Refresh metrics
            },
            error: (err: any) => {
                this.isSavingBudget = false;
            }
        });
    }

    buildInterventionTypeChart(distribution: any[]) {
        const labels = distribution.length > 0 ? distribution.map(d => d.label) : ['Aucun'];
        const series = distribution.length > 0 ? distribution.map(d => d.value) : [0];

        return {
            series: series,
            chart: { type: 'donut', height: 270 },
            labels: labels,
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

    buildCostTrendChart(trends: any[]) {
        const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
        const categories: string[] = [];
        const isYearly = this.selectedMonth > 36;

        const expectedData = trends.map(t => parseFloat(t.expected));
        const paidData = trends.map(t => parseFloat(t.paid));

        trends.forEach(t => {
            if (isYearly) {
                categories.push(t.month); // "YYYY" from backend
            } else {
                // "YYYY-MM" from backend
                const [year, month] = t.month.split('-');
                let label = monthNames[parseInt(month) - 1];
                if (this.selectedMonth > 12) {
                    label += ' ' + year.substring(2);
                }
                categories.push(label);
            }
        });

        return {
            series: [
                { name: 'Coût Réel (FCFA)', data: paidData },
                { name: 'Budget (FCFA)', data: expectedData },
            ],
            chart: { type: 'line', height: 260, toolbar: { show: false } },
            colors: ['#f39c12', '#6c757d'], // Orange pour réel, Gris pour budget
            stroke: { curve: 'smooth', width: [3, 2], dashArray: [0, 5] },
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
            legend: { show: true, position: 'top', fontFamily: this.themeCssVariables.fontFamily },
            dataLabels: { enabled: false },
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

    getSeverityClass(severity: string): string {
        if (!severity) return 'bg-secondary';
        const s = severity.toLowerCase();
        if (s.includes('critique') || s.includes('urgent') || s.includes('danger') || s.includes('haute')) return 'bg-danger';
        if (s.includes('moyenne') || s.includes('attention') || s.includes('warning')) return 'bg-warning text-dark';
        if (s.includes('basse') || s.includes('succès') || s.includes('success')) return 'bg-success';
        return 'bg-secondary';
    }

    formatDelay(days: number): string {
        if (!days || days <= 0) return '0j 0h 0min';

        const totalMinutes = Math.round(days * 24 * 60);
        const d = Math.floor(totalMinutes / (24 * 60));
        const h = Math.floor((totalMinutes % (24 * 60)) / 60);
        const m = totalMinutes % 60;

        let result = '';
        if (d > 0) result += `${d}j `;
        if (h > 0 || d > 0) result += `${h}h `;
        result += `${m}min`;

        return result.trim();
    }
}

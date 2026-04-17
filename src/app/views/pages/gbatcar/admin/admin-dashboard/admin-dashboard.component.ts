import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { RouterLink } from '@angular/router';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';
import { ThemeCssVariableService } from '../../../../../core/services/theme-css-variable.service';
import { DashboardService } from '../../../../../core/services/dashboard/dashboard.service';
import { AdminDashboardData } from '../../../../../core/models/admin-dashboard.model';

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [CommonModule, NgApexchartsModule, NgbDropdownModule, RouterLink, FeatherIconDirective],
    templateUrl: './admin-dashboard.component.html',
    styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {

    themeCssVariables = inject(ThemeCssVariableService).getThemeCssVariables();
    private dashboardService = inject(DashboardService);

    // ===================== DATA =====================
    dashboardData?: AdminDashboardData;
    isLoading = true;

    // ===================== CHARTS =====================
    public auditActionChartOptions: ApexOptions | any;
    public approvalTrendChartOptions: ApexOptions | any;

    ngOnInit(): void {
        this.loadDashboardData();
    }

    loadDashboardData(): void {
        this.isLoading = true;
        this.dashboardService.getAdminDashboardData().subscribe({
            next: (data) => {
                this.dashboardData = data;
                this.auditActionChartOptions = this.buildAuditActionChart(data.auditActionChart);
                this.approvalTrendChartOptions = this.buildApprovalTrendChart(data.approvalTrendChart);
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading admin dashboard data:', err);
                this.isLoading = false;
            }
        });
    }

    buildAuditActionChart(chartData: any) {
        return {
            series: chartData.series, // Création, Encaissement, Modification, Annulation, Suppression
            chart: { type: 'donut', height: 270 },
            labels: chartData.labels,
            colors: ['#3498db', '#2ecc71', '#f39c12', '#e67e22', '#e74c3c'], // Bleu, Vert, Jaune, Orange, Rouge
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
                                label: 'Actions',
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

    buildApprovalTrendChart(chartData: any) {
        return {
            series: [
                { name: 'Approbations Demandées', data: chartData.requested },
                { name: 'Approbations Traitées', data: chartData.processed },
                { name: 'Total Actions Audit', data: chartData.totalActions },
            ],
            chart: { type: 'bar', height: 270, toolbar: { show: false } },
            plotOptions: {
                bar: {
                    horizontal: false,
                    columnWidth: '50%',
                    borderRadius: 4
                },
            },
            dataLabels: { enabled: false },
            stroke: { show: true, width: 2, colors: ['transparent'] },
            colors: ['#f39c12', '#2ecc71', '#3498db'], // Warning for requested, Success for processed, Primary for Total
            xaxis: {
                categories: chartData.collaborators,
                axisBorder: { color: this.themeCssVariables.gridBorder },
            },
            grid: { borderColor: this.themeCssVariables.gridBorder },
            legend: { show: true, position: 'top', fontFamily: this.themeCssVariables.fontFamily },
        };
    }

    getActionClass(action: string): string {
        const map: Record<string, string> = {
            'Création': 'text-primary',
            'Modification': 'text-warning',
            'Suppression': 'text-danger',
            'Annulation': 'text-danger',
            'Encaissement': 'text-success',
            'Validation': 'text-success',
        };
        return map[action] || 'text-secondary';
    }

    getModuleIcon(module: string): string {
        const map: Record<string, string> = {
            'Contrat': 'file-text',
            'Paiement': 'dollar-sign',
            'Maintenance': 'tool',
            'Véhicule': 'truck',
            'Client': 'user',
        };
        return map[module] || 'activity';
    }

    getPriorityClass(priority: string): string {
        const map: Record<string, string> = {
            'critical': 'bg-danger text-white',
            'high': 'bg-warning text-dark',
            'medium': 'bg-primary text-white',
            'low': 'bg-secondary text-white',
        };
        return map[priority] || 'bg-light';
    }
}

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { RouterLink } from '@angular/router';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';
import { ThemeCssVariableService } from '../../../../../core/services/theme-css-variable.service';

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [CommonModule, NgApexchartsModule, NgbDropdownModule, RouterLink, FeatherIconDirective],
    templateUrl: './admin-dashboard.component.html',
    styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {

    themeCssVariables = inject(ThemeCssVariableService).getThemeCssVariables();

    // ===================== KPI DATA (AUDIT FOCUS) =====================
    stats = {
        totalAuditActions: 156,    // Total d'actions tracées aujourd'hui
        pendingApprovals: 8,       // Validations requises en attente
        criticalAnomalies: 2,      // Ex: suppressions suspectes, annulations
        activeCollaborators: 12,   // Nombre d'utilisateurs ayant effectué une action aujourd'hui
    };

    // ===================== TÂCHES ADMINISTRATIVES & APPROBATIONS =====================
    pendingTasks = [
        { id: 'TSK-101', type: 'Validation Contrat', description: 'Remise exceptionnelle de 15% sur CTR-2024-045', requester: 'Jean Dubois', date: 'Il y a 30 min', priority: 'high' },
        { id: 'TSK-102', type: 'Annulation Paiement', description: 'Annulation reçu PAY-2024-089 (Erreur de saisie)', requester: 'Marie Koné', date: 'Il y a 2h', priority: 'critical' },
        { id: 'TSK-103', type: 'Nouveau Véhicule', description: 'Approbation ajout flotte: Toyota Yaris (Nouveau)', requester: 'Moussa Traoré', date: 'Aujourd\'hui, 09:15', priority: 'medium' },
        { id: 'TSK-104', type: 'Frais Maintenance', description: 'Dépassement de budget pour INT-2024-026 (+45k FCFA)', requester: 'Diallo Seydou', date: 'Hier', priority: 'high' },
    ];

    // ===================== JOURNAL D'AUDIT (ACTIONS RÉCENTES) =====================
    auditLogs = [
        { user: 'Koné Moussa', avatar: 'MK', module: 'Contrat', action: 'Création', details: 'Nouveau contrat CTR-2024-098 pour "Soro M."', time: 'Il y a 5 min', status: 'Succès' },
        { user: 'Fatou Sylla', avatar: 'FS', module: 'Paiement', action: 'Encaissement', details: 'Enregistrement de 150.000 FCFA sur CTR-2023-040', time: 'Il y a 15 min', status: 'Succès' },
        { user: 'Jean Dubois', avatar: 'JD', module: 'Véhicule', action: 'Modification', details: 'Changement de statut (Actif -> Atelier) véhicule 1234 AB 01', time: 'Il y a 45 min', status: 'Succès' },
        { user: 'Amadou Coulibaly', avatar: 'AC', module: 'Maintenance', action: 'Suppression', details: 'Suppression de l\'intervention planifiée INT-2024-030', time: 'Il y a 2 heures', status: 'Alerte' },
        { user: 'Marie Koné', avatar: 'MK', module: 'Paiement', action: 'Annulation', details: 'Demande d\'annulation pour double saisie (Reçu 089)', time: 'Il y a 3 heures', status: 'Alerte' },
        { user: 'Koné Moussa', avatar: 'MK', module: 'Client', action: 'Création', details: 'Nouveau dossier locataire: "Ouattara B."', time: 'Il y a 4 heures', status: 'Succès' },
    ];

    // ===================== CHARTS =====================
    public auditActionChartOptions: ApexOptions | any;
    public approvalTrendChartOptions: ApexOptions | any;

    ngOnInit(): void {
        this.auditActionChartOptions = this.buildAuditActionChart();
        this.approvalTrendChartOptions = this.buildApprovalTrendChart();
    }

    buildAuditActionChart() {
        return {
            series: [45, 15, 20, 10, 10], // Création, Encaissement, Modification, Annulation, Suppression
            chart: { type: 'donut', height: 270 },
            labels: ['Création', 'Encaissement', 'Modification', 'Annulation', 'Suppression'],
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

    buildApprovalTrendChart() {
        return {
            series: [
                { name: 'Approbations Demandées', data: [12, 5, 8, 4, 7, 2] },
                { name: 'Approbations Traitées', data: [10, 4, 6, 4, 5, 1] },
                { name: 'Total Actions Audit', data: [65, 45, 52, 38, 55, 15] },
            ],
            chart: { type: 'bar', height: 270, toolbar: { show: false } }, // Changed to bar for categorical data
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
                categories: ['Koné Moussa', 'Fatou Sylla', 'Jean Dubois', 'Amadou C.', 'Marie Koné', 'Diallo S.'],
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

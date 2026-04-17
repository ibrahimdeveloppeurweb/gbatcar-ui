import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AuditLogService } from '../../../../../core/services';
import { AuditLog } from '../../../../../core/models';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule, FeatherIconDirective],
  providers: [DatePipe],
  templateUrl: './audit-log.component.html',
  styleUrls: ['./audit-log.component.scss']
})
export class AuditLogComponent implements OnInit {
  private auditLogService = inject(AuditLogService);

  logs: AuditLog[] = [];
  loading: boolean = false;
  total: number = 0;
  limit: number = 20;
  offset: number = 0;

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    if (this.loading) return;
    this.loading = true;

    this.auditLogService.getAuditLogs(this.limit, this.offset).subscribe({
      next: (res) => {
        this.logs = [...this.logs, ...(res.data || [])];
        this.total = res.total;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  loadMore(): void {
    this.offset += this.limit;
    this.loadLogs();
  }

  exportCSV(): void {
    // Basic CSV export logic directly from loaded data, or can be calling an API endpoint
    if (this.logs.length === 0) return;

    let csv = 'Collaborateur,Module,Action,Détails,Heure\n';
    this.logs.forEach(log => {
      csv += `"${log.userFullName}","${log.module}","${log.action}","${log.details}","${log.createdAt}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'audit_logs.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  getModuleIcon(moduleName: string): string {
    const map: Record<string, string> = {
      'Contrat': 'file-text',
      'Paiement': 'dollar-sign',
      'Véhicule': 'truck',
      'Maintenance': 'tool',
      'Client': 'user',
      'Facturation': 'file-invoice',
      'Pénalité': 'alert-circle',
    };
    return map[moduleName] || 'box';
  }

  getActionClass(action: string): string {
    const actionLower = action?.toLowerCase() || '';

    if (actionLower.includes('création') || actionLower.includes('suppression') || actionLower.includes('annulation') || actionLower.includes('refus')) {
      return 'text-danger fw-bold fs-12px';
    }

    if (actionLower.includes('encaissement') || actionLower.includes('validation') || actionLower.includes('approbation')) {
      return 'text-success fw-bold fs-12px';
    }

    if (actionLower.includes('modification') || actionLower.includes('changement')) {
      return 'text-warning fw-bold fs-12px';
    }

    return 'text-muted fw-bold fs-12px';
  }

  timeAgo(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Il y a quelques secondes';

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Il y a ${minutes} min`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;

    const days = Math.floor(hours / 24);
    if (days < 30) return `Il y a ${days} jour${days > 1 ? 's' : ''}`;

    return date.toLocaleDateString('fr-FR');
  }
}

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';
import { MaintenanceService } from '../../../../../core/services/maintenance/maintenance.service';
import { ApiService } from '../../../../../utils/api.service';

@Component({
  selector: 'app-maintenance-details',
  standalone: true,
  imports: [CommonModule, RouterModule, FeatherIconDirective],
  templateUrl: './maintenance-details.component.html',
  styleUrl: './maintenance-details.component.scss'
})
export class MaintenanceDetailsComponent implements OnInit {

  maintenanceId: string | null = null;
  record: any = null;
  loading = true;
  uploading = false;
  docs: any[] = [];

  private maintenanceService = inject(MaintenanceService);
  private apiService = inject(ApiService);

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.maintenanceId = this.route.snapshot.paramMap.get('id');
    if (this.maintenanceId) {
      this.maintenanceService.getSingle(this.maintenanceId).subscribe({
        next: (res: any) => {
          this.record = res.data ?? res;
          this.docs = this.record?.documents ?? [];
          this.loading = false;
        },
        error: () => { this.loading = false; }
      });
    } else {
      this.loading = false;
    }
  }

  /** Called when user picks files to upload */
  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files.length || !this.record?.uuid) return;
    this.uploading = true;
    this.maintenanceService.uploadDocuments(this.record.uuid, input.files).subscribe({
      next: (res: any) => {
        // Reload the record to get fresh document list
        this.maintenanceService.getSingle(this.record.uuid).subscribe({
          next: (fresh: any) => {
            const r = fresh.data ?? fresh;
            this.docs = r?.documents ?? [];
            this.uploading = false;
          },
          error: () => { this.uploading = false; }
        });
      },
      error: () => { this.uploading = false; }
    });
    // Reset the input so the same file can be re-uploaded if needed
    input.value = '';
  }

  /** Download a document as a Blob */
  downloadDoc(doc: any): void {
    if (!this.record?.uuid) return;
    this.maintenanceService.downloadDocument(this.record.uuid, doc.uuid).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.originalName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      },
      error: () => {
        // Fallback or error message
      }
    });
  }

  /** Delete a document */
  deleteDoc(doc: any): void {
    if (!confirm(`Supprimer "${doc.originalName}" ?`)) return;
    this.maintenanceService.deleteDocument(this.record.uuid, doc.uuid).subscribe({
      next: () => {
        this.docs = this.docs.filter(d => d.uuid !== doc.uuid);
      }
    });
  }

  /** Human-readable file size */
  formatSize(bytes: number): string {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' o';
    if (bytes < 1048576) return Math.round(bytes / 1024) + ' Ko';
    return (bytes / 1048576).toFixed(1) + ' Mo';
  }

  /** Icon by mime type */
  fileIcon(mime: string): string {
    if (!mime) return 'file';
    if (mime.includes('pdf')) return 'file-text';
    if (mime.includes('image')) return 'image';
    if (mime.includes('word') || mime.includes('document')) return 'file-text';
    if (mime.includes('excel') || mime.includes('sheet')) return 'bar-chart-2';
    return 'paperclip';
  }
}

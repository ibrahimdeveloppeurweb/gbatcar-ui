import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { ApiService } from '../../../utils/api.service';
import { NoInternetHelper } from '../../../utils/no-internet-helper';
import { Maintenance, MaintenanceDashboardData } from '../../models/maintenance.model';
import { MaintenanceAlert } from '../../models/maintenance-alert.model';

@Injectable({
    providedIn: 'root'
})
export class MaintenanceService {
    maintenance: Maintenance;
    public edit: boolean = false;
    private url = 'private/maintenance';

    constructor(private api: ApiService) { }

    setMaintenance(maintenance: Maintenance) {
        this.maintenance = maintenance;
    }

    getMaintenance(): Maintenance {
        return this.maintenance;
    }

    add(data: Maintenance): Observable<any> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        if (data.uuid) {
            return this.update(data);
        } else {
            return this.create(data);
        }
    }

    create(data: Maintenance): Observable<any> {
        return this.api._post(`${this.url}/new`, data).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(error))
        );
    }

    update(data: Maintenance): Observable<any> {
        return this.api._post(`${this.url}/${data.uuid}/edit`, data).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(error))
        );
    }

    changeStatus(uuid: string, status: string, date?: string): Observable<any> {
        const payload: any = { status };
        if (date) {
            payload.date = date;
        }
        return this.api._put(`${this.url}/${uuid}/status`, payload).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(error))
        );
    }

    getList(filters?: any): Observable<Maintenance[]> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._get(`${this.url}/`, filters).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(error))
        );
    }

    getSingle(uuid: string): Observable<Maintenance> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._get(`${this.url}/${uuid}/show`).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(error))
        );
    }

    getDelete(uuid: string): Observable<Maintenance> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._delete(`${this.url}/${uuid}/delete`).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(error))
        );
    }

    getDashboardData(filters?: any): Observable<MaintenanceDashboardData> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._get(`${this.url}/dashboard`, filters).pipe(
            map((response: any) => response.data || response),
            catchError((error: any) => throwError(() => error))
        );
    }

    getAlerts(filters?: any): Observable<MaintenanceAlert[]> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        // Adjust the URL if alerts are served from a different endpoint.
        return this.api._get(`${this.url}/alerts`, filters).pipe(
            map((response: any) => response.data || response),
            catchError((error: any) => throwError(() => error))
        );
    }

    uploadDocuments(uuid: string, files: FileList): Observable<any> {
        const formData = new FormData();
        Array.from(files).forEach(f => formData.append('files[]', f, f.name));
        return this.api._post(`${this.url}/${uuid}/documents`, formData).pipe(
            map((res: any) => res),
            catchError((err: any) => throwError(() => err))
        );
    }

    deleteDocument(maintenanceUuid: string, docUuid: string): Observable<any> {
        return this.api._delete(`${this.url}/${maintenanceUuid}/documents/${docUuid}/delete`).pipe(
            map((res: any) => res),
            catchError((err: any) => throwError(() => err))
        );
    }

    getDownloadUrl(maintenanceUuid: string, docUuid: string): string {
        return `${this.url}/${maintenanceUuid}/documents/${docUuid}/download`;
    }

    downloadDocument(maintenanceUuid: string, docUuid: string): Observable<Blob> {
        return this.api._download(this.getDownloadUrl(maintenanceUuid, docUuid));
    }

    saveBudget(data: { period: string, amount: number }): Observable<any> {
        return this.api._post(`${this.url}/budgets/save`, data).pipe(
            map((res: any) => res),
            catchError((err: any) => throwError(() => err))
        );
    }
}

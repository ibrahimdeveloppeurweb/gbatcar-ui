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

    getList(statut?: string, type?: string, vehicleUuid?: string): Observable<Maintenance[]> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._get(`${this.url}/`, { statut, type, vehicleUuid }).pipe(
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
}

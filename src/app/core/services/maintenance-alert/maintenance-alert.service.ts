import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { ApiService } from '../../../utils/api.service';
import { NoInternetHelper } from '../../../utils/no-internet-helper';
import { MaintenanceAlert } from '../../models/maintenance-alert.model';

@Injectable({
    providedIn: 'root'
})
export class MaintenanceAlertService {
    maintenanceAlert: MaintenanceAlert;
    public edit: boolean = false;
    private url = 'private/maintenance/alert';

    constructor(private api: ApiService) { }

    setMaintenanceAlert(maintenanceAlert: MaintenanceAlert) {
        this.maintenanceAlert = maintenanceAlert;
    }

    getMaintenanceAlert(): MaintenanceAlert {
        return this.maintenanceAlert;
    }

    add(data: MaintenanceAlert): Observable<any> {
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

    create(data: MaintenanceAlert): Observable<any> {
        return this.api._post(`${this.url}/new`, data).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(error))
        );
    }

    update(data: MaintenanceAlert): Observable<any> {
        return this.api._post(`${this.url}/${data.uuid}/edit`, data).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(error))
        );
    }

    getList(statut?: string, vehicleUuid?: string): Observable<MaintenanceAlert[]> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._get(`${this.url}/`, { statut, vehicleUuid }).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(error))
        );
    }

    getSingle(uuid: string): Observable<MaintenanceAlert> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._get(`${this.url}/${uuid}/show`).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(error))
        );
    }

    getDelete(uuid: string): Observable<MaintenanceAlert> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._delete(`${this.url}/${uuid}/delete`).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(error))
        );
    }
}

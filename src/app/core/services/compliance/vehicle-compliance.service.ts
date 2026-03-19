import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { ApiService } from '../../../utils/api.service';
import { NoInternetHelper } from '../../../utils/no-internet-helper';
import { VehicleCompliance } from '../../models/vehicle-compliance.model';

@Injectable({
    providedIn: 'root'
})
export class VehicleComplianceService {
    compliance: VehicleCompliance;
    public edit: boolean = false;
    private url = 'private/vehicle-compliance';

    constructor(private api: ApiService) { }

    setCompliance(compliance: VehicleCompliance) {
        this.compliance = compliance;
    }

    getCompliance(): VehicleCompliance {
        return this.compliance;
    }

    add(data: any): Observable<any> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        const uuid = data instanceof FormData ? data.get('uuid') : data.uuid;
        if (uuid) {
            return this.update(data);
        } else {
            return this.create(data);
        }
    }

    create(data: VehicleCompliance | FormData): Observable<any> {
        return this.api._post(`${this.url}/new`, data).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(() => error))
        );
    }

    update(data: any): Observable<any> {
        const uuid = data instanceof FormData ? data.get('uuid') : data.uuid;
        return this.api._post(`${this.url}/${uuid}/edit`, data).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(() => error))
        );
    }

    getList(filters?: any): Observable<VehicleCompliance[]> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._get(`${this.url}/`, filters).pipe(
            map((response: any) => response.data || response),
            catchError((error: any) => throwError(() => error))
        );
    }

    getSingle(uuid: string, filters?: any): Observable<VehicleCompliance> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._get(`${this.url}/${uuid}/show`, filters).pipe(
            map((response: any) => response.data || response),
            catchError((error: any) => throwError(() => error))
        );
    }

    getDelete(uuid: string): Observable<any> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._delete(`${this.url}/${uuid}/delete`).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(() => error))
        );
    }
}

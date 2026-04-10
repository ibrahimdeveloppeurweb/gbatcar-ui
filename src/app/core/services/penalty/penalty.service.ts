import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { ApiService } from '../../../utils/api.service';
import { NoInternetHelper } from '../../../utils/no-internet-helper';
import { Penalty, PenaltyDashboardStats } from '../../models/penalty.model';

@Injectable({
    providedIn: 'root'
})
export class PenaltyService {
    penalty: Penalty;
    public edit: boolean = false;
    private url = 'private/penalty';

    constructor(private api: ApiService) { }

    getAttachmentUrl(path: string): string {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        return `${this.api.url.replace(/\/api$/, '')}${path}`;
    }

    setPenalty(penalty: Penalty) {
        this.penalty = penalty;
    }

    getPenalty(): Penalty {
        return this.penalty;
    }

    add(data: Penalty): Observable<any> {
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

    create(data: Penalty | FormData): Observable<any> {
        return this.api._post(`${this.url}/new`, data).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(() => error))
        );
    }

    update(data: Penalty | FormData): Observable<any> {
        const uuid = data instanceof FormData ? data.get('uuid') : (data as Penalty).uuid;
        return this.api._post(`${this.url}/${uuid}/edit`, data).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(() => error))
        );
    }

    getList(filters?: any): Observable<Penalty[]> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._get(`${this.url}/`, filters).pipe(
            map((response: any) => response.data || response),
            catchError((error: any) => throwError(error))
        );
    }

    getSingle(uuid: string): Observable<Penalty> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._get(`${this.url}/${uuid}/show`).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(error))
        );
    }

    delete(uuid: string): Observable<any> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._delete(`${this.url}/${uuid}/delete`).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(error))
        );
    }

    getDashboardData(filters?: any): Observable<PenaltyDashboardStats> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._get(`${this.url}/dashboard`, filters).pipe(
            map((response: any) => response.data || response),
            catchError((error: any) => throwError(() => error))
        );
    }
}

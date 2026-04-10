import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { ApiService } from '../../../utils/api.service';
import { NoInternetHelper } from '../../../utils/no-internet-helper';

@Injectable({
    providedIn: 'root'
})
export class PaymentScheduleService {
    private url = 'private/payment-schedule';

    constructor(private api: ApiService) { }

    generateSchedule(data: { contractUuid: string, totalAmount: number, installments: number, startDate: string }): Observable<any> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }
        return this.api._post(`${this.url}/generate`, data).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(() => error))
        );
    }

    getList(contractUuid: string): Observable<any> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }
        return this.api._get(`${this.url}/list/${contractUuid}`).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(() => error))
        );
    }

    markOverdue(contractUuid: string): Observable<any> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }
        return this.api._post(`${this.url}/mark-overdue`, { contractUuid }).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(() => error))
        );
    }

    prolong(data: { contractUuid: string, days: number }): Observable<any> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }
        return this.api._post(`${this.url}/prolong`, data).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(() => error))
        );
    }

    suspend(data: { contractUuid: string, suspend: boolean }): Observable<any> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }
        return this.api._post(`${this.url}/suspend`, data).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(() => error))
        );
    }

    calculatePenalties(contractUuid: string): Observable<any> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }
        return this.api._post(`${this.url}/calculate-penalties`, { contractUuid }).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(() => error))
        );
    }
}

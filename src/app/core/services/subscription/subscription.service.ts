import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { ApiService } from '../../../utils/api.service';
import { NoInternetHelper } from '../../../utils/no-internet-helper';
import { Subscription } from '../../models/subscription.model';

@Injectable({
    providedIn: 'root'
})
export class SubscriptionService {
    private url = 'subscription/public';
    private adminUrl = 'private/subscription';

    constructor(private api: ApiService) { }

    /**
     * Submit a new subscription request (public endpoint, no auth required).
     * Sends a multipart FormData to handle file uploads.
     */
    submit(data: FormData): Observable<any> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._post(`${this.url}/new`, data).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(() => error))
        );
    }

    /**
     * Get the list of all submissions (back-office admin use).
     */
    getList(filters?: any): Observable<Subscription[]> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._get(`${this.adminUrl}/`, filters).pipe(
            map((response: any) => response.data || response),
            catchError((error: any) => throwError(() => error))
        );
    }

    /**
     * Get a single subscription by UUID (back-office admin use).
     */
    getSingle(uuid: string): Observable<Subscription> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._get(`${this.adminUrl}/${uuid}/show`).pipe(
            map((response: any) => response.data || response),
            catchError((error: any) => throwError(() => error))
        );
    }

    /**
     * Validate a subscription (back-office admin use).
     */
    validate(uuid: string): Observable<any> {
        return this.api._post(`${this.adminUrl}/${uuid}/validate`, {}).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(() => error))
        );
    }

    /**
     * Reject a subscription (back-office admin use).
     */
    reject(uuid: string, reason?: string): Observable<any> {
        return this.api._post(`${this.adminUrl}/${uuid}/reject`, { reason }).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(() => error))
        );
    }

    /**
     * Delete a subscription (back-office admin use).
     */
    delete(uuid: string): Observable<any> {
        return this.api._delete(`${this.adminUrl}/${uuid}/delete`).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(() => error))
        );
    }
}

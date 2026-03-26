import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { ApiService } from '../../../utils/api.service';
import { NoInternetHelper } from '../../../utils/no-internet-helper';
import { Client, ClientDashboardData } from '../../models/client.model';

@Injectable({
    providedIn: 'root'
})
export class ClientService {
    client: Client;
    public edit: boolean = false;
    private url = 'private/client';

    constructor(private api: ApiService) { }

    setClient(client: Client) {
        this.client = client;
    }

    getClient(): Client {
        return this.client;
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

    create(data: any): Observable<any> {
        return this.api._post(`${this.url}/new`, data).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(error))
        );
    }

    update(data: any): Observable<any> {
        const uuid = data instanceof FormData ? data.get('uuid') : data.uuid;
        return this.api._post(`${this.url}/${uuid}/edit`, data).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(error))
        );
    }

    getList(filters?: any): Observable<Client[]> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._get(`${this.url}/`, filters).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(error))
        );
    }

    getSingle(uuid: string): Observable<Client> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._get(`${this.url}/${uuid}/show`).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(error))
        );
    }

    getDelete(uuid: string): Observable<Client> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._delete(`${this.url}/${uuid}/delete`).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(error))
        );
    }

    getDashboardData(filters?: any): Observable<ClientDashboardData> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._get(`${this.url}/dashboard`, filters).pipe(
            map((response: any) => response.data || response),
            catchError((error: any) => throwError(() => error))
        );
    }

    validate(uuid: string): Observable<any> {
        return this.api._post(`${this.url}/${uuid}/validate`, {}).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(() => error))
        );
    }
}

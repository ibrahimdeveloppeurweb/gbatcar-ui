import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { ApiService } from '../../../utils/api.service';
import { NoInternetHelper } from '../../../utils/no-internet-helper';
import { NotificationMessage, NotificationSetting } from '../../models/notification.model';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    notification: NotificationMessage;
    public edit: boolean = false;
    private url = 'private/extra/settings';

    constructor(private api: ApiService) { }

    setNotification(notification: NotificationMessage) {
        this.notification = notification;
    }

    getNotification(): NotificationMessage {
        return this.notification;
    }

    getSettings(): Observable<{ data: NotificationSetting }> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._get(`${this.url}/notifications`).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(error))
        );
    }

    saveSettings(data: NotificationSetting): Observable<any> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._post(`${this.url}/notifications/update`, data).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(error))
        );
    }

    add(data: NotificationMessage): Observable<any> {
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

    create(data: NotificationMessage): Observable<any> {
        return this.api._post(`private/notification/new`, data).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(error))
        );
    }

    update(data: NotificationMessage): Observable<any> {
        return this.api._post(`private/notification/${data.uuid}/edit`, data).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(error))
        );
    }

    getList(type?: string, lu?: boolean): Observable<NotificationMessage[]> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._get(`private/notification/`, { type, lu }).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(error))
        );
    }

    getSingle(uuid: string): Observable<NotificationMessage> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._get(`private/notification/show`, { uuid: uuid }).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(error))
        );
    }

    getDelete(uuid: string): Observable<NotificationMessage> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._delete(`private/notification/${uuid}/delete`).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(error))
        );
    }
}

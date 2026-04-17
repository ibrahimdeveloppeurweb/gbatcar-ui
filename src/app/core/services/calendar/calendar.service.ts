import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '../../../utils/api.service';
import { NoInternetHelper } from '../../../utils/no-internet-helper';

export interface CalendarEventPayload {
    title: string;
    start: string;
    end?: string;
    allDay?: boolean;
    backgroundColor?: string;
    borderColor?: string;
}

@Injectable({
    providedIn: 'root'
})
export class CalendarService {
    private url = 'private/apps/calendar';

    constructor(private api: ApiService) { }

    getEvents(filters?: any): Observable<any> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._get(`${this.url}`, filters).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(error))
        );
    }

    createEvent(payload: CalendarEventPayload): Observable<any> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._post(this.url, payload).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(error))
        );
    }

    updateEvent(id: string, payload: Partial<CalendarEventPayload>): Observable<any> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._put(`${this.url}/${id}`, payload).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(error))
        );
    }

    deleteEvent(id: string): Observable<any> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._delete(`${this.url}/${id}`).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(error))
        );
    }
}

import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { ApiService } from '../../../utils/api.service';
import { NoInternetHelper } from '../../../utils/no-internet-helper';
import { GbatcarDashboardData } from '../../models/dashboard.model';
import { AdminDashboardData } from '../../models/admin-dashboard.model';

@Injectable({
    providedIn: 'root'
})
export class DashboardService {
    private url = 'private/dashboard';

    constructor(private api: ApiService) { }

    getDashboardData(filters?: any): Observable<GbatcarDashboardData> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        // Passing optional filters (date, periode, etc) via params
        return this.api._get(`${this.url}/main`, filters).pipe(
            map((response: any) => response.data || response),
            catchError((error: any) => throwError(() => error))
        );
    }

    getAdminDashboardData(filters?: any): Observable<AdminDashboardData> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._get(`${this.url}/admin`, filters).pipe(
            map((response: any) => response.data || response),
            catchError((error: any) => throwError(() => error))
        );
    }
}

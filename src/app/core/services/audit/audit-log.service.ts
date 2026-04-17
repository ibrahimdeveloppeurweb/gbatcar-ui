import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { ApiService } from '../../../utils/api.service';
import { NoInternetHelper } from '../../../utils/no-internet-helper';
import { AuditLog } from '../../models/audit-log.model';

@Injectable({
    providedIn: 'root'
})
export class AuditLogService {
    private url = 'private/audit-logs';

    constructor(private api: ApiService) { }

    getAuditLogs(limit: number = 20, offset: number = 0): Observable<{ data: AuditLog[], total: number }> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._get(this.url, { limit, offset }).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(() => error))
        );
    }
}

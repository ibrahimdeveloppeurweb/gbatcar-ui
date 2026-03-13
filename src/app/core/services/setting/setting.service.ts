import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { ApiService } from '../../../utils/api.service';
import { NoInternetHelper } from '../../../utils/no-internet-helper';
import { GlobalSetting } from '../../models/setting.model';

@Injectable({
    providedIn: 'root'
})
export class GeneralSettingService {
    private url = 'private/extra/settings/general';

    constructor(private api: ApiService) { }

    getSettings(): Observable<{ data: GlobalSetting }> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._get(`${this.url}`).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(() => error))
        );
    }

    saveSettings(settings: GlobalSetting): Observable<any> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._post(`${this.url}/update`, settings).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(() => error))
        );
    }
}

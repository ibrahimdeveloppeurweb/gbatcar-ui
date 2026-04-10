import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from '../../../utils/api.service';

@Injectable({
    providedIn: 'root'
})
export class ContractDurationService {
    private url = 'contract-durations';

    constructor(private api: ApiService) { }

    getAll(): Observable<any[]> {
        return this.api._get(this.url).pipe(
            map((response: any) => response.data ?? response),
            catchError((error: any) => throwError(error))
        );
    }

    create(name: string): Observable<any> {
        return this.api._post(this.url, { name }).pipe(
            map((response: any) => response.data ?? response),
            catchError((error: any) => throwError(error))
        );
    }
}

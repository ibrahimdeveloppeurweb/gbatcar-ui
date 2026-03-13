import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { ApiService } from '../../../utils/api.service';
import { NoInternetHelper } from '../../../utils/no-internet-helper';
import { Path } from '../../models/path.model';

@Injectable({
    providedIn: 'root'
})
export class PathService {
    path: Path;
    public edit: boolean = false;
    private url = 'private/admin/path';

    constructor(private api: ApiService) { }

    setPath(path: Path) {
        this.path = path;
    }

    getPath(): Path {
        return this.path;
    }

    getList(type?: string): Observable<Path[]> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._get(`${this.url}/`, { type: type }).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(error))
        );
    }

    getSingle(uuid: string): Observable<Path> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._get(`${this.url}/show`, { uuid: uuid }).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(error))
        );
    }

    getDelete(uuid: string): Observable<Path> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._delete(`${this.url}/${uuid}/delete`).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(error))
        );
    }
}

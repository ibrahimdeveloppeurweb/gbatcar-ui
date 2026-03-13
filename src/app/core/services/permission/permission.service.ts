import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { ApiService } from '../../../utils/api.service';
import { NoInternetHelper } from '../../../utils/no-internet-helper';
import { Permission, Role } from '../../models/permission.model';

@Injectable({
    providedIn: 'root'
})
export class PermissionService {
    role: Role;
    public edit: boolean = false;
    private url = 'private/admin/role';

    constructor(private api: ApiService) { }

    setRole(role: Role) {
        this.role = role;
    }

    getRole(): Role {
        return this.role;
    }

    add(data: Role): Observable<any> {
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

    create(data: Role): Observable<any> {
        return this.api._post(`${this.url}/new`, data).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(error))
        );
    }

    update(data: Role): Observable<any> {
        return this.api._post(`${this.url}/${data.uuid}/edit`, data).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(error))
        );
    }

    getList(): Observable<Role[]> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._get(this.url).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(error))
        );
    }

    getSingle(uuid: string): Observable<Role> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._get(`${this.url}/show`, { uuid: uuid }).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(error))
        );
    }

    getDelete(uuid: string): Observable<any> {
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

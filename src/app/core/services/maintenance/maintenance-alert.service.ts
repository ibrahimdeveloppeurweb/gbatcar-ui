import { Injectable } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { ApiService } from '../../../utils/api.service';
import { NoInternetHelper } from '../../../utils/no-internet-helper';

@Injectable({
  providedIn: 'root'
})
export class MaintenanceAlertService {
  private url = 'private/maintenance/alert';

  constructor(private api: ApiService) { }

  getList(filters: any = {}): Observable<any[]> {
    if (!navigator.onLine) {
      NoInternetHelper.internet();
      return new Observable(obs => { obs.next([]); obs.complete(); });
    }
    return this.api._get(`${this.url}/`, filters).pipe(
      map((response: any) => response.data || response),
      catchError((error: any) => throwError(() => error))
    );
  }

  getSingle(uuid: string): Observable<any> {
    if (!navigator.onLine) {
      NoInternetHelper.internet();
      return new Observable(obs => { obs.next(null); obs.complete(); });
    }
    return this.api._get(`${this.url}/${uuid}/show`).pipe(
      map((response: any) => response.data || response),
      catchError((error: any) => throwError(() => error))
    );
  }

  add(data: any): Observable<any> {
    if (!navigator.onLine) {
      NoInternetHelper.internet();
      return new Observable(obs => { obs.next(); obs.complete(); });
    }
    const uuid = data instanceof FormData ? data.get('uuid') : data.uuid;
    if (uuid) {
      return this.api._post(`${this.url}/${uuid}/edit`, data).pipe(
        map((response: any) => response),
        catchError((error: any) => throwError(() => error))
      );
    } else {
      return this.api._post(`${this.url}/new`, data).pipe(
        map((response: any) => response),
        catchError((error: any) => throwError(() => error))
      );
    }
  }

  changeStatus(uuid: string, status: string): Observable<any> {
    if (!navigator.onLine) {
      NoInternetHelper.internet();
      return new Observable(obs => { obs.next(); obs.complete(); });
    }
    return this.api._post(`${this.url}/${uuid}/status`, { status }).pipe(
      map((response: any) => response),
      catchError((error: any) => throwError(() => error))
    );
  }

  invoice(uuid: string, payer: string): Observable<any> {
    if (!navigator.onLine) {
      NoInternetHelper.internet();
      return new Observable(obs => { obs.next(); obs.complete(); });
    }
    return this.api._post(`${this.url}/${uuid}/invoice`, { payer }).pipe(
      map((response: any) => response),
      catchError((error: any) => throwError(() => error))
    );
  }


  delete(uuid: string): Observable<any> {
    if (!navigator.onLine) {
      NoInternetHelper.internet();
      return new Observable(obs => { obs.next(); obs.complete(); });
    }
    return this.api._delete(`${this.url}/${uuid}/delete`).pipe(
      map((response: any) => response),
      catchError((error: any) => throwError(() => error))
    );
  }

  getDashboardData(): Observable<any> {
    if (!navigator.onLine) {
      NoInternetHelper.internet();
      return new Observable(obs => { obs.next({}); obs.complete(); });
    }
    return this.api._get(`${this.url}/dashboard`).pipe(
      map((response: any) => response.data || response),
      catchError((error: any) => throwError(() => error))
    );
  }
}

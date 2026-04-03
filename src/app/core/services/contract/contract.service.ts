import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { ApiService } from '../../../utils/api.service';
import { NoInternetHelper } from '../../../utils/no-internet-helper';
import { Contract, ContractDashboardData } from '../../models/contract.model';

@Injectable({
    providedIn: 'root'
})
export class ContractService {
    contract: Contract;
    public edit: boolean = false;
    private url = 'private/contract';

    constructor(private api: ApiService) { }

    setContract(contract: Contract) {
        this.contract = contract;
    }

    getContract(): Contract {
        return this.contract;
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

    getList(filters?: any): Observable<Contract[]> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._get(`${this.url}/`, filters).pipe(
            map((response: any) => response.data || response),
            catchError((error: any) => throwError(error))
        );
    }

    getSingle(uuid: string): Observable<Contract> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._get(`${this.url}/${uuid}/show`).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(error))
        );
    }

    getDelete(uuid: string): Observable<Contract> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._delete(`${this.url}/${uuid}/delete`).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(error))
        );
    }

    getDashboardData(filters?: any): Observable<ContractDashboardData> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._get(`${this.url}/dashboard`, filters).pipe(
            map((response: any) => response.data || response),
            catchError((error: any) => throwError(() => error))
        );
    }

    getLateContracts(filters?: any): Observable<Contract[]> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._get(`${this.url}/late`, filters).pipe(
            map((response: any) => response.data || response),
            catchError((error: any) => throwError(() => error))
        );
    }

    uploadDocument(uuid: string, formData: FormData): Observable<any> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._post(`${this.url}/${uuid}/documents`, formData).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(() => error))
        );
    }

    downloadDocument(contractUuid: string, documentUuid: string, forceDownload: boolean = true): void {
        const urlOptions = {
            responseType: 'blob' as 'json'
        };
        this.api._get(`${this.url}/${contractUuid}/documents/${documentUuid}/download`, {}, urlOptions).subscribe({
            next: (response: any) => {
                const blob = new Blob([response.body || response], { type: response.type || 'application/pdf' });
                const url = window.URL.createObjectURL(blob);

                if (forceDownload) {
                    // Extract filename from Content-Disposition header if possible, else use a fallback
                    let filename = 'document.pdf';
                    const disposition = response.headers ? response.headers.get('Content-Disposition') : null;
                    if (disposition && disposition.indexOf('attachment') !== -1) {
                        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
                        if (matches != null && matches[1]) {
                            filename = matches[1].replace(/['"]/g, '');
                        }
                    }

                    const a = document.createElement('a');
                    a.href = url;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                } else {
                    window.open(url, '_blank');
                }
            },
            error: (error) => {
                console.error('Download error:', error);
            }
        });
    }

    deleteDocument(contractUuid: string, documentUuid: string): Observable<any> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._delete(`${this.url}/${contractUuid}/documents/${documentUuid}/delete`).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(() => error))
        );
    }

    validate(uuid: string): Observable<any> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._post(`${this.url}/${uuid}/validate`, {}).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(() => error))
        );
    }

    terminate(uuid: string): Observable<any> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._post(`${this.url}/${uuid}/terminate`, {}).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(() => error))
        );
    }

    rupture(uuid: string): Observable<any> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._post(`${this.url}/${uuid}/rupture`, {}).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(() => error))
        );
    }

    addPromise(contractUuid: string, data: any): Observable<any> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._post(`${this.url}/${contractUuid}/promises/new`, data).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(() => error))
        );
    }
}

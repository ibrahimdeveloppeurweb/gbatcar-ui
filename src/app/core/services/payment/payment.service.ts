import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { ApiService } from '../../../utils/api.service';
import { NoInternetHelper } from '../../../utils/no-internet-helper';
import { Payment, PaymentDashboardData } from '../../models/payment.model';

@Injectable({
    providedIn: 'root'
})
export class PaymentService {
    payment: Payment;
    public edit: boolean = false;
    private url = 'private/payment';

    constructor(private api: ApiService) { }

    setPayment(payment: Payment) {
        this.payment = payment;
    }

    getPayment(): Payment {
        return this.payment;
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

    getList(filters: any = {}): Observable<Payment[]> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._get(`${this.url}/`, filters).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(error))
        );
    }

    getSingle(uuid: string): Observable<Payment> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._get(`${this.url}/${uuid}/show`).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(error))
        );
    }

    getDelete(uuid: string): Observable<Payment> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._delete(`${this.url}/${uuid}/delete`).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(error))
        );
    }

    getDashboardData(filters?: any): Observable<PaymentDashboardData> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._get(`${this.url}/dashboard`, filters).pipe(
            map((response: any) => response.data || response),
            catchError((error: any) => throwError(() => error))
        );
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

    downloadDocument(paymentUuid: string, docUuid: string): void {
        const urlOptions = {
            responseType: 'blob' as 'json'
        };
        this.api._get(`${this.url}/${paymentUuid}/documents/${docUuid}/download`, {}, urlOptions).subscribe({
            next: (response: any) => {
                const blob = new Blob([response.body || response], { type: response.type });
                const url = window.URL.createObjectURL(blob);

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
            },
            error: (error) => {
                console.error('Download error:', error);
            }
        });
    }

    deleteDocument(paymentUuid: string, docUuid: string): Observable<any> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }
        return this.api._delete(`${this.url}/${paymentUuid}/documents/${docUuid}/delete`).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(() => error))
        );
    }
}

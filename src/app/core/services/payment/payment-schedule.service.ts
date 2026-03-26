import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class PaymentScheduleService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.serverUrl}/private/payment-schedule`;

    generateSchedule(data: { contractUuid: string, totalAmount: number, installments: number, startDate: string }): Observable<any> {
        return this.http.post(`${this.apiUrl}/generate`, data);
    }

    getList(contractUuid: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/list/${contractUuid}`);
    }

    markOverdue(): Observable<any> {
        return this.http.post(`${this.apiUrl}/mark-overdue`, {});
    }
}

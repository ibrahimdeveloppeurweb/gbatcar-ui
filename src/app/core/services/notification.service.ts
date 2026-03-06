import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface NotificationSetting {
    id?: number;
    autoSendSms: boolean;
    autoSendEmail: boolean;
    autoSendWhatsapp: boolean;
    enablePushNotifications: boolean;
    smsTemplateWelcome: string;
    smsTemplateLatePayment: string;
    smsTemplateMaintenance: string;
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {

    private apiUrl = `${environment.serverUrl}/private/extra/settings`;

    constructor(private http: HttpClient) { }

    getSettings(): Observable<{ data: NotificationSetting }> {
        return this.http.get<{ data: NotificationSetting }>(`${this.apiUrl}/notifications`);
    }

    saveSettings(data: NotificationSetting): Observable<any> {
        return this.http.post(`${this.apiUrl}/notifications/update`, data);
    }
}

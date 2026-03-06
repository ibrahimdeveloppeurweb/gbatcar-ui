import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class GeneralSettingService {
    private apiUrl = `${environment.serverUrl}/private/extra/settings/general`;

    constructor(private http: HttpClient) { }

    getSettings(): Observable<any> {
        return this.http.get(`${this.apiUrl}`);
    }

    saveSettings(settings: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/update`, settings);
    }
}

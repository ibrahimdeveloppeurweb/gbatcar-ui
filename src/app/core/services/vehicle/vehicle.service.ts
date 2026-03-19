import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { ApiService } from '../../../utils/api.service';
import { NoInternetHelper } from '../../../utils/no-internet-helper';
import { Vehicle, VehicleDashboardData } from '../../models/vehicle.model';

@Injectable({
    providedIn: 'root'
})
export class VehicleService {
    vehicle: Vehicle;
    public edit: boolean = false;
    private url = 'private/vehicle';

    constructor(private api: ApiService) { }

    setVehicle(vehicle: Vehicle) {
        this.vehicle = vehicle;
    }

    getVehicle(): Vehicle {
        return this.vehicle;
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

    create(data: Vehicle | FormData): Observable<any> {
        return this.api._post(`${this.url}/new`, data).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(error))
        );
    }

    update(data: any): Observable<any> {
        return this.api._post(`${this.url}/${data instanceof FormData ? data.get('uuid') : data.uuid}/edit`, data).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(error))
        );
    }

    getList(filters?: any): Observable<Vehicle[]> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._get(`${this.url}/`, filters).pipe(
            map((response: any) => response.data || response),
            catchError((error: any) => throwError(error))
        );
    }

    getCatalog(filters?: any): Observable<Vehicle[]> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._get(`${this.url}/catalog`, filters).pipe(
            map((response: any) => response.data || response),
            catchError((error: any) => throwError(() => error))
        );
    }

    getSingle(uuid: string): Observable<Vehicle> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._get(`${this.url}/${uuid}/show`).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(error))
        );
    }

    getDelete(uuid: string): Observable<Vehicle> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._delete(`${this.url}/${uuid}/delete`).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(error))
        );
    }

    getDashboardData(filters?: any): Observable<VehicleDashboardData> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._get(`${this.url}/dashboard`, filters).pipe(
            map((response: any) => response.data || response),
            catchError((error: any) => throwError(() => error))
        );
    }

    getCompliance(filters?: any): Observable<Vehicle[]> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._get(`${this.url}/compliance`, filters).pipe(
            map((response: any) => response.data || response),
            catchError((error: any) => throwError(() => error))
        );
    }

    getBrandImages(brand: string): Observable<string[]> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        return this.api._get(`${this.url}/brand-images/${brand}`).pipe(
            map((response: any) => response.data || []),
            catchError((error: any) => throwError(() => error))
        );
    }

    uploadBrandImage(brand: string, file: File): Observable<{ message: string, url: string }> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }

        const formData = new FormData();
        formData.append('file', file);

        return this.api._post(`${this.url}/brand-images/${brand}`, formData).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(() => error))
        );
    }

    setCoverImage(vehicleId: string, photo: string): Observable<any> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }
        return this.api._put(`${this.url}/${vehicleId}/cover-image`, { photo }).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(() => error))
        );
    }

    removeGalleryImage(vehicleId: string, photo: string): Observable<any> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }
        return this.api._delete(`${this.url}/${vehicleId}/photo`, { params: { photo } }).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(() => error))
        );
    }
}

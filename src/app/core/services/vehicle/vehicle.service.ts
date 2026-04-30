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
    private publicUrl = 'public/vehicles';

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

    reserve(uuid: string, reservedBy: string): Observable<any> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }
        return this.api._post(`${this.url}/${uuid}/reserve`, { reservedBy }).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(() => error))
        );
    }

    updateStatus(uuid: string, status: string): Observable<any> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }
        return this.api._put(`${this.url}/${uuid}/status`, { status }).pipe(
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

    getBrands(): Observable<any[]> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }
        return this.api._get('private/brand/').pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(() => error))
        );
    }

    addBrand(name: string): Observable<any> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }
        return this.api._post('private/brand/new', { name }).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(() => error))
        );
    }

    getModels(brandId?: number): Observable<any[]> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }
        const params = brandId ? { brandId } : {};
        return this.api._get('private/vehicle-model/', params).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(() => error))
        );
    }

    addModel(brandId: number, name: string): Observable<any> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }
        return this.api._post('private/vehicle-model/new', { brand: brandId, name }).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(() => error))
        );
    }

    getPublicCatalog(): Observable<any[]> {
        return this.api._get(this.publicUrl).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(() => error))
        );
    }

    deleteBrand(id: number): Observable<any> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }
        return this.api._delete(`private/brand/${id}/delete`).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(() => error))
        );
    }

    deleteModel(id: number): Observable<any> {
        if (!navigator.onLine) {
            NoInternetHelper.internet();
            return new Observable(obs => { obs.next(); obs.complete(); });
        }
        return this.api._delete(`private/vehicle-model/${id}/delete`).pipe(
            map((response: any) => response),
            catchError((error: any) => throwError(() => error))
        );
    }
}

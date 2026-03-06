import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from '../services/auth.service';

/**
 * jwtInterceptor — Ajoute automatiquement le JWT Bearer Token
 * dans l'en-tête Authorization de toutes les requêtes HTTP sortantes.
 */
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
    const auth = inject(AuthService);
    const token = auth.getToken();

    if (token) {
        const clonedReq = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
        return next(clonedReq);
    }

    return next(req);
};

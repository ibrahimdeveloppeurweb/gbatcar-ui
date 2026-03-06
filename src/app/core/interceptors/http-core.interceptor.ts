import { HttpInterceptorFn } from '@angular/common/http';

/**
 * HttpCoreInterceptor — Ajoute le header Content-Type: application/json
 * sur toutes les requêtes HTTP (sauf les requêtes multipart/form-data).
 */
export const httpCoreInterceptor: HttpInterceptorFn = (req, next) => {
    // Ne pas écraser le Content-Type pour les uploads de fichiers (FormData)
    if (req.body instanceof FormData) {
        return next(req);
    }

    const clonedReq = req.clone({
        setHeaders: {
            'Content-Type': 'application/json',
        }
    });

    return next(clonedReq);
};

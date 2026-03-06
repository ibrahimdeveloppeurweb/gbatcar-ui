import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';

// Variable globale à ce module pour compter les requêtes actives
let activeRequests = 0;

export const loaderInterceptor: HttpInterceptorFn = (req, next) => {
    const spinner = inject(NgxSpinnerService);

    activeRequests++;
    if (activeRequests === 1) {
        spinner.show();
    }

    return next(req).pipe(
        finalize(() => {
            activeRequests = Math.max(0, activeRequests - 1);
            if (activeRequests === 0) {
                spinner.hide();
            }
        })
    );
};

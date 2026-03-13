import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { AuthService } from '../services/auth/auth.service';

/**
 * handlerErrorInterceptor — Intercepte les réponses HTTP pour :
 * - Afficher des toasts de succès (200/201) si le body contient un `message`.
 * - Gérer les erreurs HTTP (400, 401 → déconnexion ; 422 → erreurs de validation ; 500 → erreur serveur).
 */
export const handlerErrorInterceptor: HttpInterceptorFn = (req, next) => {
    const router = inject(Router);
    const auth = inject(AuthService);

    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 6000,
        timerProgressBar: true
    });

    return next(req).pipe(
        tap({
            next: (event) => {
                if (event instanceof HttpResponse) {
                    // ── Succès avec message ───────────────────────────────────────────
                    const body = event.body as any;
                    if ((event.status === 200 || event.status === 201) && body?.message?.trim()) {
                        Toast.fire({
                            icon: 'success',
                            title: 'Opération réussie',
                            text: body.message
                        });
                    }
                }
            },
            error: (response: HttpErrorResponse) => {
                switch (response.status) {

                    // ── Déconnexion ─────────────────────────────────────────────────
                    case 400:
                    case 401: {
                        Toast.fire({
                            icon: 'warning',
                            title: 'Session expirée',
                            text: 'Vous avez été déconnecté. Veuillez vous reconnecter.'
                        });
                        auth.logout();
                        break;
                    }

                    // ── Accès refusé ────────────────────────────────────────────────
                    case 402:
                    case 403: {
                        const msg402 = response.error?.errors?.msg ?? 'Accès refusé à cette ressource.';
                        Swal.fire({
                            icon: 'warning',
                            title: 'Accès Refusé',
                            text: msg402,
                            showConfirmButton: true,
                            confirmButtonText: 'OK'
                        });
                        break;
                    }

                    // ── Ressource introuvable ────────────────────────────────────────
                    case 404: {
                        Toast.fire({
                            icon: 'info',
                            title: 'Introuvable',
                            text: response.statusText || 'La ressource demandée est introuvable.'
                        });
                        break;
                    }

                    // ── Erreur de validation ─────────────────────────────────────────
                    case 422: {
                        const errors = response.error?.errors ?? response.error;
                        const msg422 = errors?.msg ?? errors?.detail ?? 'Veuillez vérifier les informations saisies.';
                        Toast.fire({
                            icon: 'warning',
                            title: 'Données invalides',
                            text: Array.isArray(msg422) ? msg422.join(', ') : msg422
                        });
                        break;
                    }

                    // ── Erreur serveur ───────────────────────────────────────────────
                    case 500: {
                        const serverErrors = response.error?.errors;
                        let msg500 = 'Une erreur est survenue au niveau du serveur. Veuillez réessayer.';
                        if (serverErrors && !Array.isArray(serverErrors)) {
                            msg500 = Object.values(serverErrors).join(', ');
                        }
                        Toast.fire({
                            icon: 'error',
                            title: 'Erreur serveur',
                            text: msg500
                        });
                        break;
                    }

                    // ── Autres erreurs ───────────────────────────────────────────────
                    default: {
                        Toast.fire({
                            icon: 'error',
                            title: 'Erreur',
                            text: 'Une erreur inattendue est survenue.'
                        });
                    }
                }
            }
        })
    );
};

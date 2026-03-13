import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

/**
 * Ce guard empêche un utilisateur DÉJÀ CONNECTÉ d'accéder
 * aux pages de type "Login", "Register", etc.
 * S'il est connecté, on le redirige vers le dashboard ou l'URL demandée.
 */
export const noAuthGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const router = inject(Router);
    const auth = inject(AuthService);

    if (!auth.isLoggedIn()) {
        // Non connecté => a le droit d'accéder aux pages de login
        return true;
    }

    // Déjà connecté => redirection vers le dashboard ou l'url d'origine
    const redirectUrl = route.queryParams['returnUrl'] || '/gbatcar/dashboard';
    router.navigateByUrl(redirectUrl);

    return false;
};

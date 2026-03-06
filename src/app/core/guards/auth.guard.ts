import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const router = inject(Router);
  const auth = inject(AuthService);

  if (auth.isLoggedIn()) {
    return true;
  }

  // Non connecté → redirection vers /auth/login avec l'URL de retour
  router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url.split('?')[0] } });
  return false;
};

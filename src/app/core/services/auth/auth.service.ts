import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

const TOKEN_KEY = 'gbatcar_session';
const PERMS_KEY = 'gbatcar_permissions';

export interface UserSession {
    uuid: string;
    nom: string;
    firstname: string;
    email: string;
    telephone: string;
    username: string;
    photo: string | null;
    role: string;
    token: string;
    refreshToken: string;
    isFirstUser: boolean;
    lastLogin: string | null;
    permissions: string[];
}

export interface LoginPayload {
    username: string;
    password: string;
}

export interface ForgotPayload {
    email: string;
}

export interface ChangePasswordPayload {
    actuel: string;
    new: string;
    confirme: string;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    private apiUrl = environment.serverUrl;

    constructor(
        private http: HttpClient,
        private router: Router
    ) { }

    // ── Authentification ───────────────────────────────────────────────────────

    /**
     * Connexion à la plateforme d'administration GbatCar.
     * POST /api/login { username, password, type: "ADMIN" }
     */
    login(data: LoginPayload): Observable<any> {
        const body = { ...data, type: 'ADMIN' };
        return this.http.post(`${this.apiUrl}/login`, body).pipe(
            map((res: any) => {
                if (res?.data) {
                    this.saveDataToken(res.data);
                }
                return res;
            }),
            catchError((err) => throwError(() => err))
        );
    }

    /**
   * Déconnexion.
   * POST /api/logout { refreshToken, user }
   */
    logout(): void {
        const session = this.getDataToken();
        if (session) {
            const body = { refreshToken: session.refreshToken, user: session.uuid };
            this.http.post(`${this.apiUrl}/logout`, body).subscribe({
                complete: () => this.clearSession(),
                error: () => this.clearSession() // Forcer la purge même si le token côté serveur est déjà invalide
            });
        } else {
            this.clearSession();
        }
    }

    /**
     * Mot de passe oublié.
     * POST /api/forgot { email }
     */
    forgot(data: ForgotPayload): Observable<any> {
        return this.http.post(`${this.apiUrl}/forgot`, data).pipe(
            map((res: any) => res),
            catchError((err) => throwError(() => err))
        );
    }

    /**
     * Modification du mot de passe par l'utilisateur connecté.
     * POST /api/private/security/edit/password
     */
    editPassword(data: ChangePasswordPayload): Observable<any> {
        return this.http.post(`${this.apiUrl}/private/security/edit/password`, data).pipe(
            map((res: any) => res),
            catchError((err) => throwError(() => err))
        );
    }

    /**
     * Réinitialisation du mot de passe par un admin.
     * POST /api/private/security/reset/password
     */
    resetPassword(data: { user: string; new: string }): Observable<any> {
        return this.http.post(`${this.apiUrl}/private/security/reset/password`, data).pipe(
            map((res: any) => res),
            catchError((err) => throwError(() => err))
        );
    }

    // ── Gestion de session (localStorage) ────────────────────────────────────

    saveDataToken(data: UserSession): void {
        localStorage.setItem(TOKEN_KEY, JSON.stringify(data));
        localStorage.setItem(PERMS_KEY, JSON.stringify(data.permissions ?? []));
    }

    getDataToken(): UserSession | null {
        const raw = localStorage.getItem(TOKEN_KEY);
        return raw ? (JSON.parse(raw) as UserSession) : null;
    }

    getToken(): string | null {
        return this.getDataToken()?.token ?? null;
    }

    getRole(): string | null {
        return this.getDataToken()?.role ?? null;
    }

    getPermissions(): string[] {
        const raw = localStorage.getItem(PERMS_KEY);
        return raw ? JSON.parse(raw) : [];
    }

    isLoggedIn(): boolean {
        return !!this.getToken();
    }

    hasPermission(permission: string): boolean {
        return this.getPermissions().includes(permission);
    }

    removeDataToken(): void {
        localStorage.removeItem(TOKEN_KEY);
    }

    removePermissionToken(): void {
        localStorage.removeItem(PERMS_KEY);
    }

    clearSession(): void {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(PERMS_KEY);
        this.router.navigate(['/auth/login']);
    }
}

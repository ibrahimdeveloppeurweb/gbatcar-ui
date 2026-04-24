import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgxPermissionsModule, NgxPermissionsService } from 'ngx-permissions';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { ThemeModeService } from '../../../core/services/theme-mode.service';
import { AuthService, UserSession } from '../../../core/services/auth/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    NgbDropdownModule,
    RouterLink,
    NgxPermissionsModule
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit {

  currentTheme: string;
  currentUser: UserSession | null = null;

  constructor(
    private router: Router,
    private themeModeService: ThemeModeService,
    private auth: AuthService,
    private permissionsService: NgxPermissionsService
  ) { }

  ngOnInit(): void {
    // Charger les permissions dans le service
    const permissions = this.auth.getPermissions();
    this.permissionsService.loadPermissions(permissions);

    // Récupérer l'utilisateur connecté depuis la session
    this.currentUser = this.auth.getDataToken();

    this.themeModeService.currentTheme.subscribe((theme) => {
      this.currentTheme = theme;
      this.showActiveTheme(this.currentTheme);
    });
  }

  showActiveTheme(theme: string) {
    const themeSwitcher = document.querySelector('#theme-switcher') as HTMLInputElement;
    const box = document.querySelector('.box') as HTMLElement;
    if (!themeSwitcher) return;
    if (theme === 'dark') {
      themeSwitcher.checked = true;
      box.classList.remove('light');
      box.classList.add('dark');
    } else {
      themeSwitcher.checked = false;
      box.classList.remove('dark');
      box.classList.add('light');
    }
  }

  onThemeCheckboxChange(e: Event) {
    const checkbox = e.target as HTMLInputElement;
    const newTheme: string = checkbox.checked ? 'dark' : 'light';
    this.themeModeService.toggleTheme(newTheme);
    this.showActiveTheme(newTheme);
  }

  toggleSidebar(e: Event) {
    e.preventDefault();
    document.body.classList.add('sidebar-open');
    document.querySelector('.sidebar .sidebar-toggler')?.classList.add('active');
  }

  /**
   * Déconnexion : appelle le backend puis vide la session
   */
  onLogout(e: Event): void {
    e.preventDefault();
    this.auth.logout();
  }

  /**
   * Retourne le nom complet de l'utilisateur connecté
   */
  get userName(): string {
    if (!this.currentUser) return 'Utilisateur';
    return `${this.currentUser.firstname ?? ''} ${this.currentUser.nom ?? ''}`.trim() || 'Utilisateur';
  }

  /**
   * Retourne l'email de l'utilisateur connecté
   */
  get userEmail(): string {
    return this.currentUser?.email ?? '';
  }

  /**
   * Retourne la photo de profil ou une image par défaut
   */
  get userPhoto(): string {
    return this.currentUser?.photo ?? 'https://placehold.co/80x80';
  }

  /**
   * Retourne la photo miniature (30x30) pour la navbar
   */
  get userPhotoSmall(): string {
    return this.currentUser?.photo ?? 'https://placehold.co/30x30';
  }
}

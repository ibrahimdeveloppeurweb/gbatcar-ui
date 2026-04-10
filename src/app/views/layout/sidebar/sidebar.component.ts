import { DOCUMENT, NgClass, NgIf, NgFor } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Inject, OnInit, Renderer2, ViewChild, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';

import { NgScrollbar } from 'ngx-scrollbar';
import MetisMenu from 'metismenujs';

import { MENU } from './menu';
import { MenuItem } from './menu.model';

import { FeatherIconDirective } from '../../../core/feather-icon/feather-icon.directive';
import { ThemeModeService } from '../../../core/services/theme-mode.service';
import { PathService } from '../../../core/services/path/path.service';
import { AuthService } from '../../../core/services/auth/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    NgScrollbar,
    NgClass,
    NgIf,
    NgFor,
    FeatherIconDirective,
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('sidebarToggler') sidebarToggler: ElementRef;

  menuItems: MenuItem[] = [];
  @ViewChild('sidebarMenu') sidebarMenu: ElementRef;

  currentTheme: string;
  private metisMenuInstance: any;
  private permissionsSubscription: Subscription;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private renderer: Renderer2,
    private router: Router,
    private themeModeService: ThemeModeService,
    private pathService: PathService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.themeModeService.currentTheme.subscribe((theme) => {
      this.currentTheme = theme;
    });

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        if (window.matchMedia('(max-width: 991px)').matches) {
          this.document.body.classList.remove('sidebar-open');
        }
        this._activateMenuDropdown();
      }
    });
  }

  ngOnInit(): void {
    this.permissionsSubscription = this.authService.getPermissionsObservable().subscribe(permissions => {
      const menuClone = JSON.parse(JSON.stringify(MENU));
      this.menuItems = this.cleanupEmptyTitles(this.filterMenu(menuClone, permissions));
      this.cdr.detectChanges();

      // Delai pour laisser Angular injecter les éléments dans le DOM
      setTimeout(() => {
        this.initMetisMenu();
      }, 200);
    });

    const desktopMedium = window.matchMedia('(min-width:992px) and (max-width: 1199px)');
    desktopMedium.addEventListener('change', () => {
      this.iconSidebar(desktopMedium);
    });
    this.iconSidebar(desktopMedium);
  }

  ngOnDestroy(): void {
    if (this.permissionsSubscription) {
      this.permissionsSubscription.unsubscribe();
    }
    if (this.metisMenuInstance) {
      // Tenter de nettoyer l'instance si supporté
      this.metisMenuInstance = null;
    }
  }

  filterMenu(items: MenuItem[], permissions: string[]): MenuItem[] {
    return items.filter(item => {
      if (item.isTitle) return true;
      let hasAccess = item.nom ? permissions.includes(item.nom) : false;
      if (item.subItems && item.subItems.length > 0) {
        item.subItems = this.filterMenu(item.subItems, permissions);
        if (item.subItems.length > 0) hasAccess = true;
      }
      return hasAccess;
    });
  }

  cleanupEmptyTitles(menu: MenuItem[]): MenuItem[] {
    return menu.filter((item, index, array) => {
      if (item.isTitle) {
        for (let i = index + 1; i < array.length; i++) {
          if (array[i].isTitle) break;
          return true;
        }
        return false;
      }
      return true;
    });
  }

  ngAfterViewInit() {
    this.initMetisMenu();
  }

  private initMetisMenu() {
    if (this.sidebarMenu && this.sidebarMenu.nativeElement) {
      // On NE RE-INITIALISE PAS MetisMenu si l'instance existe déjà, 
      // car cela casse les écouteurs d'événements (click).
      // On laisse MetisMenu gérer le DOM existant.
      if (!this.metisMenuInstance) {
        this.metisMenuInstance = new MetisMenu(this.sidebarMenu.nativeElement);
      }

      this._activateMenuDropdown();
    }
  }

  _activateMenuDropdown() {
    // On utilise un petit timeout pour s'assurer que le marquage des classes se fait sur un DOM stable
    setTimeout(() => {
      this.resetMenuItems();
      this.activateMenuItems();
      this.cdr.detectChanges();
    }, 50);
  }

  resetMenuItems() {
    const links = document.querySelectorAll('.nav-link-ref, .nav-link');
    links.forEach(el => {
      el.classList.remove('mm-active');
      el.setAttribute('aria-expanded', 'false');
    });
    const subMenus = document.querySelectorAll('.sub-menu');
    subMenus.forEach(el => {
      el.classList.remove('mm-show');
      el.setAttribute('aria-expanded', 'false');
      // Ne pas toucher au display style pour laisser MetisMenu gérer
    });
    const items = document.querySelectorAll('.nav-item');
    items.forEach(el => el.classList.remove('mm-active'));
  }

  activateMenuItems() {
    const links: any = document.querySelectorAll('.nav-link-ref');
    let menuItemEl = null;
    const currentPath = this.router.url.split('?')[0];

    for (let i = 0; i < links.length; i++) {
      const path = links[i]['pathname'];
      if (currentPath === path || (path !== '/gbatcar/dashboard' && currentPath.startsWith(path))) {
        menuItemEl = links[i];
        break;
      }
    }

    if (menuItemEl) {
      menuItemEl.classList.add('mm-active');
      let parentEl = menuItemEl.parentElement;

      while (parentEl) {
        if (parentEl.tagName === 'LI') {
          parentEl.classList.add('mm-active');
          const anchor = parentEl.querySelector(':scope > a');
          if (anchor) {
            anchor.classList.add('mm-active');
            anchor.setAttribute('aria-expanded', 'true');
          }
        } else if (parentEl.tagName === 'UL') {
          parentEl.classList.add('mm-show');
          parentEl.setAttribute('aria-expanded', 'true');

          const toggle = parentEl.previousElementSibling;
          if (toggle && toggle.tagName === 'A') {
            toggle.classList.add('mm-active');
            toggle.setAttribute('aria-expanded', 'true');
          }
        }

        if (parentEl.id === 'sidebar-menu') break;
        parentEl = parentEl.parentElement;
      }
    }
  }

  toggleSidebar(e: Event) {
    this.sidebarToggler.nativeElement.classList.toggle('active');
    if (window.matchMedia('(min-width: 992px)').matches) {
      e.preventDefault();
      this.document.body.classList.toggle('sidebar-folded');
    } else if (window.matchMedia('(max-width: 991px)').matches) {
      e.preventDefault();
      this.document.body.classList.toggle('sidebar-open');
    }
  }

  operSidebarFolded() {
    if (this.document.body.classList.contains('sidebar-folded')) {
      this.document.body.classList.add("open-sidebar-folded");
    }
  }

  closeSidebarFolded() {
    if (this.document.body.classList.contains('sidebar-folded')) {
      this.document.body.classList.remove("open-sidebar-folded");
    }
  }

  iconSidebar(mq: MediaQueryList) {
    if (mq.matches) {
      this.document.body.classList.add('sidebar-folded');
    } else {
      this.document.body.classList.remove('sidebar-folded');
    }
  }

  hasItems(item: MenuItem) {
    return (item.subItems !== undefined && item.subItems.length > 0);
  }

  SidebarHide() {
    document.body.classList.remove('vertical-sidebar-enable');
  }
}

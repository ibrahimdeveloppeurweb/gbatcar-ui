import {
  ApplicationConfig,
  importProvidersFrom,
  provideZoneChangeDetection
} from '@angular/core';
import {
  provideRouter,
  withInMemoryScrolling
} from '@angular/router';
import {
  provideHttpClient,
  withInterceptors
} from '@angular/common/http';

import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { provideHighlightOptions } from 'ngx-highlightjs';
import { NgxSpinnerModule } from 'ngx-spinner';

import { loaderInterceptor } from './core/interceptors/loader.interceptor';
import { httpCoreInterceptor } from './core/interceptors/http-core.interceptor';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { handlerErrorInterceptor } from './core/interceptors/handler-error.interceptor';

const highlightOptions = {
  coreLibraryLoader: () => import('highlight.js/lib/core'),
  languages: {
    typescript: () => import('highlight.js/lib/languages/typescript'),
    scss: () => import('highlight.js/lib/languages/scss'),
    xml: () => import('highlight.js/lib/languages/xml')
  },
};

export const appConfig: ApplicationConfig = {
  providers: [
    // ── Routing ──────────────────────────────────────────────────────────────
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top' })),



    // ── HTTP + Interceptors ───────────────────────────────────────────────────
    provideHttpClient(
      withInterceptors([
        loaderInterceptor,       // 0. Affiche le loader global
        httpCoreInterceptor,     // 1. Ajoute Content-Type: application/json
        jwtInterceptor,          // 2. Ajoute Authorization: Bearer <token>
        handlerErrorInterceptor, // 3. Gère les erreurs HTTP (401, 422, 500...)
      ])
    ),

    // ── UI ───────────────────────────────────────────────────────────────────
    provideAnimationsAsync(),
    importProvidersFrom([SweetAlert2Module.forRoot(), NgxSpinnerModule.forRoot({ type: 'ball-clip-rotate' })]),

    // ── Syntax Highlighting ───────────────────────────────────────────────────
    provideHighlightOptions(highlightOptions),
  ],
};

import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterOutlet } from '@angular/router';

// Imports pour forcer l'inclusion de tous les modèles et services dans l'arbre TypeScript
import './core/models';
import './core/services';
import { ThemeModeService } from './core/services/theme-mode.service';
import { NgxSpinnerModule } from 'ngx-spinner';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NgxSpinnerModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'gbatcar';

  constructor(private themeModeService: ThemeModeService) { }

}

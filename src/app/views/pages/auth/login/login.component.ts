import { NgClass, NgIf, NgStyle } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    NgStyle,
    NgIf,
    NgClass,
    RouterLink,
    ReactiveFormsModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {

  loginForm!: FormGroup;
  loading = false;
  showPwd = false;
  returnUrl = '/gbatcar/dashboard';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private auth: AuthService
  ) { }

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/gbatcar/dashboard';

    // Redirect if already logged in
    if (this.auth.isLoggedIn()) {
      this.router.navigate([this.returnUrl]);
    }

    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  get f() { return this.loginForm.controls; }

  togglePassword(): void {
    this.showPwd = !this.showPwd;
  }

  onSubmit(): void {
    if (this.loginForm.invalid || this.loading) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;

    this.auth.login(this.loginForm.value).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate([this.returnUrl]);
      },
      error: () => {
        this.loading = false;
        // Errors are handled globally by HandlerErrorInterceptor (SweetAlert2 toast)
      }
    });
  }
}

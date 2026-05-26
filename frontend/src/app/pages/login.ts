import { Component, inject, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { AuthService } from '../context/auth.state';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, MatIconModule, CommonModule],
  template: `
    <div class="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <div class="w-full max-w-md">
        <div class="card-sleek p-8 bg-white shadow-xl rounded-2xl border border-slate-100">
          <div class="text-center mb-10">
            <div class="inline-flex items-center justify-center w-12 h-12 bg-indigo-500 rounded-xl mb-4 shadow-lg shadow-indigo-500/20">
              <mat-icon class="text-white text-base">point_of_sale</mat-icon>
            </div>
            <h1 class="text-2xl font-bold tracking-tight text-slate-900">POSPro <span class="text-indigo-600">POS</span></h1>
            <p class="text-slate-400 mt-2 text-xs font-medium tracking-tight">Enter your credentials to access the portal</p>
          </div>

          <!-- Inactivity / Simultaneous Session Warnings -->
          @if (authWarning()) {
            <div class="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center text-amber-700 text-[11px] mb-6 animate-in shake duration-300">
              <mat-icon class="mr-2 text-sm">warning_amber</mat-icon>
              <span>{{authWarning()}}</span>
            </div>
          }

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-6">
            <div>
              <label for="email" class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
              <div class="relative">
                <mat-icon class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 text-sm">email</mat-icon>
                <input
                  id="email"
                  type="email"
                  formControlName="email"
                  placeholder="admin@salon.com"
                  class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                />
              </div>
              @if (loginForm.get('email')?.touched && loginForm.get('email')?.invalid) {
                <p class="text-[10px] text-red-500 mt-1.5 ml-1">Please enter a valid email address</p>
              }
            </div>

            <div>
              <label for="password" class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Password</label>
              <div class="relative">
                <mat-icon class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 text-sm">lock</mat-icon>
                <input
                  id="password"
                  [type]="showPassword() ? 'text' : 'password'"
                  formControlName="password"
                  placeholder="••••••••"
                  class="w-full pl-10 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                />
                <button
                  type="button"
                  (click)="showPassword.set(!showPassword())"
                  class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
                >
                  <mat-icon class="text-sm font-bold">{{showPassword() ? 'visibility_off' : 'visibility'}}</mat-icon>
                </button>
              </div>
            </div>

            @if (error()) {
              <div class="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center text-red-600 text-[11px] animate-in shake duration-300">
                <mat-icon class="mr-2 text-sm">error_outline</mat-icon>
                {{error()}}
              </div>
            }

            <button
              type="submit"
              [disabled]="loginForm.invalid || loading()"
              class="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-lg shadow-lg shadow-slate-900/10 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              @if (loading()) {
                <mat-icon class="animate-spin text-sm">refresh</mat-icon>
              }
              Sign In to Dashboard
            </button>
          </form>
        </div>
        
        <p class="text-center mt-8 text-slate-400 text-xs font-medium uppercase tracking-widest">
          Secured by mark
        </p>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class LoginPage {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  loading = signal(false);
  error = signal<string | null>(null);
  showPassword = signal(false);

  authWarning = computed(() => this.authService.warning());

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.loading.set(true);
    this.error.set(null);

    this.authService.login(this.loginForm.value as { email: string; password: string }).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        const errorMsg = err.error?.message || 'Login failed. Please check your credentials.';
        this.error.set(errorMsg);
        this.loading.set(false);
      }
    });
  }
}

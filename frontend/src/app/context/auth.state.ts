import { inject, Injectable, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { User, AuthResponse } from '../models/types';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private baseUrl = 'http://localhost:5000/api/auth';

  // State using signals
  private _user = signal<User | null>(null);
  private _token = signal<string | null>(null);
  
  // Custom warning message for idle logout / dual device logout
  private _warning = signal<string | null>(null);

  user = computed(() => this._user());
  token = computed(() => this._token());
  isAuthenticated = computed(() => !!this._token());
  warning = computed(() => this._warning());

  private idleTimeoutId: any = null;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this._token.set(localStorage.getItem('token'));
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          this._user.set(JSON.parse(savedUser));
        } catch {
          localStorage.removeItem('user');
        }
      }
      
      this.setupIdleTimer();
    }
  }

  login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    this._warning.set(null);
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, credentials).pipe(
      tap(response => {
        this._token.set(response.token);
        this._user.set(response.user);
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
        }
        this.setupIdleTimer();
      })
    );
  }

  logout(): void {
    this._token.set(null);
    this._user.set(null);
    if (this.idleTimeoutId) {
      clearTimeout(this.idleTimeoutId);
      this.idleTimeoutId = null;
    }
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    this.router.navigate(['/login']);
  }

  triggerForcedLogout(message: string): void {
    this._warning.set(message);
    this.logout();
  }

  clearWarning(): void {
    this._warning.set(null);
  }

  private setupIdleTimer(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const resetTimer = () => {
      if (this.idleTimeoutId) {
        clearTimeout(this.idleTimeoutId);
      }
      
      if (!this.isAuthenticated()) return;

      // 60-second idle session timeout for easy compliance checking
      this.idleTimeoutId = setTimeout(() => {
        if (this.isAuthenticated()) {
          this.triggerForcedLogout("Your session has expired due to 60 seconds of inactivity.");
        }
      }, 60 * 1000);
    };

    // User activity listeners
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('click', resetTimer);
    window.addEventListener('keypress', resetTimer);
    window.addEventListener('scroll', resetTimer);

    resetTimer();
  }
}

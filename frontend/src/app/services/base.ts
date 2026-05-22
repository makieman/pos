import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { throwError } from 'rxjs';
import { AuthService } from '../context/auth.state';

@Injectable({
  providedIn: 'root'
})
export class BaseApiService {
  protected http = inject(HttpClient);
  protected platformId = inject(PLATFORM_ID);
  protected authService = inject(AuthService);
  protected baseUrl = 'http://localhost:5000/api';

  protected getHeaders(): HttpHeaders {
    let token = null;
    if (isPlatformBrowser(this.platformId)) {
      token = localStorage.getItem('token');
    }
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  protected handleError = (error: HttpErrorResponse) => {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      errorMessage = error.error?.message || `Error Code: ${error.status}\nMessage: ${error.message}`;
      
      // Handle simultaneous device logout
      if (error.status === 401 && error.error?.forceLogout) {
        this.authService.triggerForcedLogout(errorMessage);
      }
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}

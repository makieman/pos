import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../context/auth.state';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    const requiredRoles = route.data?.['roles'] as Array<string>;
    if (requiredRoles) {
      const user = authService.user();
      if (!user || !requiredRoles.includes(user.role)) {
        alert(`Access Denied: You do not have permission to access ${route.routeConfig?.path}. Required: [${requiredRoles.join(', ')}]`);
        router.navigate(['/dashboard']);
        return false;
      }
    }
    return true;
  }

  router.navigate(['/login']);
  return false;
};

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};

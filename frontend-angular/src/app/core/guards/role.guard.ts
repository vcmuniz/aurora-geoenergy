import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.getCurrentUser();
  if (user?.role === 'ADMIN') {
    return true;
  }

  router.navigate(['/applications']);
  return false;
};

export const approverGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.getCurrentUser();
  if (user?.role === 'ADMIN' || user?.role === 'APPROVER') {
    return true;
  }

  router.navigate(['/applications']);
  return false;
};

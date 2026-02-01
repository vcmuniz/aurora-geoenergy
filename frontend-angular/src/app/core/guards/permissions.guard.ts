import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { PermissionsService } from '../services/permissions.service';

// Application guards
export const canCreateApplicationGuard: CanActivateFn = () => {
  const permissions = inject(PermissionsService);
  const router = inject(Router);

  if (permissions.canCreateApplication()) {
    return true;
  }

  router.navigate(['/applications']);
  return false;
};

export const canManageApplicationsGuard: CanActivateFn = () => {
  const permissions = inject(PermissionsService);
  const router = inject(Router);

  if (permissions.canEditApplication() || permissions.canDeleteApplication()) {
    return true;
  }

  router.navigate(['/applications']);
  return false;
};

// Release guards
export const canCreateReleaseGuard: CanActivateFn = () => {
  const permissions = inject(PermissionsService);
  const router = inject(Router);

  if (permissions.canCreateRelease()) {
    return true;
  }

  router.navigate(['/applications']);
  return false;
};

export const canManageReleasesGuard: CanActivateFn = () => {
  const permissions = inject(PermissionsService);
  const router = inject(Router);

  if (permissions.canEditRelease() || permissions.canDeleteRelease()) {
    return true;
  }

  router.navigate(['/applications']);
  return false;
};

export const canPromoteReleaseGuard: CanActivateFn = () => {
  const permissions = inject(PermissionsService);
  const router = inject(Router);

  if (permissions.canPromoteRelease()) {
    return true;
  }

  router.navigate(['/applications']);
  return false;
};

// Approval guards
export const canApproveGuard: CanActivateFn = () => {
  const permissions = inject(PermissionsService);
  const router = inject(Router);

  if (permissions.canApproveRelease()) {
    return true;
  }

  router.navigate(['/applications']);
  return false;
};

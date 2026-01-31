import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

export type UserRole = 'ADMIN' | 'APPROVER' | 'VIEWER';

export interface Permission {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
  approve: boolean;
  promote: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PermissionsService {
  constructor(private authService: AuthService) {}

  getUserRole(): UserRole {
    return this.authService.getCurrentUser()?.role as UserRole || 'VIEWER';
  }

  isAdmin(): boolean {
    return this.getUserRole() === 'ADMIN';
  }

  isApprover(): boolean {
    return this.getUserRole() === 'APPROVER';
  }

  isViewer(): boolean {
    return this.getUserRole() === 'VIEWER';
  }

  isAdminOrApprover(): boolean {
    return this.isAdmin() || this.isApprover();
  }

  // Application permissions
  canCreateApplication(): boolean {
    return this.isAdmin();
  }

  canEditApplication(): boolean {
    return this.isAdmin();
  }

  canDeleteApplication(): boolean {
    return this.isAdmin();
  }

  canViewApplications(): boolean {
    return true; // Todos podem visualizar
  }

  // Release permissions
  canCreateRelease(): boolean {
    return this.isAdminOrApprover();
  }

  canEditRelease(): boolean {
    return this.isAdminOrApprover();
  }

  canDeleteRelease(): boolean {
    return this.isAdminOrApprover();
  }

  canPromoteRelease(): boolean {
    return this.isAdmin();
  }

  canViewReleases(): boolean {
    return true; // Todos podem visualizar
  }

  // Approval permissions
  canApproveRelease(): boolean {
    return this.isAdminOrApprover();
  }

  canRejectRelease(): boolean {
    return this.isAdminOrApprover();
  }

  canViewApprovals(): boolean {
    return true; // Todos podem visualizar
  }

  // Audit permissions
  canViewAudit(): boolean {
    return true; // Todos podem visualizar
  }

  // Consolidated permission checks
  getApplicationPermissions(): Permission {
    return {
      create: this.canCreateApplication(),
      read: this.canViewApplications(),
      update: this.canEditApplication(),
      delete: this.canDeleteApplication(),
      approve: false,
      promote: false
    };
  }

  getReleasePermissions(): Permission {
    return {
      create: this.canCreateRelease(),
      read: this.canViewReleases(),
      update: this.canEditRelease(),
      delete: this.canDeleteRelease(),
      approve: this.canApproveRelease(),
      promote: this.canPromoteRelease()
    };
  }

  getApprovalPermissions(): Permission {
    return {
      create: false,
      read: this.canViewApprovals(),
      update: false,
      delete: false,
      approve: this.canApproveRelease(),
      promote: false
    };
  }

  getAuditPermissions(): Permission {
    return {
      create: false,
      read: this.canViewAudit(),
      update: false,
      delete: false,
      approve: false,
      promote: false
    };
  }
}

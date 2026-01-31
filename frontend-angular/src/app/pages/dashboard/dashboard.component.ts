import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { PermissionsService } from '@core/services/permissions.service';
import { RoleBadgeComponent } from '@shared/components/role-badge/role-badge.component';
import { User } from '@shared/models/auth.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RoleBadgeComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  user: User | null = null;
  loading = true;
  error = '';

  // Permissions summary
  userRole = '';
  permissionsSummary: any = {};

  constructor(
    private authService: AuthService,
    private router: Router,
    public permissions: PermissionsService
  ) {}

  ngOnInit(): void {
    this.authService.user$.subscribe(user => {
      this.user = user;
      this.updatePermissionsSummary();
    });

    // Busca dados completos do usuário
    this.authService.getMe().subscribe({
      next: (response) => {
        if (response.data) {
          this.user = response.data;
          this.updatePermissionsSummary();
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erro ao carregar dados do usuário';
        this.loading = false;
        console.error(err);
      }
    });
  }

  updatePermissionsSummary(): void {
    this.userRole = this.permissions.getUserRole();
    this.permissionsSummary = {
      applications: this.permissions.getApplicationPermissions(),
      releases: this.permissions.getReleasePermissions(),
      approvals: this.permissions.getApprovalPermissions(),
      audit: this.permissions.getAuditPermissions()
    };
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

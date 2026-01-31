import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-role-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="role-badge" [class]="'role-' + userRole?.toLowerCase()">
      <span class="role-label">{{ userRole }}</span>
    </div>
  `,
  styles: [`
    .role-badge {
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      display: inline-block;
      color: white;
    }

    .role-admin {
      background-color: #dc3545;
    }

    .role-approver {
      background-color: #007bff;
    }

    .role-viewer {
      background-color: #6c757d;
    }

    .role-label {
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  `]
})
export class RoleBadgeComponent implements OnInit {
  userRole: string | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.userRole = this.authService.getCurrentUser()?.role || 'VIEWER';
  }
}

import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '@core/services/auth.service';
import { map } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, RouterLink],
  template: `
    <div class="app-layout" [class.authenticated]="isAuthenticated$ | async">
      <aside class="sidebar" *ngIf="isAuthenticated$ | async">
        <div class="sidebar-header">
          <h2>Aurora</h2>
        </div>
        <nav class="sidebar-nav">
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
            <span class="icon">📊</span>
            <span>Dashboard</span>
          </a>
          <a routerLink="/applications" routerLinkActive="active" class="nav-item">
            <span class="icon">📦</span>
            <span>Aplicações</span>
          </a>
          <a routerLink="/releases" routerLinkActive="active" class="nav-item">
            <span class="icon">🚀</span>
            <span>Releases</span>
          </a>
          <a routerLink="/approvals" routerLinkActive="active" class="nav-item">
            <span class="icon">✅</span>
            <span>Aprovações</span>
          </a>
          <a routerLink="/audit-logs" routerLinkActive="active" class="nav-item">
            <span class="icon">📋</span>
            <span>Auditoria</span>
          </a>
        </nav>
        <div class="sidebar-footer">
          <div class="user-info">
            <div class="user-name">{{ (currentUser$ | async)?.name || 'Usuário' }}</div>
            <div class="user-email">{{ (currentUser$ | async)?.email }}</div>
          </div>
          <button (click)="logout()" class="btn-logout">Logout</button>
        </div>
      </aside>
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-layout {
      display: flex;
      height: 100vh;
      background-color: #f5f5f5;
    }

    .sidebar {
      width: 250px;
      background-color: #2c3e50;
      color: white;
      display: flex;
      flex-direction: column;
      box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
    }

    .sidebar-header {
      padding: 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);

      h2 {
        margin: 0;
        font-size: 24px;
        font-weight: bold;
      }
    }

    .sidebar-nav {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 5px;
      padding: 15px 0;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 20px;
      color: rgba(255, 255, 255, 0.7);
      text-decoration: none;
      transition: all 0.2s;
      border-left: 3px solid transparent;

      .icon {
        font-size: 18px;
      }

      &:hover {
        background-color: rgba(255, 255, 255, 0.1);
        color: white;
      }

      &.active {
        background-color: rgba(52, 152, 219, 0.3);
        color: #3498db;
        border-left-color: #3498db;
      }
    }

    .sidebar-footer {
      padding: 15px 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .user-info {
      background-color: rgba(255, 255, 255, 0.05);
      padding: 10px;
      border-radius: 4px;
    }

    .user-name {
      font-weight: bold;
      font-size: 14px;
    }

    .user-email {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.6);
      word-break: break-all;
    }

    .btn-logout {
      background-color: #e74c3c;
      color: white;
      border: none;
      padding: 10px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: background-color 0.2s;

      &:hover {
        background-color: #c0392b;
      }
    }

    .main-content {
      flex: 1;
      overflow-y: auto;
      background-color: #f5f5f5;
    }

    .app-layout:not(.authenticated) {
      flex-direction: column;

      .main-content {
        background-color: white;
      }
    }
  `]
})
export class AppComponent implements OnInit {
  isAuthenticated$;
  currentUser$;

  constructor(private authService: AuthService, private router: Router) {
    this.isAuthenticated$ = this.authService.user$.pipe(
      map(user => !!user && this.authService.isAuthenticated())
    );
    this.currentUser$ = this.authService.user$;
  }

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.authService.getMe().subscribe({
        next: () => {
          // User loaded
        },
        error: (err) => {
          console.warn('Token expired, logging out');
          this.authService.logout();
        }
      });
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

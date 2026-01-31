import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, RouterLink],
  template: `
    <div class="app-layout">
      <nav class="navbar" *ngIf="isAuthenticated$ | async as isAuth; else loginLayout">
        <div class="nav-content">
          <div class="nav-logo">Aurora Release Manager</div>
          <div class="nav-links">
            <a routerLink="/dashboard" class="nav-link">Dashboard</a>
            <a routerLink="/applications" class="nav-link">Aplicações</a>
            <a routerLink="/releases" class="nav-link">Releases</a>
            <a routerLink="/approvals" class="nav-link">Aprovações</a>
            <a routerLink="/audit" class="nav-link">Audit</a>
            <button (click)="logout()" class="nav-logout">Logout</button>
          </div>
        </div>
      </nav>
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
    <ng-template #loginLayout>
      <router-outlet></router-outlet>
    </ng-template>
  `,
  styles: [`
    .app-layout {
      display: flex;
      flex-direction: column;
      height: 100vh;
    }

    .navbar {
      background-color: #2c3e50;
      color: white;
      padding: 0;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .nav-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 20px;
      max-width: 1400px;
      margin: 0 auto;
      width: 100%;
    }

    .nav-logo {
      font-size: 18px;
      font-weight: bold;
      padding: 16px 0;
    }

    .nav-links {
      display: flex;
      gap: 20px;
      align-items: center;
    }

    .nav-link {
      color: white;
      text-decoration: none;
      padding: 8px 12px;
      border-radius: 4px;
      transition: background-color 0.2s;

      &:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }
    }

    .nav-logout {
      background-color: #e74c3c;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s;

      &:hover {
        background-color: #c0392b;
      }
    }

    .main-content {
      flex: 1;
      overflow-y: auto;
    }
  `]
})
export class AppComponent implements OnInit {
  isAuthenticated$;

  constructor(private authService: AuthService, private router: Router) {
    this.isAuthenticated$ = this.authService.isLoggedIn;
  }

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.authService.getMe().subscribe({
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

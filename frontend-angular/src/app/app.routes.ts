import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ApplicationsComponent } from './pages/applications/applications.component';
import { ReleasesComponent } from './pages/releases/releases.component';
import { ApprovalsComponent } from './pages/approvals/approvals.component';
import { AuditLogsComponent } from './pages/audit-logs/audit-logs.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'applications', component: ApplicationsComponent, canActivate: [authGuard] },
  { path: 'releases', component: ReleasesComponent, canActivate: [authGuard] },
  { path: 'approvals', component: ApprovalsComponent, canActivate: [authGuard] },
  { path: 'audit-logs', component: AuditLogsComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'login' }
];

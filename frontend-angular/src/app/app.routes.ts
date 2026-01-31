import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ApplicationsComponent } from './pages/applications/applications.component';
import { ReleasesComponent } from './pages/releases/releases.component';
import { ApprovalsComponent } from './pages/approvals/approvals.component';
import { AuditComponent } from './pages/audit/audit.component';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'applications', component: ApplicationsComponent, canActivate: [authGuard] },
  { path: 'releases', component: ReleasesComponent, canActivate: [authGuard] },
  { path: 'approvals', component: ApprovalsComponent, canActivate: [authGuard] },
  { path: 'audit', component: AuditComponent, canActivate: [authGuard, adminGuard] },
  { path: '**', redirectTo: 'login' }
];

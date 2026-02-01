import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApplicationService } from '@core/services/application.service';
import { ReleaseService } from '@core/services/release.service';
import { AuthService } from '@core/services/auth.service';
import { PermissionsService } from '@core/services/permissions.service';
import { Application, ApplicationRequest } from '@shared/models/application.model';
import { Release } from '@shared/models/release.model';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './applications.component.html',
  styleUrls: ['./applications.component.scss']
})
export class ApplicationsComponent implements OnInit {
  Math = Math;
  applications: Application[] = [];
  loading = false;
  showForm = false;
  showDetailsModal = false;
  editingId: string | null = null;
  selectedApp: Application | null = null;
  selectedAppReleases: Release[] = [];
  loadingReleases = false;

  formData: ApplicationRequest = {
    name: '',
    ownerTeam: '',
    repoUrl: ''
  };

  skip = 0;
  limit = 10;
  total = 0;

  // Permissions
  canCreate = false;
  canEdit = false;
  canDelete = false;

  constructor(
    private appService: ApplicationService,
    private releaseService: ReleaseService,
    public permissions: PermissionsService
  ) {}

  ngOnInit(): void {
    // Subscribe to user changes and reinitialize permissions when user loads
    this.permissions.userLoaded$.subscribe(() => {
      this.initializePermissions();
    });
    
    // Also initialize now in case user is already loaded
    this.initializePermissions();
    this.loadApplications();
  }

  initializePermissions(): void {
    this.canCreate = this.permissions.canCreateApplication();
    this.canEdit = this.permissions.canEditApplication();
    this.canDelete = this.permissions.canDeleteApplication();
  }

  loadApplications(): void {
    this.loading = true;
    this.appService.list(this.skip, this.limit).subscribe({
      next: (response: any) => {
        this.applications = response.data?.data || [];
        this.total = response.data?.total || 0;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar aplicações:', err);
        this.loading = false;
      }
    });
  }

  openForm(app?: Application): void {
    if (!this.canCreate && !this.canEdit) {
      alert('Você não tem permissão para esta ação');
      return;
    }
    if (app) {
      this.editingId = app.id;
      this.formData = {
        name: app.name,
        ownerTeam: app.ownerTeam,
        repoUrl: app.repoUrl
      };
    } else {
      this.editingId = null;
      this.formData = { name: '', ownerTeam: '', repoUrl: '' };
    }
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.formData = { name: '', ownerTeam: '', repoUrl: '' };
  }

  save(): void {
    if (!this.formData.name || !this.formData.ownerTeam) {
      alert('Nome e Equipe são obrigatórios');
      return;
    }

    if (this.editingId) {
      this.appService.update(this.editingId, this.formData).subscribe({
        next: () => {
          this.loadApplications();
          this.closeForm();
        },
        error: (err) => console.error('Erro ao atualizar:', err)
      });
    } else {
      this.appService.create(this.formData).subscribe({
        next: () => {
          this.loadApplications();
          this.closeForm();
        },
        error: (err) => console.error('Erro ao criar:', err)
      });
    }
  }

  delete(id: string): void {
    if (!this.canDelete) {
      alert('Você não tem permissão para deletar aplicações');
      return;
    }
    if (confirm('Tem certeza?')) {
      this.appService.delete(id).subscribe({
        next: () => this.loadApplications(),
        error: (err) => console.error('Erro ao deletar:', err)
      });
    }
  }

  previousPage(): void {
    if (this.skip >= this.limit) {
      this.skip -= this.limit;
      this.loadApplications();
    }
  }

  nextPage(): void {
    if ((this.skip + this.limit) < this.total) {
      this.skip += this.limit;
      this.loadApplications();
    }
  }

  onLimitChange(): void {
    this.skip = 0;
    this.loadApplications();
  }

  get canPrevious(): boolean {
    return this.skip > 0;
  }

  get canNext(): boolean {
    return (this.skip + this.limit) < this.total;
  }

  viewDetails(app: Application): void {
    this.selectedApp = app;
    this.showDetailsModal = true;
    this.loadReleases(app.id);
  }

  loadReleases(appId: string): void {
    this.loadingReleases = true;
    this.releaseService.list(appId, 0, 1000).subscribe({
      next: (response: any) => {
        this.selectedAppReleases = response.data?.data || [];
        this.loadingReleases = false;
      },
      error: (err) => {
        console.error('Erro ao carregar releases:', err);
        this.selectedAppReleases = [];
        this.loadingReleases = false;
      }
    });
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedApp = null;
    this.selectedAppReleases = [];
  }

  getReleasesByEnv(env: string): Release[] {
    return this.selectedAppReleases.filter(r => r.env === env);
  }

  getEnvLabel(env: string): string {
    const labels: { [key: string]: string } = {
      'DEV': 'Desenvolvimento',
      'PRE_PROD': 'Pré-Produção',
      'PROD': 'Produção'
    };
    return labels[env] || env;
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'PENDING': 'Pendente',
      'APPROVED': 'Aprovado',
      'REJECTED': 'Rejeitado',
      'DEPLOYED': 'Implantado'
    };
    return labels[status] || status;
  }
}

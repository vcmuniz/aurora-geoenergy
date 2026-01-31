import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReleaseService } from '@core/services/release.service';
import { ApplicationService } from '@core/services/application.service';
import { ApprovalService } from '@core/services/approval.service';
import { AuthService } from '@core/services/auth.service';
import { PermissionsService } from '@core/services/permissions.service';
import { ReleaseTimelineService } from '@core/services/release-timeline.service';
import { TimelineComponent } from '@shared/components/timeline/timeline.component';
import { Release, ReleaseRequest } from '@shared/models/release.model';
import { Application } from '@shared/models/application.model';

@Component({
  selector: 'app-releases',
  standalone: true,
  imports: [CommonModule, FormsModule, TimelineComponent],
  templateUrl: './releases.component.html',
  styleUrls: ['./releases.component.scss']
})
export class ReleasesComponent implements OnInit {
  Math = Math;
  releases: Release[] = [];
  applications: Application[] = [];
  approvalCounts: Map<string, { approved: number; rejected: number }> = new Map();
  loading = false;
  showForm = false;
  isEditMode = false;
  editingReleaseId: string | null = null;
  selectedAppId = '';
  selectedReleaseId: string | null = null;
  timeline: any[] = [];
  showPromoteModal = false;
  promoteReleaseId: string | null = null;
  currentEnv: string = '';
  promoteTargetEnv: string = '';
  currentUser: string = ''; // TODO: get from auth
  promoteValidation: any = null;

  // Permissions
  canCreate = false;
  canEdit = false;
  canDelete = false;
  canPromote = false;

  formData: ReleaseRequest = {
    applicationId: '',
    version: '',
    env: 'DEV',
    evidenceUrl: '',
    evidenceScore: 0
  };

  skip = 0;
  limit = 10;
  total = 0;

  constructor(
    private releaseService: ReleaseService,
    private appService: ApplicationService,
    private approvalService: ApprovalService,
    private timelineService: ReleaseTimelineService,
    private authService: AuthService,
    public permissions: PermissionsService
  ) {
    this.currentUser = this.authService.getCurrentUserEmail();
  }

  ngOnInit(): void {
    this.initializePermissions();
    this.loadApplications();
  }

  initializePermissions(): void {
    this.canCreate = this.permissions.canCreateRelease();
    this.canEdit = this.permissions.canEditRelease();
    this.canDelete = this.permissions.canDeleteRelease();
    this.canPromote = this.permissions.canPromoteRelease();
  }

  loadApplications(): void {
    this.appService.list(0, 100).subscribe({
      next: (response: any) => {
        this.applications = response.data?.data || [];
      },
      error: (err) => console.error('Erro ao carregar aplicações:', err)
    });
  }

  loadReleases(): void {
    if (!this.selectedAppId) return;

    this.loading = true;
    this.releaseService.list(this.selectedAppId, this.skip, this.limit).subscribe({
      next: (response: any) => {
        this.releases = response.data?.data || [];
        this.total = response.data?.total || 0;
        this.loading = false;
        // Carregar contagem de aprovações para cada release
        this.releases.forEach(release => {
          this.loadApprovalCounts(release.id);
        });
      },
      error: (err) => {
        console.error('Erro ao carregar releases:', err);
        this.loading = false;
      }
    });
  }

  loadApprovalCounts(releaseId: string): void {
    this.approvalService.list(0, 100).subscribe({
      next: (response: any) => {
        const approvals = response.data?.data || [];
        const releaseApprovals = approvals.filter((a: any) => a.releaseId === releaseId);
        const approved = releaseApprovals.filter((a: any) => a.outcome === 'APPROVED').length;
        const rejected = releaseApprovals.filter((a: any) => a.outcome === 'REJECTED').length;
        
        this.approvalCounts.set(releaseId, { approved, rejected });
      },
      error: (err) => console.error('Erro ao carregar contagem de aprovações:', err)
    });
  }

  getApprovalCounts(releaseId: string): { approved: number; rejected: number } {
    return this.approvalCounts.get(releaseId) || { approved: 0, rejected: 0 };
  }

  onAppChange(): void {
    this.skip = 0;
    this.loadReleases();
  }

  openForm(): void {
    if (!this.canCreate) {
      alert('Você não tem permissão para criar releases');
      return;
    }
    this.isEditMode = false;
    this.editingReleaseId = null;
    this.formData = {
      applicationId: this.selectedAppId,
      version: '',
      env: 'DEV',
      evidenceUrl: '',
      evidenceScore: 0
    };
    this.showForm = true;
  }

  editRelease(release: Release): void {
    if (!this.canEdit) {
      alert('Você não tem permissão para editar releases');
      return;
    }
    this.isEditMode = true;
    this.editingReleaseId = release.id;
    this.formData = {
      applicationId: release.applicationId,
      version: release.version,
      env: release.env,
      evidenceUrl: release.evidenceUrl || '',
      evidenceScore: 0
    };
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.isEditMode = false;
    this.editingReleaseId = null;
  }

  save(): void {
    if (!this.formData.version) {
      alert('Versão é obrigatória');
      return;
    }

    if (this.isEditMode && this.editingReleaseId) {
      this.formData.applicationId = this.selectedAppId;
      this.releaseService.update(this.editingReleaseId, this.formData).subscribe({
        next: () => {
          this.loadReleases();
          this.closeForm();
        },
        error: (err) => {
          console.error('Erro ao atualizar:', err);
          alert('Erro ao atualizar release');
        }
      });
    } else {
      this.formData.applicationId = this.selectedAppId;
      this.formData.actor = this.currentUser;
      this.releaseService.create(this.formData).subscribe({
        next: () => {
          this.loadReleases();
          this.closeForm();
        },
        error: (err) => console.error('Erro ao criar:', err)
      });
    }
  }

  delete(id: string): void {
    if (!this.canDelete) {
      alert('Você não tem permissão para deletar releases');
      return;
    }
    if (confirm('Tem certeza?')) {
      this.releaseService.delete(id).subscribe({
        next: () => this.loadReleases(),
        error: (err) => console.error('Erro ao deletar:', err)
      });
    }
  }

  previousPage(): void {
    if (this.skip >= this.limit) {
      this.skip -= this.limit;
      this.loadReleases();
    }
  }

  nextPage(): void {
    if ((this.skip + this.limit) < this.total) {
      this.skip += this.limit;
      this.loadReleases();
    }
  }

  onLimitChange(): void {
    this.skip = 0;
    this.loadReleases();
  }

  get canPrevious(): boolean {
    return this.skip > 0;
  }

  get canNext(): boolean {
    return (this.skip + this.limit) < this.total;
  }

  loadTimeline(releaseId: string): void {
    this.selectedReleaseId = releaseId;
    this.timelineService.getTimeline(releaseId).subscribe({
      next: (response: any) => {
        this.timeline = response.data || [];
      },
      error: (err: any) => {
        console.error('Erro ao carregar timeline:', err);
        this.timeline = [];
      }
    });
  }

  closeTimeline(): void {
    this.selectedReleaseId = null;
    this.timeline = [];
  }

  openPromoteModal(releaseId: string, env: string): void {
    if (!this.canPromote) {
      alert('Você não tem permissão para promover releases');
      return;
    }
    this.promoteReleaseId = releaseId;
    this.currentEnv = env;
    this.showPromoteModal = true;
    this.promoteTargetEnv = env === 'DEV' ? 'PRE_PROD' : env === 'PRE_PROD' ? 'PROD' : '';
    this.promoteValidation = null;
    
    // Carregar validação se for PRE_PROD -> PROD
    if (env === 'PRE_PROD' && this.promoteTargetEnv === 'PROD') {
      this.validatePromotion(releaseId);
    }
  }

  validatePromotion(releaseId: string): void {
    this.releaseService.getById(releaseId).subscribe({
      next: (response: any) => {
        const release = response.data;
        
        // Contar approvals
        this.approvalService.list(0, 100).subscribe({
          next: (appResponse: any) => {
            // O endpoint retorna array direta ou wrapped em data
            const approvals = Array.isArray(appResponse.data) ? appResponse.data : (appResponse.data?.data || []);
            const releaseApprovals = approvals.filter((a: any) => a.releaseId === releaseId);
            const approved = releaseApprovals.filter((a: any) => a.outcome === 'APPROVED').length;
            
            this.promoteValidation = {
              hasApprovals: approved >= 1,
              approvalCount: approved,
              hasEvidenceUrl: !!release.evidenceUrl,
              evidenceUrl: release.evidenceUrl || '',
              hasMinScore: release.evidenceScore >= 70,
              score: release.evidenceScore,
              minScore: 70,
              canPromote: approved >= 1 && !!release.evidenceUrl && release.evidenceScore >= 70
            };
          }
        });
      }
    });
  }

  closePromoteModal(): void {
    this.showPromoteModal = false;
    this.promoteReleaseId = null;
    this.currentEnv = '';
    this.promoteTargetEnv = '';
  }

  promoteRelease(): void {
    if (!this.promoteReleaseId || !this.promoteTargetEnv) {
      console.error('Release ID or target env missing');
      return;
    }

    this.releaseService.promote(this.promoteReleaseId, this.promoteTargetEnv, this.currentUser).subscribe({
      next: () => {
        alert('Release promovido com sucesso!');
        this.closePromoteModal();
        this.loadReleases();
      },
      error: (err: any) => {
        console.error('Erro ao promover:', err);
        alert('Erro ao promover release');
      }
    });
  }
}

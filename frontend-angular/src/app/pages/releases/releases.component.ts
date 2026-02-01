import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReleaseService } from '@core/services/release.service';
import { ApplicationService } from '@core/services/application.service';
import { ApprovalService } from '@core/services/approval.service';
import { AuthService } from '@core/services/auth.service';
import { PermissionsService } from '@core/services/permissions.service';
import { ReleaseTimelineService } from '@core/services/release-timeline.service';
import { NotificationService } from '@core/services/notification.service';
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
  filteredReleases: Release[] = [];
  applications: Application[] = [];
  approvalCounts: Map<string, { approved: number; rejected: number }> = new Map();
  loading = false;
  showForm = false;
  isEditMode = false;
  editingReleaseId: string | null = null;
  selectedAppId = '';
  filterAppId = '';
  filterStatus = 'ACTIVE'; // ACTIVE = PENDING + APPROVED
  selectedReleaseId: string | null = null;
  timeline: any[] = [];
  showViewModal = false;
  selectedRelease: Release | null = null;
  selectedReleaseApprovals: any[] = [];
  loadingApprovals = false;
  activeViewTab: 'info' | 'approvals' | 'timeline' = 'info';
  showPromoteModal = false;
  showRejectModal = false;
  showDeployModal = false;
  promoteReleaseId: string | null = null;
  rejectReleaseId: string | null = null;
  deployReleaseId: string | null = null;
  rejectNotes: string = '';
  currentEnv: string = '';
  promoteTargetEnv: string = '';
  currentUser: string = ''; // TODO: get from auth
  promoteValidation: any = null;
  openMenuId: string | null = null;

  // Permissions
  canCreate = false;
  canEdit = false;
  canDelete = false;
  canPromote = false;
  canReject = false;

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
    private notificationService: NotificationService,
    public permissions: PermissionsService
  ) {
    this.currentUser = this.authService.getCurrentUserEmail();
  }

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
    this.canCreate = this.permissions.canCreateRelease();
    this.canEdit = this.permissions.canEditRelease();
    this.canDelete = this.permissions.canDeleteRelease();
    this.canPromote = this.permissions.canPromoteRelease();
    this.canReject = this.permissions.canRejectRelease();
  }

  loadApplications(): void {
    this.appService.list(0, 100).subscribe({
      next: (response: any) => {
        this.applications = response.data?.data || [];
        this.loadAllReleases();
      },
      error: (err) => console.error('Erro ao carregar aplicações:', err)
    });
  }

  loadAllReleases(): void {
    this.loading = true;
    const loadPromises = this.applications.map(app => 
      this.releaseService.list(app.id, 0, 1000).toPromise()
    );

    Promise.all(loadPromises).then((responses: any[]) => {
      this.releases = responses.flatMap((response: any) => response.data?.data || []);
      this.applyFilter();
      this.loading = false;
      // Carregar contagem de aprovações para TODAS as releases de uma vez
      this.loadAllApprovalCounts();
    }).catch((err) => {
      console.error('Erro ao carregar releases:', err);
      this.loading = false;
    });
  }

  applyFilter(): void {
    let filtered = this.releases;
    
    // Filtrar por aplicação
    if (this.filterAppId) {
      filtered = filtered.filter(r => r.applicationId === this.filterAppId);
    }
    
    // Filtrar por status
    if (this.filterStatus === 'ACTIVE') {
      // Mostrar PENDING, APPROVED e releases em PROD (mesmo DEPLOYED)
      filtered = filtered.filter(r => 
        r.status === 'PENDING' || 
        r.status === 'APPROVED' || 
        r.env === 'PROD'
      );
    } else if (this.filterStatus !== 'ALL') {
      filtered = filtered.filter(r => r.status === this.filterStatus);
    }
    
    this.filteredReleases = filtered;
    this.total = this.filteredReleases.length;
  }

  onFilterChange(): void {
    this.skip = 0;
    this.applyFilter();
  }

  loadAllApprovalCounts(): void {
    // Buscar TODAS as aprovações de uma vez só
    this.approvalService.list(0, 1000).subscribe({
      next: (response: any) => {
        const allApprovals = response.data?.data || [];
        
        // Agrupar por release_id e contar
        const countsByRelease = new Map<string, { approved: number; rejected: number }>();
        
        allApprovals.forEach((approval: any) => {
          if (!countsByRelease.has(approval.releaseId)) {
            countsByRelease.set(approval.releaseId, { approved: 0, rejected: 0 });
          }
          
          const counts = countsByRelease.get(approval.releaseId)!;
          if (approval.outcome === 'APPROVED') {
            counts.approved++;
          } else if (approval.outcome === 'REJECTED') {
            counts.rejected++;
          }
        });
        
        // Atualizar o Map de contagem
        this.approvalCounts = countsByRelease;
      },
      error: (err) => console.error('Erro ao carregar aprovações:', err)
    });
  }

  loadApprovalCounts(releaseId: string): void {
    this.approvalService.listByReleaseId(releaseId).subscribe({
      next: (response: any) => {
        const approvals = response.data || [];
        const approved = approvals.filter((a: any) => a.outcome === 'APPROVED').length;
        const rejected = approvals.filter((a: any) => a.outcome === 'REJECTED').length;
        
        this.approvalCounts.set(releaseId, { approved, rejected });
      },
      error: (err) => console.error('Erro ao carregar contagem de aprovações:', err)
    });
  }

  getApprovalCounts(releaseId: string): { approved: number; rejected: number } {
    return this.approvalCounts.get(releaseId) || { approved: 0, rejected: 0 };
  }

  openForm(): void {
    if (!this.canCreate) {
      this.notificationService.error('Você não tem permissão para criar releases');
      return;
    }
    this.isEditMode = false;
    this.editingReleaseId = null;
    this.formData = {
      applicationId: '',
      version: '',
      env: 'DEV',
      evidenceUrl: '',
      evidenceScore: 0
    };
    this.showForm = true;
  }

  editRelease(release: Release): void {
    if (!this.canEdit) {
      this.notificationService.error('Você não tem permissão para editar releases');
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
    if (!this.formData.version || !this.formData.applicationId) {
      this.notificationService.warning('Versão e aplicação são obrigatórias');
      return;
    }

    if (this.isEditMode && this.editingReleaseId) {
      this.releaseService.update(this.editingReleaseId, this.formData).subscribe({
        next: () => {
          this.notificationService.success('Release atualizado com sucesso!');
          this.loadAllReleases();
          this.closeForm();
        },
        error: (err) => {
          console.error('Erro ao atualizar:', err);
          const errorMsg = err.error?.error?.message || err.message || 'Erro desconhecido';
          
          // Traduzir mensagens específicas
          if (errorMsg.includes('already exists')) {
            const version = this.formData.version;
            const envLabel = this.getEnvLabel(this.formData.env);
            this.notificationService.error(`A versão ${version} já existe no ambiente ${envLabel}`);
          } else if (errorMsg.includes('not found')) {
            this.notificationService.error('Release não encontrado');
          } else {
            this.notificationService.error('Erro ao atualizar release: ' + errorMsg);
          }
        }
      });
    } else {
      this.formData.actor = this.currentUser;
      this.releaseService.create(this.formData).subscribe({
        next: () => {
          this.notificationService.success('Release criado com sucesso!');
          this.loadAllReleases();
          this.closeForm();
        },
        error: (err) => {
          console.error('Erro ao criar:', err);
          const errorMsg = err.error?.error?.message || err.message || 'Erro desconhecido';
          
          // Traduzir mensagens específicas
          if (errorMsg.includes('already exists')) {
            const version = this.formData.version;
            const envLabel = this.getEnvLabel(this.formData.env);
            this.notificationService.error(`A versão ${version} já existe no ambiente ${envLabel}`);
          } else {
            this.notificationService.error('Erro ao criar release: ' + errorMsg);
          }
        }
      });
    }
  }

  delete(id: string): void {
    if (!this.canDelete) {
      this.notificationService.error('Você não tem permissão para deletar releases');
      return;
    }
    if (confirm('Tem certeza?')) {
      this.releaseService.delete(id).subscribe({
        next: () => {
          this.notificationService.success('Release deletado com sucesso!');
          this.loadAllReleases();
        },
        error: (err) => {
          console.error('Erro ao deletar:', err);
          this.notificationService.error('Erro ao deletar release');
        }
      });
    }
  }

  reject(id: string): void {
    console.log('reject called with id:', id);
    this.rejectReleaseId = id;
    this.rejectNotes = '';
    this.showRejectModal = true;
    console.log('showRejectModal:', this.showRejectModal);
  }

  confirmReject(): void {
    if (!this.rejectReleaseId) return;
    
    this.releaseService.reject(this.rejectReleaseId, this.rejectNotes || 'Release rejeitada').subscribe({
      next: () => {
        this.notificationService.success('Release rejeitada com sucesso!');
        this.closeRejectModal();
        this.loadAllReleases();
      },
      error: (err) => {
        console.error('Erro ao rejeitar:', err);
        const errorMsg = err.error?.error?.message || err.message || 'Erro desconhecido';
        
        if (errorMsg.includes('not found')) {
          this.notificationService.error('Release não encontrado');
        } else if (errorMsg.includes('already')) {
          this.notificationService.error('Release já foi rejeitada');
        } else {
          this.notificationService.error('Erro ao rejeitar: ' + errorMsg);
        }
      }
    });
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    this.rejectReleaseId = null;
    this.rejectNotes = '';
  }

  deploy(id: string): void {
    console.log('deploy called with id:', id);
    this.deployReleaseId = id;
    this.showDeployModal = true;
    console.log('showDeployModal:', this.showDeployModal);
  }

  confirmDeploy(): void {
    if (!this.deployReleaseId) return;
    
    this.releaseService.deploy(this.deployReleaseId, 'Release implantada em produção').subscribe({
      next: () => {
        this.notificationService.success('Release implantada com sucesso! 🚀');
        this.closeDeployModal();
        this.loadAllReleases();
      },
      error: (err) => {
        console.error('Erro ao implantar:', err);
        const errorMsg = err.error?.error?.message || err.message || 'Erro desconhecido';
        
        if (errorMsg.includes('not found')) {
          this.notificationService.error('Release não encontrado');
        } else if (errorMsg.includes('not in PROD') || errorMsg.includes('Apenas releases em PROD')) {
          this.notificationService.error('Apenas releases em Produção podem ser implantadas');
        } else if (errorMsg.includes('not APPROVED') || errorMsg.includes('precisa estar APPROVED')) {
          this.notificationService.error('Release precisa estar aprovada para ser implantada');
        } else if (errorMsg.includes('already')) {
          this.notificationService.error('Release já está implantada');
        } else {
          this.notificationService.error('Erro ao implantar: ' + errorMsg);
        }
      }
    });
  }

  closeDeployModal(): void {
    this.showDeployModal = false;
    this.deployReleaseId = null;
  }

  previousPage(): void {
    if (this.skip >= this.limit) {
      this.skip -= this.limit;
    }
  }

  nextPage(): void {
    if ((this.skip + this.limit) < this.total) {
      this.skip += this.limit;
    }
  }

  onLimitChange(): void {
    this.skip = 0;
  }

  get paginatedReleases(): Release[] {
    return this.filteredReleases.slice(this.skip, this.skip + this.limit);
  }

  getApplicationName(applicationId: string): string {
    return this.applications.find(a => a.id === applicationId)?.name || applicationId;
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'PENDING': 'Pendente',
      'APPROVED': 'Aprovado',
      'DEPLOYED': 'Implantado',
      'REJECTED': 'Rejeitado'
    };
    return labels[status] || status;
  }

  getEnvLabel(env: string): string {
    const labels: { [key: string]: string } = {
      'DEV': 'Desenvolvimento',
      'PRE_PROD': 'Pré-Produção',
      'PROD': 'Produção'
    };
    return labels[env] || env;
  }

  get canPrevious(): boolean {
    return this.skip > 0;
  }

  get canNext(): boolean {
    return (this.skip + this.limit) < this.total;
  }

  loadTimeline(releaseId: string): void {
    // Se está no modal de view, não seta o selectedReleaseId
    if (!this.showViewModal) {
      this.selectedReleaseId = releaseId;
    }
    this.loading = true;
    this.timelineService.getTimeline(releaseId).subscribe({
      next: (response: any) => {
        this.timeline = response.data?.events || response.data || [];
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Erro ao carregar timeline:', err);
        this.timeline = [];
        this.loading = false;
        this.notificationService.error('Erro ao carregar timeline do release');
      }
    });
  }

  closeTimeline(): void {
    this.selectedReleaseId = null;
    this.timeline = [];
  }

  viewRelease(release: Release): void {
    this.selectedRelease = release;
    this.showViewModal = true;
    this.selectedReleaseId = null; // Limpar para não abrir timeline standalone
    this.loadTimeline(release.id);
    this.loadReleaseApprovals(release.id);
  }

  loadReleaseApprovals(releaseId: string): void {
    this.loadingApprovals = true;
    this.approvalService.listByReleaseId(releaseId).subscribe({
      next: (response: any) => {
        this.selectedReleaseApprovals = response.data || [];
        this.loadingApprovals = false;
      },
      error: (err) => {
        console.error('Erro ao carregar aprovações:', err);
        this.selectedReleaseApprovals = [];
        this.loadingApprovals = false;
      }
    });
  }

  closeViewModal(): void {
    this.showViewModal = false;
    this.selectedRelease = null;
    this.selectedReleaseApprovals = [];
    this.timeline = [];
    this.activeViewTab = 'info';
    this.selectedReleaseId = null; // Garantir que não abre timeline standalone
  }

  setViewTab(tab: 'info' | 'approvals' | 'timeline'): void {
    this.activeViewTab = tab;
  }

  openPromoteModal(releaseId: string, env: string): void {
    if (!this.canPromote) {
      this.notificationService.error('Você não tem permissão para promover releases');
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
    // Use the backend's pre-launch checklist endpoint for real validation
    this.releaseService.getPreLaunchChecklist(releaseId).subscribe({
      next: (checklist: any) => {
        const data = checklist.data || checklist;
        this.promoteValidation = {
          hasApprovals: data.approvalsOk,
          approvalCount: data.approvalCount || 0,
          hasEvidenceUrl: data.evidenceOk,
          evidenceUrl: data.evidenceUrl || '',
          hasMinScore: data.scoreOk,
          score: data.score || 0,
          minScore: data.minScore || 70,
          isFrozen: !data.freezeOk,
          freezeMessage: data.freezeMessage || '',
          canPromote: data.ready
        };
      },
      error: (err) => {
        console.error('Erro ao validar promoção:', err);
        // Fallback: manual validation
        this.validatePromotionManual(releaseId);
      }
    });
  }

  private validatePromotionManual(releaseId: string): void {
    this.releaseService.getById(releaseId).subscribe({
      next: (response: any) => {
        const release = response.data;
        
        // Contar approvals
        this.approvalService.list(0, 100).subscribe({
          next: (appResponse: any) => {
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
              isFrozen: false,
              freezeMessage: '',
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
        this.notificationService.success('Release promovido com sucesso! 🚀');
        this.closePromoteModal();
        this.loadAllReleases();
      },
      error: (err: any) => {
        console.error('Erro ao promover:', err);
        const errorMsg = err.error?.error?.message || err.message || 'Erro desconhecido';
        
        if (errorMsg.includes('already exists')) {
          const envLabel = this.getEnvLabel(this.promoteTargetEnv);
          this.notificationService.error(`Release já existe no ambiente ${envLabel}`);
        } else if (errorMsg.includes('bloqueada') || errorMsg.includes('blocked')) {
          this.notificationService.error('Promoção bloqueada: ' + errorMsg);
        } else if (errorMsg.includes('freeze')) {
          this.notificationService.error('Promoção bloqueada por janela de congelamento');
        } else if (errorMsg.includes('approval')) {
          this.notificationService.error('Faltam aprovações necessárias para promover');
        } else if (errorMsg.includes('score')) {
          this.notificationService.error('Score de evidência insuficiente para promover');
        } else {
          this.notificationService.error('Erro ao promover: ' + errorMsg);
        }
      }
    });
  }

  toggleMenu(releaseId: string, event: Event): void {
    event.stopPropagation();
    this.openMenuId = this.openMenuId === releaseId ? null : releaseId;
  }

  closeMenu(): void {
    this.openMenuId = null;
  }
}

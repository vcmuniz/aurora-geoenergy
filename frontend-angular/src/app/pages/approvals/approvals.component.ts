import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApprovalService } from '@core/services/approval.service';
import { ReleaseService } from '@core/services/release.service';
import { ApplicationService } from '@core/services/application.service';
import { AuthService } from '@core/services/auth.service';
import { Release } from '@shared/models/release.model';
import { Application } from '@shared/models/application.model';

interface PendingApproval {
  release: Release;
  application?: Application;
  hasApproval: boolean;
}

@Component({
  selector: 'app-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './approvals.component.html',
  styleUrls: ['./approvals.component.scss']
})
export class ApprovalsComponent implements OnInit {
  pendingApprovals: PendingApproval[] = [];
  approvedApprovals: PendingApproval[] = [];
  rejectedApprovals: PendingApproval[] = [];
  displayedApprovals: PendingApproval[] = [];
  
  allReleases: Release[] = [];
  applications: Map<string, Application> = new Map();
  approvalsByRelease: Map<string, any[]> = new Map();
  
  loading = false;
  showModal = false;
  modalMode: 'approve' | 'reject' = 'approve';
  selectedReleaseId = '';
  selectedFilter: 'pendentes' | 'aprovados' | 'rejeitados' = 'pendentes';
  
  formData = {
    notes: ''
  };
  
  currentUser = '';

  skip = 0;
  limit = 10;

  constructor(
    private approvalService: ApprovalService,
    private releaseService: ReleaseService,
    private applicationService: ApplicationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Pegar usuário do AuthService (já autenticado)
    this.authService.getCurrentUser$().subscribe(user => {
      if (user?.email) {
        this.currentUser = user.email;
        this.loadData();
      }
    });
  }

  loadData(): void {
    this.loading = true;
    // Carregar todos os releases
    this.releaseService.listAll(0, 1000).subscribe({
      next: (response: any) => {
        this.allReleases = response.data || [];
        // Carregar approvals para cada release
        this.loadAllApprovals();
      },
      error: (err) => {
        console.error('Erro ao carregar releases:', err);
        this.loading = false;
      }
    });
  }

  loadAllApprovals(): void {
    // Para cada release, carregar seus approvals
    let loaded = 0;
    
    this.allReleases.forEach(release => {
      this.approvalService.listByReleaseId(release.id).subscribe({
        next: (response: any) => {
          this.approvalsByRelease.set(release.id, response.data || []);
          loaded++;
          
          if (loaded === this.allReleases.length) {
            this.categorizeApprovals();
            this.loading = false;
          }
        },
        error: (err) => {
          console.error(`Erro ao carregar approvals de ${release.id}:`, err);
          this.approvalsByRelease.set(release.id, []);
          loaded++;
          
          if (loaded === this.allReleases.length) {
            this.categorizeApprovals();
            this.loading = false;
          }
        }
      });
    });
  }

  categorizeApprovals(): void {
    this.pendingApprovals = [];
    this.approvedApprovals = [];
    this.rejectedApprovals = [];
    
    // Coletar IDs de aplicações únicas
    const appIds = new Set<string>();
    this.allReleases.forEach(release => {
      appIds.add(release.applicationId);
    });
    
    // Carregar todas as aplicações em paralelo
    let loadedApps = 0;
    appIds.forEach(appId => {
      if (!this.applications.has(appId)) {
        this.applicationService.getById(appId).subscribe({
          next: (res: any) => {
            this.applications.set(appId, res.data);
            loadedApps++;
            if (loadedApps === appIds.size) {
              this.categorizeApprovalsWithApps();
            }
          },
          error: (err) => {
            console.error(`Erro ao carregar app ${appId}:`, err);
            loadedApps++;
            if (loadedApps === appIds.size) {
              this.categorizeApprovalsWithApps();
            }
          }
        });
      } else {
        loadedApps++;
        if (loadedApps === appIds.size) {
          this.categorizeApprovalsWithApps();
        }
      }
    });
  }

  categorizeApprovalsWithApps(): void {
    this.pendingApprovals = [];
    this.approvedApprovals = [];
    this.rejectedApprovals = [];
    
    this.allReleases.forEach(release => {
      const approvals = this.approvalsByRelease.get(release.id) || [];
      const userApproval = approvals.find(a => a.approverEmail === this.currentUser);
      const appId = release.applicationId;
      
      const approval: PendingApproval = {
        release,
        application: this.applications.get(appId),
        hasApproval: !!userApproval
      };
      
      if (userApproval) {
        if (userApproval.outcome === 'APPROVED') {
          this.approvedApprovals.push(approval);
        } else if (userApproval.outcome === 'REJECTED') {
          this.rejectedApprovals.push(approval);
        }
      } else {
        this.pendingApprovals.push(approval);
      }
    });
    
    this.filterApprovals();
  }

  filterApprovals(): void {
    if (this.selectedFilter === 'pendentes') {
      this.displayedApprovals = this.pendingApprovals;
    } else if (this.selectedFilter === 'aprovados') {
      this.displayedApprovals = this.approvedApprovals;
    } else if (this.selectedFilter === 'rejeitados') {
      this.displayedApprovals = this.rejectedApprovals;
    }
  }

  setFilter(filter: 'pendentes' | 'aprovados' | 'rejeitados'): void {
    this.selectedFilter = filter;
    this.filterApprovals();
  }

  openApprovalModal(approval: PendingApproval, mode: 'approve' | 'reject'): void {
    this.selectedReleaseId = approval.release.id;
    this.modalMode = mode;
    this.formData = { notes: '' };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  submitApproval(): void {
    if (!this.formData.notes.trim()) {
      alert('Adicione uma nota');
      return;
    }

    if (this.modalMode === 'approve') {
      this.approvalService.approve(this.selectedReleaseId, this.currentUser, this.formData.notes).subscribe({
        next: () => {
          this.loadData();
          this.closeModal();
        },
        error: (err) => console.error('Erro ao aprovar:', err)
      });
    } else {
      this.approvalService.reject(this.selectedReleaseId, this.currentUser, this.formData.notes).subscribe({
        next: () => {
          this.loadData();
          this.closeModal();
        },
        error: (err) => console.error('Erro ao rejeitar:', err)
      });
    }
  }

  getReleaseVersion(release: Release): string {
    return `v${release.version}`;
  }

  getApplicationName(release: Release): string {
    const app = this.applications.get(release.applicationId);
    return app?.name || 'Carregando...';
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApprovalService } from '@core/services/approval.service';
import { ReleaseService } from '@core/services/release.service';
import { ApplicationService } from '@core/services/application.service';
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
  Math = Math;
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

  // Pagination per tab
  skipPending = 0;
  limitPending = 10;
  totalPending = 0;
  
  skipApproved = 0;
  limitApproved = 10;
  totalApproved = 0;
  
  skipRejected = 0;
  limitRejected = 10;
  totalRejected = 0;

  constructor(
    private approvalService: ApprovalService,
    private releaseService: ReleaseService,
    private applicationService: ApplicationService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    
    // Carregar releases pendentes, aprovados e rejeitados em paralelo COM SKIP/LIMIT
    Promise.all([
      this.approvalService.listPendingCurrentUser(this.skipPending, this.limitPending).toPromise(),
      this.approvalService.listApprovedCurrentUser(this.skipApproved, this.limitApproved).toPromise(),
      this.approvalService.listRejectedCurrentUser(this.skipRejected, this.limitRejected).toPromise()
    ]).then(([pendingRes, approvedRes, rejectedRes]: any) => {
      let pendingReleases = pendingRes?.data?.data || [];
      const approvedReleases = approvedRes?.data?.data || [];
      const rejectedReleases = rejectedRes?.data?.data || [];
      
      // Filtrar releases PROD dos pendentes (não podem ser aprovados em PROD)
      pendingReleases = pendingReleases.filter((r: any) => r.env !== 'PROD');
      
      // Armazenar totals
      this.totalPending = pendingReleases.length;
      this.totalApproved = approvedRes?.data?.total || 0;
      this.totalRejected = rejectedRes?.data?.total || 0;
      
      // Categorizar releases
      this.pendingApprovals = pendingReleases.map((r: any) => ({
        release: r,
        application: undefined,
        hasApproval: false
      }));
      
      this.approvedApprovals = approvedReleases.map((r: any) => ({
        release: r,
        application: undefined,
        hasApproval: true
      }));
      
      this.rejectedApprovals = rejectedReleases.map((r: any) => ({
        release: r,
        application: undefined,
        hasApproval: true
      }));
      
      this.filterApprovals();
      this.loading = false;
    }).catch((err) => {
      console.error('Erro ao carregar releases:', err);
      this.loading = false;
    });
  }

  categorizeApprovalsWithApps(): void {
    // Já feito no loadData
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
      this.approvalService.approve(this.selectedReleaseId, this.formData.notes).subscribe({
        next: () => {
          this.allReleases = [];
          this.approvalsByRelease.clear();
          this.loadData();
          this.closeModal();
        },
        error: (err) => console.error('Erro ao aprovar:', err)
      });
    } else {
      this.approvalService.reject(this.selectedReleaseId, this.formData.notes).subscribe({
        next: () => {
          this.allReleases = [];
          this.approvalsByRelease.clear();
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

  onTabChange(tab: 'pendentes' | 'aprovados' | 'rejeitados'): void {
    this.selectedFilter = tab;
    this.updateDisplayed();
  }

  updateDisplayed(): void {
    if (this.selectedFilter === 'pendentes') {
      this.displayedApprovals = this.pendingApprovals;
    } else if (this.selectedFilter === 'aprovados') {
      this.displayedApprovals = this.approvedApprovals;
    } else {
      this.displayedApprovals = this.rejectedApprovals;
    }
  }

  previousPage(): void {
    if (this.selectedFilter === 'pendentes' && this.skipPending >= this.limitPending) {
      this.skipPending -= this.limitPending;
      this.loadData();
    } else if (this.selectedFilter === 'aprovados' && this.skipApproved >= this.limitApproved) {
      this.skipApproved -= this.limitApproved;
      this.loadData();
    } else if (this.selectedFilter === 'rejeitados' && this.skipRejected >= this.limitRejected) {
      this.skipRejected -= this.limitRejected;
      this.loadData();
    }
  }

  nextPage(): void {
    if (this.selectedFilter === 'pendentes' && (this.skipPending + this.limitPending) < this.totalPending) {
      this.skipPending += this.limitPending;
      this.loadData();
    } else if (this.selectedFilter === 'aprovados' && (this.skipApproved + this.limitApproved) < this.totalApproved) {
      this.skipApproved += this.limitApproved;
      this.loadData();
    } else if (this.selectedFilter === 'rejeitados' && (this.skipRejected + this.limitRejected) < this.totalRejected) {
      this.skipRejected += this.limitRejected;
      this.loadData();
    }
  }

  get canPrevious(): boolean {
    if (this.selectedFilter === 'pendentes') return this.skipPending > 0;
    if (this.selectedFilter === 'aprovados') return this.skipApproved > 0;
    if (this.selectedFilter === 'rejeitados') return this.skipRejected > 0;
    return false;
  }

  get canNext(): boolean {
    if (this.selectedFilter === 'pendentes') return (this.skipPending + this.limitPending) < this.totalPending;
    if (this.selectedFilter === 'aprovados') return (this.skipApproved + this.limitApproved) < this.totalApproved;
    if (this.selectedFilter === 'rejeitados') return (this.skipRejected + this.limitRejected) < this.totalRejected;
    return false;
  }

  onLimitChange(): void {
    if (this.selectedFilter === 'pendentes') {
      this.skipPending = 0;
    } else if (this.selectedFilter === 'aprovados') {
      this.skipApproved = 0;
    } else if (this.selectedFilter === 'rejeitados') {
      this.skipRejected = 0;
    }
    this.loadData();
  }

  onLimitSelectChange(event: any): void {
    const newLimit = parseInt(event.target.value, 10);
    if (this.selectedFilter === 'pendentes') {
      this.limitPending = newLimit;
      this.skipPending = 0;
    } else if (this.selectedFilter === 'aprovados') {
      this.limitApproved = newLimit;
      this.skipApproved = 0;
    } else if (this.selectedFilter === 'rejeitados') {
      this.limitRejected = newLimit;
      this.skipRejected = 0;
    }
    this.loadData();
  }
}

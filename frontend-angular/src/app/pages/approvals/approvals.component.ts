import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApprovalService } from '@core/services/approval.service';
import { ReleaseService } from '@core/services/release.service';
import { Approval } from '@shared/models/approval.model';
import { Release } from '@shared/models/release.model';

@Component({
  selector: 'app-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './approvals.component.html',
  styleUrls: ['./approvals.component.scss']
})
export class ApprovalsComponent implements OnInit {
  approvals: Approval[] = [];
  releases: Map<string, Release> = new Map();
  loading = false;
  showModal = false;
  modalMode: 'approve' | 'reject' = 'approve';
  selectedApprovalId = '';

  formData = {
    notes: '',
    outcome: ''
  };

  skip = 0;
  limit = 10;

  constructor(
    private approvalService: ApprovalService,
    private releaseService: ReleaseService
  ) {}

  ngOnInit(): void {
    this.loadApprovals();
  }

  loadApprovals(): void {
    this.loading = true;
    this.approvalService.list(this.skip, this.limit).subscribe({
      next: (response: any) => {
        this.approvals = response.data || [];
        this.loading = false;
        // Carregar releases para mostrar versão
        this.approvals.forEach(approval => {
          if (!this.releases.has(approval.releaseId)) {
            this.releaseService.getById(approval.releaseId).subscribe({
              next: (res: any) => {
                this.releases.set(approval.releaseId, res.data);
              },
              error: (err) => console.error('Erro ao carregar release:', err)
            });
          }
        });
      },
      error: (err) => {
        console.error('Erro ao carregar approvals:', err);
        this.loading = false;
      }
    });
  }

  openApprovalModal(approval: Approval, mode: 'approve' | 'reject'): void {
    if (approval.outcome) {
      alert('Este approval já foi respondido');
      return;
    }
    
    this.selectedApprovalId = approval.id;
    this.modalMode = mode;
    this.formData = {
      notes: '',
      outcome: mode === 'approve' ? 'APPROVED' : 'REJECTED'
    };
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

    const request = {
      outcome: this.formData.outcome,
      notes: this.formData.notes
    };

    this.approvalService.updateApprovalOutcome(this.selectedApprovalId, request).subscribe({
      next: () => {
        this.loadApprovals();
        this.closeModal();
      },
      error: (err) => console.error('Erro ao atualizar approval:', err)
    });
  }

  getReleaseVersion(releaseId: string): string {
    const release = this.releases.get(releaseId);
    return release ? `v${release.version}` : 'Carregando...';
  }

  previousPage(): void {
    if (this.skip >= this.limit) {
      this.skip -= this.limit;
      this.loadApprovals();
    }
  }

  nextPage(): void {
    this.skip += this.limit;
    this.loadApprovals();
  }

  getOutcomeStatus(outcome: string | null): string {
    if (!outcome) return 'PENDENTE';
    return outcome;
  }
}

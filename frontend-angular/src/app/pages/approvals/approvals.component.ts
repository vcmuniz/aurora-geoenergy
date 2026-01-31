import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApprovalService } from '@core/services/approval.service';
import { Approval, ApprovalRequest } from '@shared/models/approval.model';
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
  loading = false;
  showForm = false;
  selectedApproval: Approval | null = null;
  expandedApproval: string | null = null;

  formData: ApprovalRequest = {
    releaseId: '',
    outcome: 'APPROVED',
    notes: ''
  };

  skip = 0;
  limit = 10;

  constructor(private approvalService: ApprovalService) {}

  ngOnInit(): void {
    this.loadApprovals();
  }

  loadApprovals(): void {
    this.loading = true;
    this.approvalService.list(this.skip, this.limit).subscribe({
      next: (response: any) => {
        this.approvals = response.data || [];
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Erro ao carregar:', err);
        this.loading = false;
      }
    });
  }

  openForm(approval: Approval): void {
    this.selectedApproval = approval;
    this.formData = {
      releaseId: approval.releaseId,
      outcome: 'APPROVED',
      notes: ''
    };
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.selectedApproval = null;
  }

  save(): void {
    if (!this.formData.outcome) {
      alert('Resultado é obrigatório');
      return;
    }

    this.approvalService.approve(this.formData).subscribe({
      next: () => {
        this.loadApprovals();
        this.closeForm();
      },
      error: (err: any) => console.error('Erro ao aprovar:', err)
    });
  }

  toggleExpand(id: string): void {
    this.expandedApproval = this.expandedApproval === id ? null : id;
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
}

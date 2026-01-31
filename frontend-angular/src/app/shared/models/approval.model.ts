export type ApprovalOutcome = 'APPROVED' | 'REJECTED';

export interface Approval {
  id: string;
  releaseId: string;
  approverEmail: string;
  outcome: ApprovalOutcome;
  notes?: string;
  createdAt: Date;
}

export interface ApprovalRequest {
  releaseId: string;
  outcome: ApprovalOutcome;
  notes?: string;
}

export interface ApprovalResponse extends Approval {}

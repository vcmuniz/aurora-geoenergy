export type ReleaseEnv = 'DEV' | 'PRE_PROD' | 'PROD';
export type ReleaseStatus = 'PENDING' | 'APPROVED' | 'DEPLOYED' | 'REJECTED';

export interface Release {
  id: string;
  applicationId: string;
  applicationName?: string;
  version: string;
  env: ReleaseEnv;
  status: ReleaseStatus;
  evidenceUrl?: string;
  evidenceScore: number;
  versionRow: number;
  createdAt: Date;
  deployedAt?: Date;
}

export interface ReleaseRequest {
  applicationId: string;
  version: string;
  env: ReleaseEnv;
  evidenceUrl?: string;
  evidenceScore?: number;
  actor?: string;
}

export interface ReleaseResponse extends Release {}

export interface PreLaunchChecklist {
  approvalsOk: boolean;
  evidenceOk: boolean;
  scoreOk: boolean;
  freezeOk: boolean;
  ready: boolean;
}

export interface ReleaseTimeline {
  releaseId: string;
  events: ReleaseTimelineEvent[];
}

export interface ReleaseTimelineEvent {
  status: ReleaseStatus;
  timestamp: Date;
  actor?: string;
  notes?: string;
}

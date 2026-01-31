export interface AuditLog {
  id: string;
  actor: string;
  action: string;
  entity: string;
  entityId: string;
  payload: Record<string, any>;
  timestamp: Date;
  createdAt: Date;
  requestId: string;
}

export interface AuditLogFilters {
  actor?: string;
  action?: string;
  entity?: string;
  startDate?: Date;
  endDate?: Date;
  skip?: number;
  limit?: number;
}

export interface AuditLogResponse extends AuditLog {}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditLogService } from '@core/services/audit-log.service';
import { ReleaseService } from '@core/services/release.service';

interface AuditLog {
  id: string;
  actor: string;
  action: string;
  entity: string;
  entityId: string;
  payload: any;
  requestId: string;
  createdAt: Date;
}

interface Release {
  id: string;
  version: string;
  env: string;
}

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './audit-logs.component.html',
  styleUrls: ['./audit-logs.component.scss']
})
export class AuditLogsComponent implements OnInit {
  Math = Math;
  auditLogs: AuditLog[] = [];
  loading = false;
  skip = 0;
  limit = 5;
  total = 0;
  showDetailsModal = false;
  selectedLog: AuditLog | null = null;
  releaseCache: Map<string, Release> = new Map();

  constructor(
    private auditLogService: AuditLogService,
    private releaseService: ReleaseService
  ) {}
  ngOnInit(): void {
    this.loadAuditLogs();
  }

  loadAuditLogs(): void {
    this.loading = true;
    this.auditLogService.list(this.skip, this.limit).subscribe({
      next: (response: any) => {
        this.auditLogs = response.data?.data || [];
        this.total = response.data?.total || 0;
        this.loading = false;
        // Carregar informações de releases para melhorar descrições
        this.auditLogs.forEach(log => {
          if (log.payload?.release_id) {
            this.loadReleaseInfo(log.payload.release_id);
          }
        });
      },
      error: (err) => {
        console.error('Erro ao carregar audit logs:', err);
        this.loading = false;
      }
    });
  }

  openDetailsModal(log: AuditLog): void {
    this.selectedLog = log;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedLog = null;
  }

  onLimitChange(): void {
    this.skip = 0;
    this.loadAuditLogs();
  }

  getActionLabel(action: string): string {
    const labels: { [key: string]: string } = {
      'CREATE': '✨ Criar',
      'UPDATE': '✏️ Atualizar',
      'DELETE': '🗑️ Deletar',
      'APPROVE': '✅ Aprovar',
      'REJECT': '❌ Rejeitar',
      'PROMOTE': '⬆️ Promover'
    };
    return labels[action] || action;
  }

  getActionColor(action: string): string {
    const colors: { [key: string]: string } = {
      'CREATE': 'create',
      'UPDATE': 'update',
      'DELETE': 'delete',
      'APPROVE': 'approve',
      'REJECT': 'reject',
      'PROMOTE': 'promote'
    };
    return colors[action] || 'default';
  }

  getActionDescription(log: AuditLog): string {
    const action = log.action;
    const entity = log.entity;
    const payload = log.payload || {};

    // Se temos dados no payload, usa direto
    if (payload.version && payload.environment) {
      if (action === 'CREATE' && entity === 'RELEASE') {
        return `Criou release ${payload.version} para ${payload.environment}`;
      }
      if (action === 'APPROVE') {
        return `Aprovou release v${payload.version} (${payload.environment})`;
      }
      if (action === 'REJECT') {
        return `Rejeitou release v${payload.version} (${payload.environment})`;
      }
      if (action === 'PROMOTE') {
        const toEnv = payload.to_env || payload.environment || 'ambiente';
        const fromEnv = payload.from_env || '';
        const appName = payload.application_name || 'aplicação';
        const desc = fromEnv ? `Promoveu release v${payload.version} (${appName}) de ${fromEnv} para ${toEnv}` : `Promoveu release v${payload.version} (${appName}) para ${toEnv}`;
        return desc;
      }
    }

    // Fallback: tenta buscar do cache de releases
    if ((action === 'APPROVE' || action === 'REJECT' || action === 'PROMOTE') && payload.release_id) {
      const release = this.releaseCache.get(payload.release_id);
      if (release) {
        if (action === 'APPROVE') {
          return `Aprovou release v${release.version} (${release.env})`;
        }
        if (action === 'REJECT') {
          return `Rejeitou release v${release.version} (${release.env})`;
        }
        if (action === 'PROMOTE') {
          const toEnv = payload.to_env || 'outro ambiente';
          const fromEnv = payload.from_env || release.env || '';
          const appName = payload.application_name || 'aplicação';
          return fromEnv ? `Promoveu release v${release.version} (${appName}) de ${fromEnv} para ${toEnv}` : `Promoveu release v${release.version} (${appName}) para ${toEnv}`;
        }
      }
    }

    // Fallback final: descrição genérica
    if (action === 'CREATE' && entity === 'RELEASE') {
      return `Criou release`;
    }
    if (action === 'CREATE' && entity === 'APPROVAL') {
      return `Criou aprovação para release`;
    }
    if (action === 'APPROVE') {
      return `Aprovou release`;
    }
    if (action === 'REJECT') {
      return `Rejeitou release`;
    }
    if (action === 'PROMOTE') {
      return `Promoveu release`;
    }
    if (action === 'UPDATE') {
      return `Atualizou ${entity.toLowerCase()}`;
    }
    if (action === 'DELETE') {
      return `Deletou ${entity.toLowerCase()}`;
    }

    return `${action} em ${entity}`;
  }

  loadReleaseInfo(releaseId: string): void {
    if (this.releaseCache.has(releaseId)) {
      return;
    }
    this.releaseService.getById(releaseId).subscribe({
      next: (res: any) => {
        const release = res.data;
        this.releaseCache.set(releaseId, {
          id: release.id,
          version: release.version,
          env: release.env
        });
      },
      error: (err) => console.error('Erro ao carregar release:', err)
    });
  }

  previousPage(): void {
    if (this.skip >= this.limit) {
      this.skip -= this.limit;
      this.loadAuditLogs();
    }
  }

  nextPage(): void {
    if ((this.skip + this.limit) < this.total) {
      this.skip += this.limit;
      this.loadAuditLogs();
    }
  }

  get canPrevious(): boolean {
    return this.skip > 0;
  }

  get canNext(): boolean {
    return (this.skip + this.limit) < this.total;
  }
}


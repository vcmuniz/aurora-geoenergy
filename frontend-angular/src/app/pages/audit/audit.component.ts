import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditService } from '@core/services/audit.service';
import { AuditLog } from '@shared/models/audit.model';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './audit.component.html',
  styleUrls: ['./audit.component.scss']
})
export class AuditComponent implements OnInit {
  auditLogs: AuditLog[] = [];
  loading = false;
  expandedLog: string | null = null;

  filterActor = '';
  filterAction = '';

  skip = 0;
  limit = 20;

  constructor(private auditService: AuditService) {}

  ngOnInit(): void {
    this.loadAuditLogs();
  }

  loadAuditLogs(): void {
    this.loading = true;
    this.auditService.list(this.skip, this.limit).subscribe({
      next: (response: any) => {
        this.auditLogs = response.data || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar:', err);
        this.loading = false;
      }
    });
  }

  onFilterChange(): void {
    this.skip = 0;
    this.loadAuditLogs();
  }

  toggleExpand(id: string): void {
    this.expandedLog = this.expandedLog === id ? null : id;
  }

  getFilteredLogs(): AuditLog[] {
    return this.auditLogs.filter((log) => {
      const actorMatch = !this.filterActor || log.actor.toLowerCase().includes(this.filterActor.toLowerCase());
      const actionMatch = !this.filterAction || log.action.toLowerCase().includes(this.filterAction.toLowerCase());
      return actorMatch && actionMatch;
    });
  }

  previousPage(): void {
    if (this.skip >= this.limit) {
      this.skip -= this.limit;
      this.loadAuditLogs();
    }
  }

  nextPage(): void {
    this.skip += this.limit;
    this.loadAuditLogs();
  }
}
